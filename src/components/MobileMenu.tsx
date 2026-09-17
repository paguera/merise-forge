import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Menu,
  Upload,
  Bookmark,
  FolderOpen,
  FileArchive,
  Moon,
  Sun,
  Music,
  Zap,
} from 'lucide-react';
import { ViewMode } from '@/types/merise';

interface MobileMenuProps {
  viewMode: ViewMode;
  theme: string;
  onSetViewMode: (mode: ViewMode) => void;
  onCycleTheme: () => void;
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onImportSQL: () => void;
  onExportZip: () => void;
  onAutoLayout: () => void;
  mldModel: any;
}

export function MobileMenu({
  viewMode,
  theme,
  onSetViewMode,
  onCycleTheme,
  onOpenSave,
  onOpenLoad,
  onImportSQL,
  onExportZip,
  onAutoLayout,
  mldModel,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b flex flex-row items-center gap-2.5 space-y-0">
          <img
            src="/logo.jpeg"
            alt="MERISE FORGE"
            className="w-7 h-7 rounded-lg object-cover ring-1 ring-primary/30"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.jpg';
            }}
          />
          <div className="flex flex-col">
            <SheetTitle className="text-left text-sm font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              MERISE FORGE
            </SheetTitle>
            <span className="text-[9px] uppercase font-semibold text-muted-foreground">
              by PAGUERA
            </span>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-60px)] overflow-y-auto">
          {/* View Mode Tabs */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Mode de Modélisation</p>
            <Tabs
              value={viewMode}
              onValueChange={(v) => handleAction(() => onSetViewMode(v as ViewMode))}
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="MCD" className="text-xs">
                  MCD
                </TabsTrigger>
                <TabsTrigger value="MLD" className="text-xs">
                  MLD
                </TabsTrigger>
                <TabsTrigger value="MPD" className="text-xs">
                  MPD
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          {/* Project Actions */}
          <div className="p-4 space-y-1.5">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Projet</p>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20"
              onClick={() => handleAction(onAutoLayout)}
            >
              <Zap className="w-4 h-4 mr-3" />
              Ranger / Aligner le schéma (1 clic)
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal"
              onClick={() => handleAction(onImportSQL)}
            >
              <Upload className="w-4 h-4 mr-3" />
              Importer un fichier SQL
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal"
              onClick={() => handleAction(onOpenSave)}
            >
              <Bookmark className="w-4 h-4 mr-3" />
              Sauvegarder le projet
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal"
              onClick={() => handleAction(onOpenLoad)}
            >
              <FolderOpen className="w-4 h-4 mr-3" />
              Mes Projets sauvegardés
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal text-primary font-medium"
              onClick={() => handleAction(onExportZip)}
              disabled={!mldModel}
            >
              <FileArchive className="w-4 h-4 mr-3" />
              Exporter l’archive ZIP
            </Button>
          </div>

          <Separator />

          {/* Theme Settings */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Apparence Cyberpunk</p>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={onCycleTheme}
            >
              <span className="flex items-center gap-2">
                {theme === 'cyber-yellow' ? (
                  <Zap className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
                ) : theme === 'cyber-cyan' ? (
                  <Zap className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,242,254,0.8)]" />
                ) : theme === 'cyber-violet' ? (
                  <Zap className="w-4 h-4 text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                )}
                Thème
              </span>
              <span className="text-xs font-bold uppercase text-primary">
                {theme === 'cyber-yellow'
                  ? 'Yellow (PAGUERA)'
                  : theme === 'cyber-cyan'
                  ? 'Cyan Fluo'
                  : theme === 'cyber-violet'
                  ? 'Violet Néon'
                  : 'Stealth Dark'}
              </span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
