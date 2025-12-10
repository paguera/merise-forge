import { useState } from 'react';
import { Database, Download, Moon, Sun, Info, Save, FolderOpen, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useTheme } from '@/hooks/useTheme';
import { ViewMode, SQLDialect } from '@/types/merise';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SaveProjectDialog } from '@/components/dialogs/SaveProjectDialog';
import { LoadProjectDialog } from '@/components/dialogs/LoadProjectDialog';
import JSZip from 'jszip';

export function Header() {
  const navigate = useNavigate();
  const { viewMode, setViewMode, sqlDialect, setSqlDialect, generatedSQL, mldModel } = useMeriseStore();
  const { theme, toggleTheme } = useTheme();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);

  const getSavedProjects = () => {
    const projects: { name: string; savedAt: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('merise-project-')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        projects.push({ name: key.replace('merise-project-', ''), savedAt: data.savedAt });
      }
    }
    return projects.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  };

  const handleSaveProject = (name: string) => {
    const state = useMeriseStore.getState();
    localStorage.setItem(`merise-project-${name}`, JSON.stringify({
      model: state.model,
      mldModel: state.mldModel,
      sqlDialect: state.sqlDialect,
      generatedSQL: state.generatedSQL,
      savedAt: new Date().toISOString(),
    }));
    toast.success(`Projet "${name}" sauvegardé`);
  };

  const handleLoadProject = (name: string) => {
    const data = localStorage.getItem(`merise-project-${name}`);
    if (data) {
      const parsed = JSON.parse(data);
      useMeriseStore.setState({
        model: parsed.model,
        mldModel: parsed.mldModel,
        sqlDialect: parsed.sqlDialect,
        generatedSQL: parsed.generatedSQL,
      });
      toast.success(`Projet "${name}" chargé`);
    }
  };

  const handleDeleteProject = (name: string) => {
    localStorage.removeItem(`merise-project-${name}`);
    toast.success(`Projet "${name}" supprimé`);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    const { toPng } = await import('html-to-image');
    
    toast.info('Génération du ZIP en cours...');
    
    try {
      const currentView = viewMode;
      const views: ViewMode[] = ['MCD', 'MLD', 'MPD'];
      
      for (const view of views) {
        setViewMode(view);
        await new Promise(r => setTimeout(r, 300));
        const canvas = document.getElementById('merise-canvas');
        if (canvas) {
          const dataUrl = await toPng(canvas, { quality: 1, backgroundColor: theme === 'dark' ? '#1a1a2e' : '#e8eef5' });
          const base64 = dataUrl.split(',')[1];
          zip.file(`${view.toLowerCase()}.png`, base64, { base64: true });
        }
      }
      
      setViewMode(currentView);
      
      if (generatedSQL) {
        zip.file('schema.sql', generatedSQL);
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ressou-merize-${Date.now()}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('ZIP exporté avec succès');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export");
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-primary">Ressou Merize</h1>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="MCD" className="font-semibold">MCD</TabsTrigger>
          <TabsTrigger value="MLD" className="font-semibold">MLD</TabsTrigger>
          <TabsTrigger value="MPD" className="font-semibold">MPD (SQL)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        {viewMode === 'MPD' && (
          <Select value={sqlDialect} onValueChange={(v) => setSqlDialect(v as SQLDialect)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MariaDB">MariaDB</SelectItem>
              <SelectItem value="MySQL">MySQL</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <Button variant="ghost" size="icon" onClick={() => setSaveOpen(true)} title="Sauvegarder">
          <Save className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setLoadOpen(true)} title="Charger">
          <FolderOpen className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/info')} title="Info">
          <Info className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button variant="secondary" onClick={handleExportZip} disabled={!mldModel}>
          <Archive className="w-4 h-4 mr-2" />
          ZIP
        </Button>
      </div>

      <SaveProjectDialog open={saveOpen} onOpenChange={setSaveOpen} onSave={handleSaveProject} />
      <LoadProjectDialog 
        open={loadOpen} 
        onOpenChange={setLoadOpen} 
        projects={getSavedProjects()} 
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
      />
    </header>
  );
}
