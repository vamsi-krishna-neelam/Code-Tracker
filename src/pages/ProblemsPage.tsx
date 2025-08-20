import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  status: string;
  problem_url: string | null;
  solution_url: string | null;
  notes: string | null;
  solved_at: string | null;
  created_at: string;
}

export default function ProblemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProblems(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading problems',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (problemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('problems')
        .delete()
        .eq('id', problemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProblems(problems.filter(p => p.id !== problemId));
      toast({
        title: 'Problem deleted',
        description: 'The problem has been successfully deleted.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting problem',
        description: error.message,
      });
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
    const matchesTopic = topicFilter === 'all' || problem.topic === topicFilter;

    return matchesSearch && matchesDifficulty && matchesStatus && matchesTopic;
  });

  const uniqueTopics = [...new Set(problems.map(p => p.topic))];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-success/20 text-success border-success/20';
      case 'Medium': return 'bg-warning/20 text-warning border-warning/20';
      case 'Hard': return 'bg-destructive/20 text-destructive border-destructive/20';
      default: return 'bg-muted/20 text-muted-foreground border-muted/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Solved': return 'bg-success/20 text-success border-success/20';
      case 'In Progress': return 'bg-warning/20 text-warning border-warning/20';
      case 'Reviewed': return 'bg-primary/20 text-primary border-primary/20';
      default: return 'bg-muted/20 text-muted-foreground border-muted/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading problems...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Problems</h1>
          <p className="text-muted-foreground">Manage and track your coding problems</p>
        </div>
        <Button asChild className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
          <Link to="/problems/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Problem
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-surface border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-5 w-5 text-primary" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Solved">Solved</SelectItem>
                <SelectItem value="Reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {uniqueTopics.map(topic => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
                setStatusFilter('all');
                setTopicFilter('all');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Problems Table */}
      <Card className="bg-gradient-surface border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-foreground">Problem</TableHead>
                <TableHead className="text-foreground">Platform</TableHead>
                <TableHead className="text-foreground">Difficulty</TableHead>
                <TableHead className="text-foreground">Topic</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {problems.length === 0 
                      ? "No problems yet. Add your first problem to get started!"
                      : "No problems match your current filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredProblems.map((problem) => (
                  <TableRow key={problem.id} className="border-border">
                    <TableCell className="font-medium text-foreground max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{problem.title}</span>
                        {problem.problem_url && (
                          <a 
                            href={problem.problem_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-glow"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{problem.platform}</TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{problem.topic}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(problem.status)}>
                        {problem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* TODO: Edit functionality */}}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(problem.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredProblems.length > 0 && (
        <div className="text-center text-muted-foreground">
          Showing {filteredProblems.length} of {problems.length} problems
        </div>
      )}
    </div>
  );
}