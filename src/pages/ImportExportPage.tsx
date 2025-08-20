import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImportExportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Convert to CSV
      const headers = ['title', 'platform', 'difficulty', 'topic', 'status', 'problem_url', 'solution_url', 'notes', 'solved_at', 'created_at'];
      const csvContent = [
        headers.join(','),
        ...data.map(problem => 
          headers.map(header => {
            const value = problem[header as keyof typeof problem];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codetrack-problems-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Exported ${data.length} problems to CSV file.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const requiredHeaders = ['title', 'platform', 'difficulty', 'topic'];
      
      // Check required headers
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const problems = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const problem: any = { user_id: user.id };
        
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || '';
          
          switch (header) {
            case 'title':
            case 'platform':
            case 'topic':
              problem[header] = value;
              break;
            case 'difficulty':
              if (['Easy', 'Medium', 'Hard'].includes(value)) {
                problem[header] = value;
              } else {
                problem[header] = 'Easy'; // Default
              }
              break;
            case 'status':
              if (['Todo', 'In Progress', 'Solved', 'Reviewed'].includes(value)) {
                problem[header] = value;
              } else {
                problem[header] = 'Todo'; // Default
              }
              break;
            case 'problem_url':
            case 'solution_url':
            case 'notes':
              problem[header] = value || null;
              break;
            case 'solved_at':
              problem[header] = value && !isNaN(Date.parse(value)) ? value : null;
              break;
          }
        });

        // Validate required fields
        if (!problem.title || !problem.platform || !problem.difficulty || !problem.topic) {
          console.warn(`Skipping row ${i + 1}: Missing required fields`);
          continue;
        }

        problems.push(problem);
      }

      if (problems.length === 0) {
        throw new Error('No valid problems found in the CSV file');
      }

      const { error } = await supabase
        .from('problems')
        .insert(problems);

      if (error) throw error;

      toast({
        title: 'Import successful',
        description: `Imported ${problems.length} problems from CSV file.`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Simple CSV parser that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import/Export</h1>
        <p className="text-muted-foreground">Backup your data or import problems from CSV files</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export */}
        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Download className="h-5 w-5 text-primary" />
              Export Problems
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Download all your problems as a CSV file for backup or analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">What's included:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Problem title and platform</li>
                <li>• Difficulty level and topic</li>
                <li>• Status and completion date</li>
                <li>• URLs and notes</li>
              </ul>
            </div>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium"
            >
              {isExporting ? 'Exporting...' : 'Export to CSV'}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card className="bg-gradient-surface border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-secondary" />
              Import Problems
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload a CSV file to import problems into your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  onClick={handleFileSelect}
                  variant="outline"
                  disabled={isImporting}
                  className="flex-1 border-border text-foreground hover:bg-accent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Choose CSV File'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Format Guide */}
      <Card className="bg-gradient-surface border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-muted-foreground" />
            CSV Format Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your CSV file should have these columns with the exact header names (case-sensitive)
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Required Columns:</h4>
              <ul className="text-sm space-y-1">
                <li><code className="bg-muted px-1 rounded">title</code> - Problem name</li>
                <li><code className="bg-muted px-1 rounded">platform</code> - e.g., LeetCode, HackerRank</li>
                <li><code className="bg-muted px-1 rounded">difficulty</code> - Easy, Medium, or Hard</li>
                <li><code className="bg-muted px-1 rounded">topic</code> - e.g., Arrays, Trees</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Optional Columns:</h4>
              <ul className="text-sm space-y-1">
                <li><code className="bg-muted px-1 rounded">status</code> - Todo, In Progress, Solved, Reviewed</li>
                <li><code className="bg-muted px-1 rounded">problem_url</code> - Link to problem</li>
                <li><code className="bg-muted px-1 rounded">solution_url</code> - Link to solution</li>
                <li><code className="bg-muted px-1 rounded">notes</code> - Additional notes</li>
                <li><code className="bg-muted px-1 rounded">solved_at</code> - Date solved (YYYY-MM-DD format)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}