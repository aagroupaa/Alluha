import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import PostCard from "@/components/post-card";
import CreatePostDialog from "@/components/create-post-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Code, Leaf, Heart, GraduationCap, Palette, Plus, Search, MessageCircle } from "lucide-react";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const { data: category, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ["/api/categories", slug],
    enabled: !!slug && isAuthenticated,
  });

  // Handle category error
  useEffect(() => {
    if (categoryError && isUnauthorizedError(categoryError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [categoryError, toast]);

  const { data: posts = [], isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: debouncedQuery 
      ? ["/api/posts/search", { q: debouncedQuery, categoryId: (category as any)?.id }] 
      : ["/api/posts", { categoryId: (category as any)?.id }],
    enabled: !!(category as any)?.id && isAuthenticated,
  });

  // Handle posts error
  useEffect(() => {
    if (postsError && isUnauthorizedError(postsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [postsError, toast]);

  const categoryIcons = {
    "tech-development": Code,
    "lifestyle-hobbies": Leaf,
    "health-wellness": Heart,
    "education-skills": GraduationCap,
    "creative-arts": Palette,
  };

  if (authLoading || categoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()} data-testid="button-go-back">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Code;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
            <IconComponent className="text-primary w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-category-name">
              {category.name}
            </h1>
            <p className="text-muted-foreground text-lg mb-4">{category.description}</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span data-testid="text-post-count">{category.postCount || 0} posts</span>
              <span data-testid="text-member-count">{category.memberCount || 0} members</span>
            </div>
          </div>
          <CreatePostDialog categoryId={category.id}>
            <Button data-testid="button-create-post-category">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </CreatePostDialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search in ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-posts"
            />
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {postsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? 'No posts found' : 'No discussions yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No posts match your search "${searchQuery}" in this category.`
                    : `Be the first to start a discussion in ${category.name}!`
                  }
                </p>
                {!searchQuery && (
                  <CreatePostDialog categoryId={category.id}>
                    <Button data-testid="button-create-first-post">Create First Post</Button>
                  </CreatePostDialog>
                )}
              </CardContent>
            </Card>
          ) : (
            posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
