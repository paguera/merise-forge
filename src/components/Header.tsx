import { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  FolderOpen,
  FileArchive,
  Upload,
  Music,
  Bookmark,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useTheme } from '@/hooks/useTheme';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MobileMenu } from '@/components/MobileMenu';
import { ViewMode, SQLDialect, Entity, Relation, Attribute } from '@/types/merise';
import { parseSQLFile } from '@/lib/sqlParser';
import { toast } from 'sonner';
import { SaveProjectDialog } from '@/components/dialogs/SaveProjectDialog';
import { LoadProjectDialog } from '@/components/dialogs/LoadProjectDialog';
import JSZip from 'jszip';

export function Header() {
  const {
    viewMode,
    setViewMode,
    sqlDialect,
    setSqlDialect,
    mldModel,
    model,
    addEntity,
    addRelation,
    autoLayout,
  } = useMeriseStore();

  const { theme, cycleTheme } = useTheme();
  const { settings, hasLogo, getLogoSize, isAnnouncementActive } = useSiteSettings();

  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportSQL = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sql = e.target?.result as string;
        const { entities, relations } = parseSQLFile(sql);
        if (entities.length === 0) {
          toast.error('Aucune table trouvée dans le fichier SQL');
          return;
        }
        entities.forEach((entity) => addEntity(entity));
        relations.forEach((relation) => addRelation(relation));
        setViewMode('MCD');
        toast.success(`${entities.length} tables et ${relations.length} relations importées`);
      } catch (err: any) {
        console.error('SQL import error:', err);
        toast.error(`Erreur lors de l'import SQL : ${err?.message || 'Format non reconnu'}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getSavedProjects = () => {
    const projects: { name: string; savedAt: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('merise-project-')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        projects.push({
          name: key.replace('merise-project-', ''),
          savedAt: data.savedAt,
        });
      }
    }
    return projects.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  };

  const handleSaveProject = (name: string) => {
    const state = useMeriseStore.getState();
    localStorage.setItem(
      `merise-project-${name}`,
      JSON.stringify({
        model: state.model,
        mldModel: state.mldModel,
        sqlDialect: state.sqlDialect,
        generatedSQL: state.generatedSQL,
        savedAt: new Date().toISOString(),
      })
    );
    toast.success(`Projet "${name}" sauvegardé localement`);
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
    useMeriseStore.setState({ isExporting: true });

    const snapshot = (() => {
      const s = useMeriseStore.getState();
      return {
        model: JSON.parse(JSON.stringify(s.model)),
        mldModel: s.mldModel ? JSON.parse(JSON.stringify(s.mldModel)) : null,
        viewMode: s.viewMode,
        sqlDialect: s.sqlDialect,
        selectedEntityId: s.selectedEntityId,
        selectedRelationId: s.selectedRelationId,
        generatedSQL: s.generatedSQL,
      };
    })();

    const zip = new JSZip();
    const { toPng } = await import('html-to-image');
    toast.info('Génération de l’archive ZIP...');

    try {
      const views: ViewMode[] = ['MCD', 'MLD', 'MPD'];
      for (const view of views) {
        useMeriseStore.setState({ viewMode: view });

        if ((view === 'MLD' || view === 'MPD') && snapshot.mldModel) {
          useMeriseStore.setState({ mldModel: snapshot.mldModel });
        }

        await new Promise((r) => setTimeout(r, 600));
        const canvas = document.getElementById('merise-canvas');
        if (canvas) {
          const contentBounds = calculateContentBounds(view, snapshot);
          const originalStyle = canvas.style.cssText;
          const minWidth = Math.max(contentBounds.maxX + 100, canvas.offsetWidth);
          const minHeight = Math.max(contentBounds.maxY + 100, canvas.offsetHeight);

          canvas.style.width = `${minWidth}px`;
          canvas.style.height = `${minHeight}px`;
          canvas.style.overflow = 'visible';
          await new Promise((r) => setTimeout(r, 100));

          const dataUrl = await toPng(canvas, {
            quality: 1,
            backgroundColor:
              theme === 'cyber-violet'
                ? '#0c041d'
                : theme === 'cyber-cyan'
                ? '#060911'
                : theme === 'cyber-dark'
                ? '#090d16'
                : '#07080e',
            width: minWidth,
            height: minHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left',
            },
            filter: (node) => {
              if (node.classList?.contains('zoom-controls')) return false;
              return true;
            },
          });

          canvas.style.cssText = originalStyle;
          const base64 = dataUrl.split(',')[1];
          zip.file(`${view.toLowerCase()}.png`, base64, { base64: true });
        }
      }

      if (snapshot.generatedSQL) {
        zip.file('schema.sql', snapshot.generatedSQL);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `merise-forge-${Date.now()}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Archive ZIP exportée avec succès');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'exportation");
    } finally {
      useMeriseStore.setState({
        model: snapshot.model,
        mldModel: snapshot.mldModel,
        viewMode: snapshot.viewMode,
        sqlDialect: snapshot.sqlDialect,
        selectedEntityId: snapshot.selectedEntityId,
        selectedRelationId: snapshot.selectedRelationId,
        generatedSQL: snapshot.generatedSQL,
        isExporting: false,
      });
    }
  };

  const calculateContentBounds = (
    view: ViewMode,
    snapshotData: { model: typeof model; mldModel: typeof mldModel }
  ) => {
    let maxX = 800;
    let maxY = 600;
    if (view === 'MCD') {
      snapshotData.model.entities.forEach((entity) => {
        maxX = Math.max(maxX, entity.position.x + 200);
        maxY = Math.max(maxY, entity.position.y + 150);
      });
      snapshotData.model.relations.forEach((relation) => {
        maxX = Math.max(maxX, relation.position.x + 150);
        maxY = Math.max(maxY, relation.position.y + 100);
      });
    } else if (snapshotData.mldModel) {
      snapshotData.mldModel.tables.forEach((table) => {
        maxX = Math.max(maxX, table.position.x + 250);
        maxY = Math.max(maxY, table.position.y + 50 + table.columns.length * 40);
      });
    }
    return { maxX, maxY };
  };

  return (
    <TooltipProvider delayDuration={200}>
      <>
        {isAnnouncementActive() && (
          <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium sticky top-0 z-[51]">
            {settings.announcement_text}
          </div>
        )}

        <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <MobileMenu
            viewMode={viewMode}
            theme={theme}
            onSetViewMode={setViewMode}
            onCycleTheme={cycleTheme}
            onOpenSave={() => setSaveOpen(true)}
            onOpenLoad={() => setLoadOpen(true)}
            onImportSQL={() => fileInputRef.current?.click()}
            onExportZip={handleExportZip}
            onAutoLayout={() => {
              autoLayout();
              toast.success('✨ Schéma réorganisé proprement !');
            }}
            mldModel={mldModel}
          />

          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3 select-none">
            {hasLogo() && settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                style={{ height: `${getLogoSize()}px` }}
                className="object-contain rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <img
                src="/logo.jpeg"
                alt="MERISE FORGE"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover shadow-sm ring-1 ring-primary/40 shadow-primary/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.jpg';
                }}
              />
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-primary via-yellow-300 to-accent bg-clip-text text-transparent">
                  {settings.site_name || 'MERISE FORGE'}
                </h1>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 hidden sm:inline-block tracking-wider">
                  by PAGUERA
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
            className="hidden md:block"
          >
            <TabsList className="bg-secondary/60 backdrop-blur-sm border border-border/50 p-1">
              <TabsTrigger
                value="MCD"
                className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-4"
              >
                MCD
              </TabsTrigger>
              <TabsTrigger
                value="MLD"
                className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-4"
              >
                MLD
              </TabsTrigger>
              <TabsTrigger
                value="MPD"
                className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-4"
              >
                MPD (SQL)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Desktop Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {viewMode === 'MPD' && (
              <Select value={sqlDialect} onValueChange={(v) => setSqlDialect(v as SQLDialect)}>
                <SelectTrigger className="w-32 bg-secondary/60 border-border/50 font-semibold text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MariaDB">MariaDB</SelectItem>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="SQLite">SQLite</SelectItem>
                </SelectContent>
              </Select>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportSQL}
              accept=".sql"
              className="hidden"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    autoLayout();
                    toast.success('✨ Schéma réorganisé proprement !');
                  }}
                  className="hover:bg-primary/10 text-primary hover:text-primary transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Ranger / Réorganiser le schéma (1 clic)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Upload className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Importer SQL</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSaveOpen(true)}
                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Sauvegarder</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLoadOpen(true)}
                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <FolderOpen className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Mes Projets</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleTheme}
                  className="hover:bg-primary/15 transition-all"
                >
                  {theme === 'cyber-yellow' ? (
                    <Zap className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  ) : theme === 'cyber-cyan' ? (
                    <Zap className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]" />
                  ) : theme === 'cyber-violet' ? (
                    <Zap className="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  ) : (
                    <Moon className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  Thème :{' '}
                  {theme === 'cyber-yellow'
                    ? 'Cyberpunk Yellow (PAGUERA)'
                    : theme === 'cyber-cyan'
                    ? 'Neon Cyan Fluo'
                    : theme === 'cyber-violet'
                    ? 'Violet Synthwave'
                    : 'Dark Stealth'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Export ZIP */}
            <Button
              variant="default"
              onClick={handleExportZip}
              disabled={!mldModel}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
            >
              <FileArchive className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter ZIP</span>
            </Button>
          </div>

          <SaveProjectDialog
            open={saveOpen}
            onOpenChange={setSaveOpen}
            onSave={handleSaveProject}
          />
          <LoadProjectDialog
            open={loadOpen}
            onOpenChange={setLoadOpen}
            projects={getSavedProjects()}
            onLoad={handleLoadProject}
            onDelete={handleDeleteProject}
          />
        </header>
      </>
    </TooltipProvider>
  );
}