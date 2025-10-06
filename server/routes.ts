import type { Express } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { setupAuth, requireAuth, isAdmin, isModerator, isModeratorOrAdmin } from "./auth";
import { insertPostSchema, insertCommentSchema, insertReportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Traditional authentication setup
  setupAuth(app);
  
  // Store session middleware for WebSocket authentication
  const sessionMiddleware = app._router.stack.find((layer: any) => 
    layer.name === 'session'
  )?.handle;

  // Note: auth routes (/api/register, /api/login, /api/logout, /api/user) are now handled in auth.ts

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Posts routes
  app.get('/api/posts', async (req, res) => {
    try {
      const { categoryId, limit, offset } = req.query;
      const posts = await storage.getPosts(
        categoryId as string,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/trending', async (req, res) => {
    try {
      const { limit } = req.query;
      const posts = await storage.getTrendingPosts(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching trending posts:", error);
      res.status(500).json({ message: "Failed to fetch trending posts" });
    }
  });

  app.get('/api/posts/search', async (req, res) => {
    try {
      const { q, categoryId, limit } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const posts = await storage.searchPosts(
        q,
        categoryId as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(posts);
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ message: "Failed to search posts" });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementPostViews(id);
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put('/api/posts/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if user owns the post
      const existingPost = await storage.getPostById(id);
      if (!existingPost || existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }
      
      const updates = insertPostSchema.partial().parse(req.body);
      const updatedPost = await storage.updatePost(id, updates);
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if user owns the post
      const existingPost = await storage.getPostById(id);
      if (!existingPost || existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      await storage.deletePost(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comments routes
  app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:postId/comments', requireAuth, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId,
        authorId: userId,
      });
      
      const comment = await storage.createComment(commentData);
      
      // Broadcast comment creation to other clients viewing this thread
      if ((app as any).broadcastThreadUpdate) {
        (app as any).broadcastThreadUpdate('comment_created', postId, {
          comment: comment,
          authorId: userId
        });
      }
      
      // Send notification to post author if not commenting on own post
      const post = await storage.getPostById(postId);
      if (post && post.authorId !== userId && (app as any).sendNotificationToUser) {
        await (app as any).sendNotificationToUser(post.authorId, {
          type: 'comment',
          title: 'New Comment',
          message: `Someone commented on your post: "${post.title}"`,
          entityType: 'post',
          entityId: postId
        });
      }
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Like routes
  app.post('/api/posts/:id/like', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const liked = await storage.togglePostLike(userId, id);
      
      // Broadcast like update to other clients viewing this thread
      if ((app as any).broadcastThreadUpdate) {
        (app as any).broadcastThreadUpdate('post_liked', id, {
          liked: liked,
          userId: userId
        });
      }
      
      // Send notification to post author if liking someone else's post
      if (liked) {
        const post = await storage.getPostById(id);
        if (post && post.authorId !== userId && (app as any).sendNotificationToUser) {
          await (app as any).sendNotificationToUser(post.authorId, {
            type: 'like',
            title: 'Post Liked',
            message: `Someone liked your post: "${post.title}"`,
            entityType: 'post',
            entityId: id
          });
        }
      }
      
      res.json({ liked });
    } catch (error) {
      console.error("Error toggling post like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post('/api/comments/:id/like', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const liked = await storage.toggleCommentLike(userId, id);
      
      // Get comment to find associated post for broadcasting
      const comment = await storage.getCommentById(id);
      if (comment && (app as any).broadcastThreadUpdate) {
        (app as any).broadcastThreadUpdate('comment_liked', comment.postId, {
          commentId: id,
          liked: liked,
          userId: userId
        });
      }
      
      // Send notification to comment author if liking someone else's comment
      if (liked && comment && comment.authorId !== userId && (app as any).sendNotificationToUser) {
        await (app as any).sendNotificationToUser(comment.authorId, {
          type: 'like',
          title: 'Comment Liked',
          message: 'Someone liked your comment',
          entityType: 'comment',
          entityId: id
        });
      }
      
      res.json({ liked });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.get('/api/posts/:id/like', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const liked = await storage.getUserPostLike(userId, id);
      res.json({ liked });
    } catch (error) {
      console.error("Error checking post like:", error);
      res.status(500).json({ message: "Failed to check like" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { limit } = req.query;
      
      const notifications = await storage.getNotifications(
        userId,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/read-all', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Reports routes
  app.post('/api/reports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: userId,
      });
      
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // User profile routes
  app.get('/api/users/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose sensitive information
      const publicUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        reputation: user.reputation,
        createdAt: user.createdAt,
      };
      
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:id/posts', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      
      const posts = await storage.getPostsByUserId(
        id,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.get('/api/users/:id/activity', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      
      const activity = await storage.getUserActivity(
        id,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.put('/api/users/:id/profile', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Input validation with Zod
      const profileUpdateSchema = z.object({
        firstName: z.string().trim().max(50).optional(),
        lastName: z.string().trim().max(50).optional(),
      });
      
      const validatedData = profileUpdateSchema.parse(req.body);
      
      // Check if user is updating their own profile - use consistent auth
      if (req.user.id !== id) {
        return res.status(403).json({ message: "You can only edit your own profile" });
      }
      
      const updatedUser = await storage.updateUserProfile(id, validatedData);
      
      // Don't expose sensitive information
      const publicUser = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        reputation: updatedUser.reputation,
        createdAt: updatedUser.createdAt,
      };
      
      res.json(publicUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      
      // Handle validation errors properly
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Community stats routes
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getCommunityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching community stats:", error);
      res.status(500).json({ message: "Failed to fetch community stats" });
    }
  });

  app.get('/api/contributors/top', async (req, res) => {
    try {
      const { limit } = req.query;
      const contributors = await storage.getTopContributors(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(contributors);
    } catch (error) {
      console.error("Error fetching top contributors:", error);
      res.status(500).json({ message: "Failed to fetch top contributors" });
    }
  });

  // Initialize default categories
  const initializeCategories = async () => {
    try {
      const existingCategories = await storage.getCategories();
      if (existingCategories.length === 0) {
        const defaultCategories = [
          {
            name: "🏢 Business",
            description: "Entrepreneurship, Finance, Marketing, Management, Startups",
            slug: "business",
            icon: "🏢",
            color: "#3b82f6",
          },
          {
            name: "🏛️ Government",
            description: "Policy, Politics, Public Service, Civic Engagement, Law",
            slug: "government",
            icon: "🏛️",
            color: "#6366f1",
          },
          {
            name: "🏖️ Tourism",
            description: "Travel, Destinations, Culture, Adventure, Local Experiences",
            slug: "tourism",
            icon: "🏖️",
            color: "#06b6d4",
          },
          {
            name: "🎤 Celebrity",
            description: "Entertainment, Music, Movies, Sports, Pop Culture",
            slug: "celebrity",
            icon: "🎤",
            color: "#f59e0b",
          },
          {
            name: "🏥 Health",
            description: "Medical, Wellness, Fitness, Mental Health, Nutrition",
            slug: "health",
            icon: "🏥",
            color: "#10b981",
          },
          {
            name: "👪 Family Tree",
            description: "Genealogy, Ancestry, Family History, Heritage, Traditions",
            slug: "family-tree",
            icon: "👪",
            color: "#8b5cf6",
          },
          {
            name: "🎓 Education",
            description: "Learning, Schools, Teaching, Skills, Academic, Courses",
            slug: "education",
            icon: "🎓",
            color: "#ef4444",
          },
        ];

        for (const category of defaultCategories) {
          await storage.createCategory(category);
        }
        
        console.log("Default categories initialized");
      }
    } catch (error) {
      console.error("Error initializing categories:", error);
    }
  };

  await initializeCategories();

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time features with session-based authentication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info: any) => {
      // Allow connection, but verify auth during handshake
      return true;
    }
  });

  interface AuthenticatedClientInfo {
    userId: string; // Always set for authenticated clients
    ws: WebSocket;
    currentThread?: string; // Track which thread the user is viewing
  }

  const authenticatedClients = new Map<WebSocket, AuthenticatedClientInfo>();

  // Helper function to authenticate WebSocket connection using session
  const authenticateWebSocket = async (req: any): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!sessionMiddleware) {
        console.error('Session middleware not found for WebSocket auth');
        resolve(null);
        return;
      }

      // Create mock response object for session middleware
      const res = {
        setHeader: () => {},
        getHeader: () => {},
        end: () => {},
        write: () => {},
        on: () => {},
        once: () => {},
        emit: () => {}
      } as any;

      sessionMiddleware(req, res, () => {
        try {
          if (req.session?.passport?.user?.claims?.sub) {
            resolve(req.session.passport.user.claims.sub);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Error extracting user from session:', error);
          resolve(null);
        }
      });
    });
  };

  // Server-side broadcast functions for authenticated operations
  const broadcastThreadUpdate = (action: string, postId: string, data: any) => {
    authenticatedClients.forEach((clientInfo, ws) => {
      if (clientInfo.currentThread === postId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'thread_update',
          action: action,
          postId: postId,
          ...data
        }));
      }
    });
  };

  const sendNotificationToUser = async (targetUserId: string, notification: any) => {
    // Create notification in database first
    await storage.createNotification({
      userId: targetUserId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId,
    });

    // Send real-time notification to target user if online
    authenticatedClients.forEach((clientInfo, ws) => {
      if (clientInfo.userId === targetUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          notification: {
            ...notification,
            createdAt: new Date().toISOString(),
          },
        }));
      }
    });
  };

  // Expose broadcast functions for use in routes
  (app as any).broadcastThreadUpdate = broadcastThreadUpdate;
  (app as any).sendNotificationToUser = sendNotificationToUser;

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log('WebSocket client attempting connection');
    
    // Authenticate the connection using Express session
    const userId = await authenticateWebSocket(req);
    
    if (!userId) {
      console.log('WebSocket connection rejected: Not authenticated');
      ws.close(1008, 'Authentication required');
      return;
    }

    console.log(`WebSocket client authenticated as user: ${userId}`);
    authenticatedClients.set(ws, { userId, ws });
    
    // Send authentication confirmation
    ws.send(JSON.stringify({ type: 'authenticated', userId }));

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        const client = authenticatedClients.get(ws);
        
        // All messages require authenticated client
        if (!client) {
          console.warn('Received message from unauthenticated WebSocket');
          return;
        }

        if (data.type === 'join_thread' && data.postId) {
          client.currentThread = data.postId;
          authenticatedClients.set(ws, client);
          console.log(`User ${client.userId} joined thread ${data.postId}`);
        }

        if (data.type === 'leave_thread') {
          client.currentThread = undefined;
          authenticatedClients.set(ws, client);
          console.log(`User ${client.userId} left thread`);
        }

        // Remove client-controlled thread_update and notification messages
        // These are now only triggered by server-side REST API operations
        
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      const client = authenticatedClients.get(ws);
      console.log(`WebSocket client disconnected: ${client?.userId || 'unknown'}`);
      authenticatedClients.delete(ws);
    });

    ws.on('error', (error) => {
      const client = authenticatedClients.get(ws);
      console.error(`WebSocket error for user ${client?.userId || 'unknown'}:`, error);
      authenticatedClients.delete(ws);
    });
  });

  return httpServer;
}
