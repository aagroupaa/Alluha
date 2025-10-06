import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/components/websocket-provider";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Share2, 
  Flag, 
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CommentWithAuthor, PostWithAuthorAndCategory } from "@shared/schema";

interface CommentProps {
  comment: CommentWithAuthor;
  level?: number;
  postId: string;
}

function Comment({ comment, level = 0, postId }: CommentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/comments`, {
        content,
        parentId: comment.id,
      });
    },
    onSuccess: async (response) => {
      const newReply = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      setReplyContent("");
      setIsReplying(false);
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
      
      // Real-time updates are handled server-side
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/comments/${comment.id}/like`);
    },
    onSuccess: async (response) => {
      const likeResult = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      
      // Real-time updates are handled server-side
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to like comment.",
        variant: "destructive",
      });
    },
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  const authorName = `${comment.author.firstName || ""} ${comment.author.lastName || ""}`.trim() || "Anonymous User";

  return (
    <div 
      className={`${level > 0 ? "ml-8 border-l border-border pl-4" : ""}`}
      data-testid={`comment-${comment.id}`}
    >
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.author.profileImageUrl || undefined} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="font-medium text-foreground cursor-pointer hover:text-primary"
                  onClick={() => window.location.href = `/user/${comment.author.id}`}
                  data-testid={`text-comment-author-${comment.id}`}
                >
                  {authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {comment.author.reputation || 0} points
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt || Date.now()), { addSuffix: true })}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">edited</span>
                  </>
                )}
              </div>
              
              <div 
                className="prose prose-sm max-w-none mb-3 text-foreground"
                data-testid={`text-comment-content-${comment.id}`}
              >
                {comment.content}
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className="h-8 px-2 text-muted-foreground hover:text-accent"
                  data-testid={`button-like-comment-${comment.id}`}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  {comment.likeCount || 0}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                  data-testid={`button-reply-comment-${comment.id}`}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Reply
                </Button>
                
                {comment.children && comment.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {comment.children.length} replies
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {isReplying && (
            <div className="mt-4 ml-11 space-y-3">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
                data-testid={`textarea-reply-${comment.id}`}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={replyMutation.isPending || !replyContent.trim()}
                  data-testid={`button-submit-reply-${comment.id}`}
                >
                  {replyMutation.isPending ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                  }}
                  data-testid={`button-cancel-reply-${comment.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isExpanded && comment.children && comment.children.length > 0 && (
        <div className="space-y-0">
          {comment.children.map((childComment) => (
            <Comment
              key={childComment.id}
              comment={childComment}
              level={level + 1}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { joinThread, leaveThread } = useWebSocket();
  const [newComment, setNewComment] = useState("");

  // Join/leave thread for real-time updates
  useEffect(() => {
    if (id && isAuthenticated) {
      joinThread(id);
      return () => {
        leaveThread();
      };
    }
  }, [id, isAuthenticated, joinThread, leaveThread]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: post, isLoading: postLoading, error: postError } = useQuery<PostWithAuthorAndCategory>({
    queryKey: ["/api/posts", id],
    enabled: !!id && isAuthenticated,
  });

  // Handle post error
  useEffect(() => {
    if (postError && isUnauthorizedError(postError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [postError, toast]);

  const { data: comments = [], isLoading: commentsLoading, error: commentsError } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/posts", id, "comments"],
    enabled: !!id && isAuthenticated,
  });

  // Handle comments error
  useEffect(() => {
    if (commentsError && isUnauthorizedError(commentsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [commentsError, toast]);

  const { data: userLike } = useQuery<{ liked: boolean }>({
    queryKey: ["/api/posts", id, "like"],
    enabled: !!id && isAuthenticated,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${id}/comments`, {
        content,
      });
    },
    onSuccess: async (response) => {
      const newComment = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] }); // Refresh post reply count
      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      });
      
      // Real-time updates are handled server-side
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${id}/like`);
    },
    onSuccess: async (response) => {
      const likeResult = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id, "like"] });
      
      // Real-time updates are handled server-side
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to like post.",
        variant: "destructive",
      });
    },
  });

  const handleComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  if (authLoading || postLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-6">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <div className="flex gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-32 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const authorName = `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "Anonymous User";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Post Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Post Header */}
            <div className="flex items-center gap-2 mb-4">
              <Badge 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => window.location.href = `/category/${post.category.slug}`}
                data-testid="badge-category"
              >
                {post.category.name}
              </Badge>
              {post.isPinned && <Badge variant="outline">Pinned</Badge>}
              {post.isLocked && <Badge variant="outline">Locked</Badge>}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="text-post-title">
              {post.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-6">
              <Avatar>
                <AvatarImage src={post.author.profileImageUrl || undefined} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div 
                  className="font-medium text-foreground cursor-pointer hover:text-primary"
                  onClick={() => window.location.href = `/user/${post.author.id}`}
                  data-testid="text-post-author"
                >
                  {authorName}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{post.author.reputation || 0} points</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span data-testid="text-post-date">
                    {formatDistanceToNow(new Date(post.createdAt || Date.now()), { addSuffix: true })}
                  </span>
                  {post.updatedAt !== post.createdAt && (
                    <>
                      <span>•</span>
                      <span>edited</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div 
              className="prose prose-lg max-w-none mb-6 text-foreground"
              data-testid="text-post-content"
            >
              {post.content}
            </div>

            <Separator className="mb-4" />

            {/* Post Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className={`${userLike?.liked ? "text-accent" : "text-muted-foreground"} hover:text-accent`}
                data-testid="button-like-post"
              >
                <Heart className={`w-4 h-4 mr-2 ${userLike?.liked ? "fill-current" : ""}`} />
                {post.likeCount || 0} likes
              </Button>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span data-testid="text-reply-count">{post.replyCount || 0} replies</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span data-testid="text-view-count">{post.viewCount || 0} views</span>
              </div>

              <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              <Button variant="ghost" className="text-muted-foreground hover:text-destructive">
                <Flag className="w-4 h-4 mr-2" />
                Report
              </Button>

              {user && post && (user.id === post.authorId) && (
                <>
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* New Comment Form */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add a comment</h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[120px]"
                data-testid="textarea-new-comment"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleComment}
                  disabled={commentMutation.isPending || !newComment.trim()}
                  data-testid="button-post-comment"
                >
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Comments ({comments.length})
          </h3>

          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-16 w-full mb-3" />
                        <div className="flex gap-4">
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-12" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No comments yet</h3>
                <p className="text-muted-foreground">Be the first to share your thoughts!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  postId={id!}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
