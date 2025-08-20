import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Target, Flame, Plus } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  status: string;
  solved_at: string | null;
}

interface Stats {
  totalSolved: number;
  last7Days: number;
  currentStreak: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({ totalSolved: 0, last7Days: 0, currentStreak: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Quick add form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get all solved problems
      const { data: solvedProblems, error } = await supabase
        .from('problems')
        .select('solved_at')
        .eq('user_id', user.id)
        .eq('status', 'Solved')
        .not('solved_at', 'is', null);

      if (error) throw error;

      const totalSolved = solvedProblems?.length || 0;

      // Calculate last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const last7Days = solvedProblems?.filter(p => 
        p.solved_at && new Date(p.solved_at) >= sevenDaysAgo
      ).length || 0;

      // Calculate streak (simplified - consecutive days from today)
      const currentStreak = calculateStreak(solvedProblems || []);

      setStats({ totalSolved, last7Days, currentStreak });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const calculateStreak = (problems: { solved_at: string | null }[]) => {
    if (!problems.length) return 0;

    const solvedDates = problems
      .filter(p => p.solved_at)
      .map(p => new Date(p.solved_at!).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(solvedDates)];
    
    if (!uniqueDates.length) return 0;

    let streak = 0;
    const today = new Date().toDateString();
    
    // Check if solved today or yesterday to start streak
    if (uniqueDates[0] === today || uniqueDates[0] === new Date(Date.now() - 86400000).toDateString()) {
      streak = 1;
      
      // Count consecutive days
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i-1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24);
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !platform || !difficulty || !topic) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('problems')
        .insert([
          {
            user_id: user.id,
            title,
            platform,
            difficulty,
            topic,
            status: 'Todo'
          }
        ]);

      if (error) throw error;

      toast({
        title: 'Problem added successfully',
        description: `${title} has been added to your problem list.`,
      });

      // Reset form
      setTitle('');
      setPlatform('');
      setDifficulty('');
      setTopic('');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error adding problem',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your coding progress and achievements</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Solved
            </CardTitle>
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalSolved}</div>
            <p className="text-xs text-muted-foreground">
              Problems completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 7 Days
            </CardTitle>
            <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.last7Days}</div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
            <div className="h-8 w-8 bg-warning/20 rounded-lg flex items-center justify-center">
              <Flame className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Form */}
      <Card className="bg-gradient-surface border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5 text-primary" />
            Quick Add Problem
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Quickly add a new coding problem to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickAdd} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Problem Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Two Sum, Binary Search, etc."
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="LeetCode, HackerRank, etc."
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty} required>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Arrays, Trees, Dynamic Programming, etc."
                required
                className="bg-input border-border"
              />
            </div>
            <div className="md:col-span-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium"
              >
                {isLoading ? 'Adding...' : 'Add Problem'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}