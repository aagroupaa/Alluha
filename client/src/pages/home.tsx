import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import PostCard from "@/components/post-card";
import CreatePostDialog from "@/components/create-post-dialog";
import { OnboardingModal } from "@/components/onboarding-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Code, Leaf, Heart, GraduationCap, Palette, Plus, TrendingUp, Users, MessageCircle } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user should see onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasCompletedOnboarding = localStorage.getItem('allura-onboarding-completed');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  // Handle categories error
  useEffect(() => {
    if (categoriesError && isUnauthorizedError(categoriesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [categoriesError, toast]);

  const { data: trendingPosts = [], isLoading: trendingLoading, error: trendingError } = useQuery({
    queryKey: ["/api/posts/trending"],
    enabled: isAuthenticated,
  });

  // Handle trending posts error
  useEffect(() => {
    if (trendingError && isUnauthorizedError(trendingError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [trendingError, toast]);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  const { data: topContributors = [] } = useQuery({
    queryKey: ["/api/contributors/top"],
    enabled: isAuthenticated,
  });

  const categoryIcons = {
    "tech-development": Code,
    "lifestyle-hobbies": Leaf,
    "health-wellness": Heart,
    "education-skills": GraduationCap,
    "creative-arts": Palette,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Categories Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Categories</h2>
            <CreatePostDialog>
              <Button data-testid="button-create-post">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </CreatePostDialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoriesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-8 w-8 mb-3" />
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </Card>
              ))
            ) : (
              categories.map((category: any) => {
                const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Code;
                
                return (
                  <Card 
                    key={category.id} 
                    className="category-card cursor-pointer hover:shadow-md transition-all duration-300 p-4" 
                    onClick={() => window.location.href = `/category/${category.slug}`}
                    data-testid={`card-category-${category.slug}`}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="text-primary w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.postCount || 0} posts
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Trending Discussions</h2>
            </div>
            
            <div className="space-y-4">
              {trendingLoading ? (
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
              ) : trendingPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No discussions yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                    <CreatePostDialog>
                      <Button data-testid="button-create-first-post">Create First Post</Button>
                    </CreatePostDialog>
                  </CardContent>
                </Card>
              ) : (
                trendingPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            {stats && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Community Pulse
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Online Now</span>
                      <span className="font-medium text-accent" data-testid="text-online-now">
                        {stats.onlineUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Posts</span>
                      <span className="font-medium text-primary" data-testid="text-total-posts">
                        {stats.totalPosts.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-medium text-accent" data-testid="text-total-members">
                        {stats.totalUsers.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Contributors */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Top Contributors</h3>
                <div className="space-y-3">
                  {topContributors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No contributors yet
                    </p>
                  ) : (
                    topContributors.map((user: any, index: number) => (
                      <div 
                        key={user.id} 
                        className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => window.location.href = `/user/${user.id}`}
                        data-testid={`contributor-${index}`}
                      >
                        <img 
                          src={user.profileImageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} 
                          alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.reputation || 0} points
                          </div>
                        </div>
                        {index === 0 && <i className="fas fa-medal text-amber-500"></i>}
                        {index === 1 && <i className="fas fa-medal text-gray-400"></i>}
                        {index === 2 && <i className="fas fa-medal text-amber-600"></i>}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <CreatePostDialog>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-new-discussion">
                      <Plus className="w-4 h-4 mr-2" />
                      New Discussion
                    </Button>
                  </CreatePostDialog>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-browse-categories">
                    <Code className="w-4 h-4 mr-2" />
                    Browse Categories
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Onboarding Modal for first-time users */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        user={user}
      />
    </div>
  );
}
