import { Database, Download, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useTheme } from '@/hooks/useTheme';
import { ViewMode, SQLDialect } from '@/types/merise';
import { toast } from 'sonner';

export function Header() {
  const { viewMode, setViewMode, sqlDialect, setSqlDialect, generatedSQL, model, mldModel } = useMeriseStore();
  const { theme, toggleTheme } = useTheme();

  const handleExportJPG = () => {
    const canvas = document.getElementById('merise-canvas');
    if (!canvas) {
      toast.error('Canvas non trouvé');
      return;
    }

    import('html-to-image').then(({ toPng }) => {
      toPng(canvas, { quality: 1, backgroundColor: '#e8eef5' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `merise-${viewMode.toLowerCase()}-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
          toast.success('Image exportée avec succès');
        })
        .catch((err) => {
          console.error('Export error:', err);
          toast.error("Erreur lors de l'export");
        });
    });
  };

  const handleGenerateSQL = () => {
    if (!mldModel || mldModel.tables.length === 0) {
      toast.error('Veuillez créer un modèle avant de générer le SQL');
      return;
    }

    const blob = new Blob([generatedSQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `merise-${sqlDialect.toLowerCase()}-${Date.now()}.sql`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('SQL généré et téléchargé');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-primary">Merise</h1>
          <span className="text-sm font-semibold text-foreground">Builder</span>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="MCD" className="font-semibold">MCD</TabsTrigger>
          <TabsTrigger value="MLD" className="font-semibold">MLD</TabsTrigger>
          <TabsTrigger value="MPD" className="font-semibold">MPD (SQL)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-3">
        {viewMode === 'MPD' && (
          <>
            <Select value={sqlDialect} onValueChange={(v) => setSqlDialect(v as SQLDialect)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MariaDB">MariaDB</SelectItem>
                <SelectItem value="MySQL">MySQL</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleGenerateSQL} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <code className="mr-2">&lt;/&gt;</code>
              Générer SQL
            </Button>
          </>
        )}
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <Button variant="secondary" onClick={handleExportJPG} className="bg-foreground text-background hover:bg-foreground/90">
          <Download className="w-4 h-4 mr-2" />
          JPG
        </Button>
      </div>
    </header>
  );
}
