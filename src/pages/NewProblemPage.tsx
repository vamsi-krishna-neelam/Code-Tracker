import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft } from 'lucide-react';

export default function NewProblemPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    difficulty: '',
    topic: '',
    status: 'Todo',
    problem_url: '',
    solution_url: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const problemData = {
        user_id: user.id,
        title: formData.title,
        platform: formData.platform,
        difficulty: formData.difficulty,
        topic: formData.topic,
        status: formData.status,
        problem_url: formData.problem_url || null,
        solution_url: formData.solution_url || null,
        notes: formData.notes || null,
        solved_at: formData.status === 'Solved' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('problems')
        .insert([problemData]);

      if (error) throw error;

      toast({
        title: 'Problem added successfully',
        description: `${formData.title} has been added to your problem list.`,
      });

      navigate('/problems');
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/problems')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problems
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Problem</h1>
          <p className="text-muted-foreground">Add a new coding problem to track your progress</p>
        </div>
      </div>

      <Card className="bg-gradient-surface border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5 text-primary" />
            Problem Details
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the information about the coding problem you want to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Problem Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Two Sum, Binary Search"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Input
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => handleInputChange('platform', e.target.value)}
                  placeholder="e.g., LeetCode, HackerRank, CodeForces"
                  required
                  className="bg-input border-border"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value) => handleInputChange('difficulty', value)}
                  required
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  placeholder="e.g., Arrays, Trees, Dynamic Programming"
                  required
                  className="bg-input border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Solved">Solved</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="problem_url">Problem URL</Label>
                <Input
                  id="problem_url"
                  type="url"
                  value={formData.problem_url}
                  onChange={(e) => handleInputChange('problem_url', e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solution_url">Solution URL</Label>
                <Input
                  id="solution_url"
                  type="url"
                  value={formData.solution_url}
                  onChange={(e) => handleInputChange('solution_url', e.target.value)}
                  placeholder="https://github.com/..."
                  className="bg-input border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes, approaches, time complexity, etc..."
                rows={4}
                className="bg-input border-border resize-none"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium"
              >
                {isLoading ? 'Adding Problem...' : 'Add Problem'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/problems')}
                className="border-border text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}