import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import Header from "@/components/header";
import PostCard from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Calendar, 
  Award, 
  MessageCircle, 
  Heart, 
  Eye,
  Edit,
  Mail,
  Activity,
  Clock,
  ThumbsUp,
  CheckCircle,
  UserIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

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

  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["/api/users", id],
    enabled: !!id && isAuthenticated,
  });

  // Handle user error
  useEffect(() => {
    if (userError && isUnauthorizedError(userError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [userError, toast]);

  const { data: userPosts = [], isLoading: postsLoading, error: postsError } = useQuery<any[]>({
    queryKey: ["/api/users", id, "posts"],
    enabled: !!id && isAuthenticated,
  });

  const { data: userActivity = [], isLoading: activityLoading, error: activityError } = useQuery<any[]>({
    queryKey: ["/api/users", id, "activity"],
    enabled: !!id && isAuthenticated,
  });

  // Handle user posts error
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

  // Profile editing mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return await apiRequest("PUT", `/api/users/${id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form when dialog opens
  useEffect(() => {
    if (isEditDialogOpen && user) {
      setEditFirstName(user.firstName || "");
      setEditLastName(user.lastName || "");
    }
  }, [isEditDialogOpen, user]);

  const handleEditProfile = () => {
    updateProfileMutation.mutate({ 
      firstName: editFirstName, 
      lastName: editLastName 
    });
  };

  // Function to get reputation badge info
  const getReputationBadge = (reputation: number) => {
    if (reputation >= 1000) {
      return { text: "Expert", variant: "default" as const, icon: Award };
    } else if (reputation >= 500) {
      return { text: "Contributor", variant: "secondary" as const, icon: CheckCircle };
    } else if (reputation >= 100) {
      return { text: "Active", variant: "outline" as const, icon: ThumbsUp };
    } else {
      return { text: "Member", variant: "outline" as const, icon: UserIcon };
    }
  };

  // Function to format activity description
  const formatActivityTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return MessageCircle;
      case 'comment':
        return MessageCircle;
      case 'post_like':
        return Heart;
      default:
        return Activity;
    }
  };

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="flex gap-4 mb-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous User";
  const isOwnProfile = currentUser?.id === user.id;

  // Calculate user stats
  const totalPosts = userPosts.length;
  const totalLikes = userPosts.reduce((sum: number, post: any) => sum + (post.likeCount || 0), 0);
  const totalViews = userPosts.reduce((sum: number, post: any) => sum + (post.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  <UserIcon className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-foreground" data-testid="text-user-name">
                    {userName}
                  </h1>
                  {isOwnProfile && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-edit-profile">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>
                            Update your profile information below.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              placeholder="Enter your first name"
                              data-testid="input-first-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                              placeholder="Enter your last name"
                              data-testid="input-last-name"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleEditProfile}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* User Stats */}
                <div className="flex flex-wrap gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground" data-testid="text-reputation">
                      {user.reputation || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">reputation</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground" data-testid="text-total-posts">
                      {totalPosts}
                    </span>
                    <span className="text-sm text-muted-foreground">posts</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground" data-testid="text-total-likes">
                      {totalLikes}
                    </span>
                    <span className="text-sm text-muted-foreground">likes received</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground" data-testid="text-total-views">
                      {totalViews.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">post views</span>
                  </div>
                </div>

                {/* Reputation Level Badge */}
                <div className="flex gap-2">
                  {user.reputation >= 1000 ? (
                    <Badge className="bg-accent text-accent-foreground">Expert Contributor</Badge>
                  ) : user.reputation >= 500 ? (
                    <Badge variant="secondary">Active Member</Badge>
                  ) : user.reputation >= 100 ? (
                    <Badge variant="outline">Regular Member</Badge>
                  ) : (
                    <Badge variant="outline">New Member</Badge>
                  )}
                  
                  {totalPosts >= 50 && (
                    <Badge variant="outline">Prolific Poster</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" data-testid="tab-posts">
              Posts ({totalPosts})
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              Activity
            </TabsTrigger>
            <TabsTrigger value="about" data-testid="tab-about">
              About
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
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
            ) : userPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "You haven't created any posts yet. Start a discussion to get involved!"
                      : `${userName} hasn't posted anything yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              userPosts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {activityLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : userActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-foreground mb-2">No activity yet</h4>
                      <p className="text-muted-foreground">
                        {isOwnProfile 
                          ? "Start engaging with the community to see your activity here!"
                          : `${userName} hasn't been active recently.`
                        }
                      </p>
                    </div>
                  ) : (
                    userActivity.map((activity: any) => {
                      const IconComponent = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {activity.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {activity.description}
                            </p>
                            {activity.categoryName && (
                              <Badge variant="secondary" className="text-xs mr-2">
                                {activity.categoryName}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatActivityTime(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Profile Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Name:</span>
                          <span className="text-foreground">{userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Member since:</span>
                          <span className="text-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Community Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reputation:</span>
                          <span className="text-foreground font-medium">{user.reputation || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Posts created:</span>
                          <span className="text-foreground font-medium">{totalPosts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total likes:</span>
                          <span className="text-foreground font-medium">{totalLikes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profile views:</span>
                          <span className="text-foreground font-medium">{totalViews.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges/Achievements */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Achievements</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.reputation >= 1000 && (
                        <Badge className="bg-accent text-accent-foreground">
                          <Award className="w-3 h-3 mr-1" />
                          Expert
                        </Badge>
                      )}
                      {totalPosts >= 10 && (
                        <Badge variant="secondary">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Active Poster
                        </Badge>
                      )}
                      {totalLikes >= 50 && (
                        <Badge variant="outline">
                          <Heart className="w-3 h-3 mr-1" />
                          Well Liked
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        Member
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
