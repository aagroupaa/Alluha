import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Heart, GraduationCap, Store } from "lucide-react";
import { useEffect } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect authenticated users to home page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = "/home";
    }
  }, [isAuthenticated, isLoading]);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    onlineUsers: number;
  }>({
    queryKey: ["/api/stats"],
  });

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Category emoji fallbacks
  const getEmoji = (category: any) => {
    return category.icon || "📁";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f9f9' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Allura Community</div>
        <ul className="hidden md:flex">
          <li><a href="#categories" data-testid="nav-link-categories">Categories</a></li>
          <li><a href="#community" data-testid="nav-link-community">Community</a></li>
        </ul>
        <Button 
          onClick={() => window.location.href = '/api/login'}
          className="bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-lg"
          data-testid="button-login"
        >
          Join Now
        </Button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <h1>Welcome to Allura Community</h1>
        <p>Connect with professionals across multiple niches. Share knowledge, grow together.</p>
        <button 
          className="cta" 
          onClick={() => window.location.href = '/api/login'}
          data-testid="button-join-community"
        >
          Get Started Today
        </button>
      </section>

      {/* Categories */}
      <section className="categories" id="categories">
        <h2>Explore Our Communities</h2>
        <div className="grid">
          {categories.map((category: any) => (
            <div
              key={category.id}
              className="card"
              onClick={() => window.location.href = `/category/${category.slug}`}
              data-testid={`card-category-${category.slug}`}
            >
              <span>{getEmoji(category)}</span>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                {category.name || 'Category'}
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {category.description || 'Explore this community'}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                {category.member_count || 0} members • {category.post_count || 0} posts
              </div>
            </div>
          ))}
        </div>

        {/* Community Stats - Compact */}
        {stats && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', maxWidth: '400px', margin: '0 auto' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0d47a1' }} data-testid="text-total-users">
                  {stats.totalUsers.toLocaleString()}+
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Active Members</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0d47a1' }} data-testid="text-total-posts">
                  {stats.totalPosts.toLocaleString()}+
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Discussions</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0d47a1' }} data-testid="text-online-users">
                  {stats.onlineUsers.toLocaleString()}+
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Online Now</div>
              </div>
            </div>
          </div>
        )}
      </section>


      {/* Community Section */}
      <section id="community" style={{ padding: '4rem 2rem', backgroundColor: '#fff', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Join Our Community</h2>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto' }}>
          Building the future of professional community engagement through meaningful connections and knowledge sharing.
        </p>
        <button 
          className="cta" 
          onClick={() => window.location.href = '/api/login'}
          data-testid="button-join-footer"
        >
          Get Started Today
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-primary-foreground text-sm"></i>
                </div>
                <span className="text-xl font-bold text-foreground">Allura</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Building the future of professional community engagement through meaningful connections and knowledge sharing.
              </p>
              <p className="text-xs text-muted-foreground">
                Allura is an A&A brand
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-4">Product</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-4">Community</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Guidelines</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Moderation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Events</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-4">Support</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                © 2024 Allura. All rights reserved.
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
