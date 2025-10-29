import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Code, TrendingUp, Target, Zap } from 'lucide-react';

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [isLoading, setIsLoading] = useState(false);
  const [showConfigBanner, setShowConfigBanner] = useState(!isSupabaseConfigured);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      // More actionable messages for common network/config problems
      const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      if (error.message?.toLowerCase().includes('failed to fetch')) {
        toast({
          variant: 'destructive',
          title: 'Sign in failed — network error',
          description: configuredUrl
            ? `Could not reach Supabase at ${configuredUrl}. Check your network or that the project URL is correct.`
            : 'Supabase URL is not configured. Create a `.env.local` with VITE_SUPABASE_URL and VITE_SUPABASE_KEY.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: error.message,
        });
      }
    }

    setIsLoading(false);
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    const { error } = await signUp(email, password, displayName);

    if (error) {
      const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

      // Common network error message returned by fetch in browsers
      if (error.message?.toLowerCase().includes('failed to fetch')) {
        toast({
          variant: 'destructive',
          title: 'Sign up failed — cannot reach Supabase',
          description: configuredUrl
            ? `The app couldn't contact Supabase at ${configuredUrl}. Verify the project URL, your internet connection, and that the domain resolves.`
            : 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_KEY to `.env.local` in the project root.',
        });
      } else if (error.status === 0) {
        // Some environments surface network failures with status 0
        toast({
          variant: 'destructive',
          title: 'Sign up failed — network',
          description: 'Network error when contacting the authentication server. Check your connection and proxy settings.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign up failed',
          description: error.message,
        });
      }
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to complete your signup.',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {!isSupabaseConfigured && showConfigBanner && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-3xl w-full px-4">
          <div className="rounded-md bg-red-600 text-white p-3 shadow-lg flex items-start justify-between gap-4">
            <div>
              <strong className="block">Supabase not configured</strong>
              <div className="text-sm">Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_KEY</code> to <code>.env.local</code> in the project root and restart the dev server.</div>
            </div>
            <div className="flex items-center">
              <button className="text-white/80 underline" onClick={() => setShowConfigBanner(false)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Code className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CodeTrack
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Track Your Coding Journey
            </h2>
            <p className="text-xl text-muted-foreground">
              Monitor your progress, analyze your growth, and stay motivated on your coding adventure.
            </p>
          </div>

          <div className="grid gap-4 mt-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="text-foreground">Track progress across platforms</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="text-foreground">Organize problems by difficulty</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="text-foreground">Maintain your solving streak</span>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md mx-auto bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Welcome</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      placeholder="Enter your name"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-secondary hover:opacity-90 text-secondary-foreground font-medium"
                  >
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}