import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';

interface Problem {
  difficulty: string;
  topic: string;
  status: string;
  solved_at: string | null;
  created_at: string;
}

interface DifficultyData {
  name: string;
  value: number;
  color: string;
}

interface TopicData {
  topic: string;
  count: number;
}

interface ActivityData {
  date: string;
  solved: number;
}

const COLORS = {
  Easy: '#22c55e',
  Medium: '#f59e0b', 
  Hard: '#ef4444'
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProblems();
    }
  }, [user]);

  const fetchProblems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('problems')
        .select('difficulty, topic, status, solved_at, created_at')
        .eq('user_id', user.id);

      if (error) throw error;
      setProblems(data || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const difficultyData: DifficultyData[] = [
    { name: 'Easy', value: problems.filter(p => p.difficulty === 'Easy').length, color: COLORS.Easy },
    { name: 'Medium', value: problems.filter(p => p.difficulty === 'Medium').length, color: COLORS.Medium },
    { name: 'Hard', value: problems.filter(p => p.difficulty === 'Hard').length, color: COLORS.Hard },
  ].filter(item => item.value > 0);

  const topicData: TopicData[] = Object.entries(
    problems.reduce((acc, problem) => {
      acc[problem.topic] = (acc[problem.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([topic, count]) => ({ topic, count }))
   .sort((a, b) => b.count - a.count)
   .slice(0, 8); // Top 8 topics

  // Activity data for the last 30 days
  const activityData: ActivityData[] = (() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const solvedCount = problems.filter(p => 
        p.solved_at && new Date(p.solved_at).toDateString() === date.toDateString()
      ).length;
      
      last30Days.push({
        date: dateStr,
        solved: solvedCount
      });
    }
    
    return last30Days;
  })();

  const totalProblems = problems.length;
  const solvedProblems = problems.filter(p => p.status === 'Solved').length;
  const solveRate = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Insights into your coding journey and progress</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Problems
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProblems}</div>
            <p className="text-xs text-muted-foreground">
              Problems in your collection
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Problems Solved
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{solvedProblems}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solve Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{solveRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of total problems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Difficulty Distribution */}
        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Difficulty Distribution</CardTitle>
            <CardDescription className="text-muted-foreground">
              Breakdown of problems by difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {difficultyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No problems to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topics */}
        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Top Topics</CardTitle>
            <CardDescription className="text-muted-foreground">
              Most practiced problem topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topicData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="topic" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No topics to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="bg-gradient-surface border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-foreground">Daily Activity (Last 30 Days)</CardTitle>
          <CardDescription className="text-muted-foreground">
            Number of problems solved each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="solved" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}