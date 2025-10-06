import {
  users,
  categories,
  posts,
  comments,
  postLikes,
  commentLikes,
  notifications,
  reports,
  type User,
  type UpsertUser,
  type RegisterData,
  type Category,
  type InsertCategory,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type PostWithAuthorAndCategory,
  type CommentWithAuthor,
  type Notification,
  type InsertNotification,
  type Report,
  type InsertReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, count, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: RegisterData): Promise<User>;
  updateUserReputation(userId: string, points: number): Promise<void>;
  getUserActivity(userId: string, limit?: number): Promise<any[]>;
  updateUserProfile(userId: string, profileData: { firstName?: string; lastName?: string; }): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategoryStats(categoryId: string, postCount: number, memberCount: number): Promise<void>;

  // Post operations
  getPosts(categoryId?: string, limit?: number, offset?: number): Promise<PostWithAuthorAndCategory[]>;
  getPostById(id: string): Promise<PostWithAuthorAndCategory | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
  incrementPostViews(id: string): Promise<void>;
  getPostsByUserId(userId: string, limit?: number): Promise<PostWithAuthorAndCategory[]>;
  searchPosts(query: string, categoryId?: string, limit?: number): Promise<PostWithAuthorAndCategory[]>;

  // Comment operations
  getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]>;
  getCommentById(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, content: string): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;

  // Like operations
  togglePostLike(userId: string, postId: string): Promise<boolean>;
  toggleCommentLike(userId: string, commentId: string): Promise<boolean>;
  getUserPostLike(userId: string, postId: string): Promise<boolean>;
  getUserCommentLike(userId: string, commentId: string): Promise<boolean>;

  // Notification operations
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string, limit?: number): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<void>;

  // Stats operations
  getCommunityStats(): Promise<{
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    onlineUsers: number;
  }>;

  getTrendingPosts(limit?: number): Promise<PostWithAuthorAndCategory[]>;
  getTopContributors(limit?: number): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterData): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: "user", // SECURITY: Always force "user" role for public registrations
        reputation: 0,
      })
      .returning();
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email or id
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.id, userData.id), eq(users.email, userData.email!)))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  }

  async updateUserReputation(userId: string, points: number): Promise<void> {
    await db
      .update(users)
      .set({
        reputation: sql`${users.reputation} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserActivity(userId: string, limit = 20): Promise<any[]> {
    // Get user's posts
    const userPosts = await db
      .select({
        type: sql<string>`'post'`,
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        categoryName: categories.name,
        entityId: posts.id,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    // Get user's comments
    const userComments = await db
      .select({
        type: sql<string>`'comment'`,
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        postTitle: posts.title,
        entityId: comments.postId,
      })
      .from(comments)
      .leftJoin(posts, eq(comments.postId, posts.id))
      .where(eq(comments.authorId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(limit);

    // Get user's post likes
    const userPostLikes = await db
      .select({
        type: sql<string>`'post_like'`,
        id: postLikes.id,
        createdAt: postLikes.createdAt,
        postTitle: posts.title,
        entityId: posts.id,
      })
      .from(postLikes)
      .leftJoin(posts, eq(postLikes.postId, posts.id))
      .where(eq(postLikes.userId, userId))
      .orderBy(desc(postLikes.createdAt))
      .limit(limit);

    // Combine all activities and sort by date
    const allActivities = [
      ...userPosts.map(p => ({
        ...p,
        type: 'post' as const,
        title: p.title,
        description: `Created post: ${p.title}`,
        categoryName: p.categoryName,
      })),
      ...userComments.map(c => ({
        ...c,
        type: 'comment' as const,
        title: 'Comment',
        description: `Commented on: ${c.postTitle}`,
        content: c.content,
      })),
      ...userPostLikes.map(l => ({
        ...l,
        type: 'post_like' as const,
        title: 'Like',
        description: `Liked post: ${l.postTitle}`,
      })),
    ];

    return allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async updateUserProfile(userId: string, profileData: { firstName?: string; lastName?: string; }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategoryStats(categoryId: string, postCount: number, memberCount: number): Promise<void> {
    await db
      .update(categories)
      .set({ postCount, memberCount })
      .where(eq(categories.id, categoryId));
  }

  async getPosts(categoryId?: string, limit = 20, offset = 0): Promise<PostWithAuthorAndCategory[]> {
    const query = db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        isPinned: posts.isPinned,
        isLocked: posts.isLocked,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        lastActivityAt: posts.lastActivityAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          reputation: users.reputation,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          slug: categories.slug,
          icon: categories.icon,
          color: categories.color,
          postCount: categories.postCount,
          memberCount: categories.memberCount,
          createdAt: categories.createdAt,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.lastActivityAt))
      .limit(limit)
      .offset(offset);

    if (categoryId) {
      query.where(eq(posts.categoryId, categoryId));
    }

    return await query;
  }

  async getPostById(id: string): Promise<PostWithAuthorAndCategory | undefined> {
    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        isPinned: posts.isPinned,
        isLocked: posts.isLocked,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        lastActivityAt: posts.lastActivityAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          reputation: users.reputation,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          slug: categories.slug,
          icon: categories.icon,
          color: categories.color,
          postCount: categories.postCount,
          memberCount: categories.memberCount,
          createdAt: categories.createdAt,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.id, id));

    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    
    // Update category post count
    await db
      .update(categories)
      .set({
        postCount: sql`${categories.postCount} + 1`,
      })
      .where(eq(categories.id, post.categoryId));

    return newPost;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: string): Promise<void> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (post) {
      await db.delete(posts).where(eq(posts.id, id));
      
      // Update category post count
      await db
        .update(categories)
        .set({
          postCount: sql`${categories.postCount} - 1`,
        })
        .where(eq(categories.id, post.categoryId));
    }
  }

  async incrementPostViews(id: string): Promise<void> {
    await db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
      })
      .where(eq(posts.id, id));
  }

  async getPostsByUserId(userId: string, limit = 10): Promise<PostWithAuthorAndCategory[]> {
    return await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        isPinned: posts.isPinned,
        isLocked: posts.isLocked,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        lastActivityAt: posts.lastActivityAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          reputation: users.reputation,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          slug: categories.slug,
          icon: categories.icon,
          color: categories.color,
          postCount: categories.postCount,
          memberCount: categories.memberCount,
          createdAt: categories.createdAt,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async searchPosts(query: string, categoryId?: string, limit = 20): Promise<PostWithAuthorAndCategory[]> {
    const searchQuery = db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        isPinned: posts.isPinned,
        isLocked: posts.isLocked,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        lastActivityAt: posts.lastActivityAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          reputation: users.reputation,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          slug: categories.slug,
          icon: categories.icon,
          color: categories.color,
          postCount: categories.postCount,
          memberCount: categories.memberCount,
          createdAt: categories.createdAt,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(
        and(
          or(
            like(posts.title, `%${query}%`),
            like(posts.content, `%${query}%)`)
          ),
          categoryId ? eq(posts.categoryId, categoryId) : undefined
        )
      )
      .orderBy(desc(posts.lastActivityAt))
      .limit(limit);

    return await searchQuery;
  }

  async getCommentById(id: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    const allComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorId: comments.authorId,
        postId: comments.postId,
        parentId: comments.parentId,
        likeCount: comments.likeCount,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          reputation: users.reputation,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));

    // Organize comments into a tree structure
    const commentMap = new Map<string, CommentWithAuthor>();
    const rootComments: CommentWithAuthor[] = [];

    // First pass: create all comment objects
    allComments.forEach(comment => {
      const commentWithChildren: CommentWithAuthor = {
        ...comment,
        children: [],
      };
      commentMap.set(comment.id, commentWithChildren);
    });

    // Second pass: organize into tree structure
    allComments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(commentWithChildren);
        }
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Update post reply count
    await db
      .update(posts)
      .set({
        replyCount: sql`${posts.replyCount} + 1`,
        lastActivityAt: new Date(),
      })
      .where(eq(posts.id, comment.postId));

    return newComment;
  }

  async updateComment(id: string, content: string): Promise<Comment | undefined> {
    const [updatedComment] = await db
      .update(comments)
      .set({ content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: string): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db
        .update(comments)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(comments.id, id));
      
      // Update post reply count
      await db
        .update(posts)
        .set({
          replyCount: sql`${posts.replyCount} - 1`,
        })
        .where(eq(posts.id, comment.postId));
    }
  }

  async togglePostLike(userId: string, postId: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));

    if (existingLike) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
      
      await db
        .update(posts)
        .set({ likeCount: sql`${posts.likeCount} - 1` })
        .where(eq(posts.id, postId));
      
      return false;
    } else {
      await db.insert(postLikes).values({ userId, postId });
      
      await db
        .update(posts)
        .set({ likeCount: sql`${posts.likeCount} + 1` })
        .where(eq(posts.id, postId));
      
      return true;
    }
  }

  async toggleCommentLike(userId: string, commentId: string): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));

    if (existingLike) {
      await db
        .delete(commentLikes)
        .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
      
      await db
        .update(comments)
        .set({ likeCount: sql`${comments.likeCount} - 1` })
        .where(eq(comments.id, commentId));
      
      return false;
    } else {
      await db.insert(commentLikes).values({ userId, commentId });
      
      await db
        .update(comments)
        .set({ likeCount: sql`${comments.likeCount} + 1` })
        .where(eq(comments.id, commentId));
      
      return true;
    }
  }

  async getUserPostLike(userId: string, postId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
    return !!like;
  }

  async getUserCommentLike(userId: string, commentId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    return !!like;
  }

  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.count;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(status?: string, limit = 50): Promise<Report[]> {
    const query = db.select().from(reports).orderBy(desc(reports.createdAt)).limit(limit);
    
    if (status) {
      query.where(eq(reports.status, status));
    }
    
    return await query;
  }

  async updateReportStatus(id: string, status: string): Promise<void> {
    await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id));
  }

  async getCommunityStats(): Promise<{
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    onlineUsers: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [postCount] = await db.select({ count: count() }).from(posts);
    const [commentCount] = await db.select({ count: count() }).from(comments);
    
    // For demo purposes, online users is a fraction of total users
    const onlineUsers = Math.floor(userCount.count * 0.1);

    return {
      totalUsers: userCount.count,
      totalPosts: postCount.count,
      totalComments: commentCount.count,
      onlineUsers,
    };
  }

  async getTrendingPosts(limit = 10): Promise<PostWithAuthorAndCategory[]> {
    return await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        authorId: posts.authorId,
        categoryId: posts.categoryId,
        isPinned: posts.isPinned,
        isLocked: posts.isLocked,
        viewCount: posts.viewCount,
        likeCount: posts.likeCount,
        replyCount: posts.replyCount,
        lastActivityAt: posts.lastActivityAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          reputation: users.reputation,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          slug: categories.slug,
          icon: categories.icon,
          color: categories.color,
          postCount: categories.postCount,
          memberCount: categories.memberCount,
          createdAt: categories.createdAt,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .innerJoin(categories, eq(posts.categoryId, categories.id))
      .where(sql`${posts.createdAt} > NOW() - INTERVAL '7 days'`)
      .orderBy(desc(sql`${posts.likeCount} + ${posts.replyCount} + ${posts.viewCount}`))
      .limit(limit);
  }

  async getTopContributors(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.reputation))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
