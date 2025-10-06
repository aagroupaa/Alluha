import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock,
  Pin,
  Lock,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthorAndCategory } from "@shared/schema";

interface PostCardProps {
  post: PostWithAuthorAndCategory;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      // Invalidate multiple query patterns to update all relevant caches
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/search"] });
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

  const handlePostClick = () => {
    window.location.href = `/post/${post.id}`;
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/user/${post.author.id}`;
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/category/${post.category.slug}`;
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate();
  };

  const authorName = `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "Anonymous User";

  // Extract plain text from HTML content for preview
  const getTextPreview = (html: string, maxLength: number = 150) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
      onClick={handlePostClick}
      data-testid={`post-card-${post.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Author Avatar */}
          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20" onClick={handleAuthorClick}>
            <AvatarImage src={post.author.profileImageUrl || undefined} />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Post Header */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80"
                onClick={handleCategoryClick}
                data-testid={`post-category-${post.id}`}
              >
                {post.category.name}
              </Badge>
              
              {post.isPinned && (
                <Badge variant="outline" className="text-primary">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              
              {post.isLocked && (
                <Badge variant="outline" className="text-muted-foreground">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>

            {/* Post Title */}
            <h3 
              className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors line-clamp-2"
              data-testid={`post-title-${post.id}`}
            >
              {post.title}
            </h3>

            {/* Post Content Preview */}
            <p 
              className="text-muted-foreground text-sm mb-3 line-clamp-2"
              data-testid={`post-preview-${post.id}`}
            >
              {getTextPreview(post.content)}
            </p>

            {/* Author and Meta Info */}
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span 
                className="font-medium text-foreground cursor-pointer hover:text-primary"
                onClick={handleAuthorClick}
                data-testid={`post-author-${post.id}`}
              >
                {authorName}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {post.author.reputation || 0} points
              </span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span data-testid={`post-date-${post.id}`}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
              {post.updatedAt !== post.createdAt && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground text-xs">edited</span>
                </>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeClick}
                disabled={likeMutation.isPending}
                className="h-8 px-2 text-muted-foreground hover:text-accent transition-colors"
                data-testid={`button-like-${post.id}`}
              >
                <Heart className="w-4 h-4 mr-1" />
                {post.likeCount || 0}
              </Button>

              <div 
                className="flex items-center gap-1 text-sm text-muted-foreground"
                data-testid={`post-replies-${post.id}`}
              >
                <MessageCircle className="w-4 h-4" />
                {post.replyCount || 0}
              </div>

              <div 
                className="flex items-center gap-1 text-sm text-muted-foreground"
                data-testid={`post-views-${post.id}`}
              >
                <Eye className="w-4 h-4" />
                {post.viewCount || 0}
              </div>

              {/* Show if user is author */}
              {user?.id === post.authorId && (
                <Badge variant="outline" className="text-xs">
                  Your post
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
