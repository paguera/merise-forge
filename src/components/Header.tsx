import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, CloudUpload, FolderOpen, FileArchive, Upload, UsersRound, Music, Clock, Layers, ShieldCheck, User, LogOut, Crown, Shield, Bookmark, Sparkles, Palette, HelpCircle, Menu } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeLogo } from '@/components/ThemeLogo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MobileMenu } from '@/components/MobileMenu';
import { ViewMode, SQLDialect, Entity, Relation, Attribute } from '@/types/merise';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SaveProjectDialog } from '@/components/dialogs/SaveProjectDialog';
import { LoadProjectDialog } from '@/components/dialogs/LoadProjectDialog';
import { CollaborationDialog } from '@/components/dialogs/CollaborationDialog';
import { SyncHistoryDialog } from '@/components/dialogs/SyncHistoryDialog';
import { SchemasDialog } from '@/components/dialogs/SchemasDialog';
import { PremiumDialog } from '@/components/dialogs/PremiumDialog';
import { UserProfileDialog } from '@/components/dialogs/UserProfileDialog';
import type { useRealtimeProject } from '@/hooks/useRealtimeProject';
import JSZip from 'jszip';
interface HeaderProps {
  realtime: ReturnType<typeof useRealtimeProject>;
}
export function Header({
  realtime
}: HeaderProps) {
  const navigate = useNavigate();
  const {
    viewMode,
    setViewMode,
    sqlDialect,
    setSqlDialect,
    generatedSQL,
    mldModel,
    model,
    addEntity,
    addRelation
  } = useMeriseStore();
  const {
    theme,
    cycleTheme
  } = useTheme();
  const {
    user,
    profile,
    roles,
    isAdmin,
    isSuperAdmin,
    isPremium,
    signOut,
    updateProfile,
    refreshProfile
  } = useAuth();
  const {
    settings,
    hasLogo,
    getLogoSize,
    hasSiteName,
    isAnnouncementActive,
  } = useSiteSettings();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [schemasOpen, setSchemasOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseSQLFile = (sql: string) => {
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const foreignKeys: {
      fromTable: string;
      fromColumn: string;
      toTable: string;
      toColumn: string;
    }[] = [];

    // Normalize SQL: remove comments and extra whitespace
    let normalizedSQL = sql.replace(/--[^\n]*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Extract all CREATE TABLE statements using a more robust approach
    const tableMatches: {
      name: string;
      content: string;
    }[] = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(/gi;
    let match;
    while ((match = createTableRegex.exec(normalizedSQL)) !== null) {
      const tableName = match[1];
      const startIdx = match.index + match[0].length;

      // Find matching closing parenthesis
      let depth = 1;
      let endIdx = startIdx;
      for (let i = startIdx; i < normalizedSQL.length && depth > 0; i++) {
        if (normalizedSQL[i] === '(') depth++;else if (normalizedSQL[i] === ')') depth--;
        endIdx = i;
      }
      const columnsSection = normalizedSQL.substring(startIdx, endIdx);
      tableMatches.push({
        name: tableName,
        content: columnsSection
      });
    }
    let yPos = 100;
    tableMatches.forEach(({
      name: tableName,
      content: columnsSection
    }, tableIdx) => {
      const attributes: Attribute[] = [];

      // Split by comma but not commas inside parentheses
      const lines: string[] = [];
      let depth = 0;
      let current = '';
      for (let i = 0; i < columnsSection.length; i++) {
        const char = columnsSection[i];
        if (char === '(') depth++;else if (char === ')') depth--;else if (char === ',' && depth === 0) {
          lines.push(current.trim());
          current = '';
          continue;
        }
        current += char;
      }
      if (current.trim()) lines.push(current.trim());

      // Parse FK constraints first
      lines.forEach(line => {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i);
        if (fkMatch) {
          foreignKeys.push({
            fromTable: tableName,
            fromColumn: fkMatch[1],
            toTable: fkMatch[2],
            toColumn: fkMatch[3]
          });
        }
      });

      // Filter constraint lines and parse column definitions
      const columnLines = lines.filter(l => {
        const upper = l.toUpperCase().trim();
        return l && !upper.startsWith('PRIMARY KEY') && !upper.startsWith('FOREIGN KEY') && !upper.startsWith('KEY ') && !upper.startsWith('CONSTRAINT') && !upper.startsWith('UNIQUE') && !upper.startsWith('INDEX') && !upper.startsWith('CHECK') && !upper.startsWith('FULLTEXT') && !upper.startsWith('SPATIAL');
      });
      columnLines.forEach((line, idx) => {
        // More robust column regex: capture column name and type
        const colMatch = line.match(/^[`"']?(\w+)[`"']?\s+([A-Z_]+)/i);
        if (colMatch) {
          const colName = colMatch[1];
          let colType = colMatch[2].toUpperCase();

          // Handle types with parameters
          const typeWithParamsMatch = line.match(/^[`"']?\w+[`"']?\s+(\w+\s*\([^)]+\))/i);
          if (typeWithParamsMatch) {
            colType = typeWithParamsMatch[1].toUpperCase();
          }

          // Handle ENUM type specifically
          const enumMatch = line.match(/ENUM\s*\(([^)]+)\)/i);
          if (enumMatch) {
            colType = `ENUM(${enumMatch[1]})`;
          }
          const isPK = line.toUpperCase().includes('AUTO_INCREMENT') || line.toUpperCase().includes('PRIMARY KEY') || colName.toLowerCase() === 'id';
          attributes.push({
            id: `attr_${Date.now()}_${tableIdx}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
            name: colName,
            type: colType as Attribute['type'],
            isPrimaryKey: isPK,
            isNullable: !line.toUpperCase().includes('NOT NULL')
          });
        }
      });
      if (attributes.length > 0) {
        entities.push({
          id: `entity_${Date.now()}_${tableIdx}_${Math.random().toString(36).substr(2, 5)}`,
          name: tableName,
          attributes,
          position: {
            x: 100 + tableIdx % 3 * 350,
            y: yPos
          }
        });
        if ((tableIdx + 1) % 3 === 0) yPos += 250;
      }
    });

    // Parse ALTER TABLE FK statements
    const alterFkRegex = /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?[^;]*?ADD\s+(?:CONSTRAINT\s+[`"']?\w+[`"']?\s+)?FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/gi;
    while ((match = alterFkRegex.exec(normalizedSQL)) !== null) {
      const exists = foreignKeys.some(fk => fk.fromTable.toLowerCase() === match![1].toLowerCase() && fk.fromColumn.toLowerCase() === match![2].toLowerCase() && fk.toTable.toLowerCase() === match![3].toLowerCase());
      if (!exists) {
        foreignKeys.push({
          fromTable: match[1],
          fromColumn: match[2],
          toTable: match[3],
          toColumn: match[4]
        });
      }
    }

    // Detect junction tables (tables with only FKs as primary attributes)
    const junctionTables = new Set<string>();
    entities.forEach(entity => {
      const entityFKs = foreignKeys.filter(fk => fk.fromTable.toLowerCase() === entity.name.toLowerCase());
      if (entityFKs.length >= 2) {
        const nonFKCols = entity.attributes.filter(a => !entityFKs.some(fk => fk.fromColumn.toLowerCase() === a.name.toLowerCase()) && !a.isPrimaryKey);
        if (nonFKCols.length === 0) {
          junctionTables.add(entity.name.toLowerCase());
        }
      }
    });

    // Create relations from FKs
    foreignKeys.forEach((fk, idx) => {
      const fromEntity = entities.find(e => e.name.toLowerCase() === fk.fromTable.toLowerCase());
      const toEntity = entities.find(e => e.name.toLowerCase() === fk.toTable.toLowerCase());
      if (fromEntity && toEntity && !junctionTables.has(fk.fromTable.toLowerCase())) {
        relations.push({
          id: `rel_${Date.now()}_${idx}`,
          name: fk.fromColumn.replace(/_?id$/i, '') || 'has',
          entity1Id: fromEntity.id,
          entity2Id: toEntity.id,
          cardinality1: '0,n',
          cardinality2: '1,1',
          position: {
            x: (fromEntity.position.x + toEntity.position.x) / 2,
            y: (fromEntity.position.y + toEntity.position.y) / 2
          }
        });
      }
    });

    // Create N-M relations from junction tables
    junctionTables.forEach(junctionName => {
      const junctionFKs = foreignKeys.filter(fk => fk.fromTable.toLowerCase() === junctionName);
      if (junctionFKs.length >= 2) {
        const entity1 = entities.find(e => e.name.toLowerCase() === junctionFKs[0].toTable.toLowerCase());
        const entity2 = entities.find(e => e.name.toLowerCase() === junctionFKs[1].toTable.toLowerCase());
        if (entity1 && entity2) {
          relations.push({
            id: `rel_junction_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: junctionName,
            entity1Id: entity1.id,
            entity2Id: entity2.id,
            cardinality1: '0,n',
            cardinality2: '0,n',
            position: {
              x: (entity1.position.x + entity2.position.x) / 2,
              y: (entity1.position.y + entity2.position.y) / 2
            }
          });
        }
      }
    });

    // Remove junction tables from entities list
    const filteredEntities = entities.filter(e => !junctionTables.has(e.name.toLowerCase()));
    return {
      entities: filteredEntities,
      relations
    };
  };
  const handleImportSQL = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const sql = e.target?.result as string;
      const {
        entities,
        relations
      } = parseSQLFile(sql);
      if (entities.length === 0) {
        toast.error('Aucune table trouvée dans le fichier SQL');
        return;
      }
      entities.forEach(entity => addEntity(entity));
      relations.forEach(relation => addRelation(relation));
      toast.success(`${entities.length} tables et ${relations.length} relations importées`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const getSavedProjects = () => {
    const projects: {
      name: string;
      savedAt: string;
    }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('merise-project-')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        projects.push({
          name: key.replace('merise-project-', ''),
          savedAt: data.savedAt
        });
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
      savedAt: new Date().toISOString()
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
        generatedSQL: parsed.generatedSQL
      });
      toast.success(`Projet "${name}" chargé`);
    }
  };
  const handleDeleteProject = (name: string) => {
    localStorage.removeItem(`merise-project-${name}`);
    toast.success(`Projet "${name}" supprimé`);
  };
  const handleExportZip = async () => {
    // Check premium status for ZIP export
    if (!isPremium) {
      setPremiumOpen(true);
      return;
    }

    // Set exporting flag to prevent canvas zoom reset
    useMeriseStore.setState({
      isExporting: true
    });

    // Capture full snapshot BEFORE any view changes
    const snapshot = (() => {
      const s = useMeriseStore.getState();
      return {
        model: JSON.parse(JSON.stringify(s.model)),
        mldModel: s.mldModel ? JSON.parse(JSON.stringify(s.mldModel)) : null,
        viewMode: s.viewMode,
        sqlDialect: s.sqlDialect,
        selectedEntityId: s.selectedEntityId,
        selectedRelationId: s.selectedRelationId,
        generatedSQL: s.generatedSQL
      };
    })();

    // Backup to localStorage
    try {
      localStorage.setItem('merise-last-zip-backup', JSON.stringify({
        ...snapshot,
        savedAt: new Date().toISOString()
      }));
    } catch {
      // ignore
    }
    const zip = new JSZip();
    const {
      toPng
    } = await import('html-to-image');
    toast.info('Génération du ZIP en cours...');
    try {
      const views: ViewMode[] = ['MCD', 'MLD', 'MPD'];
      for (const view of views) {
        // Directly set viewMode WITHOUT triggering transform (bypass setViewMode)
        useMeriseStore.setState({
          viewMode: view
        });

        // Ensure MLD model is preserved for MLD/MPD views
        if ((view === 'MLD' || view === 'MPD') && snapshot.mldModel) {
          useMeriseStore.setState({
            mldModel: snapshot.mldModel
          });
        }
        await new Promise(r => setTimeout(r, 600));
        const canvas = document.getElementById('merise-canvas');
        if (canvas) {
          // Calculate the bounding box of all content
          const contentBounds = calculateContentBounds(view, snapshot);

          // Temporarily resize canvas for full capture
          const originalStyle = canvas.style.cssText;
          const minWidth = Math.max(contentBounds.maxX + 100, canvas.offsetWidth);
          const minHeight = Math.max(contentBounds.maxY + 100, canvas.offsetHeight);
          canvas.style.width = `${minWidth}px`;
          canvas.style.height = `${minHeight}px`;
          canvas.style.overflow = 'visible';
          await new Promise(r => setTimeout(r, 100));
          const dataUrl = await toPng(canvas, {
            quality: 1,
            backgroundColor: theme === 'spotify' ? '#0a0a0a' : theme === 'dark' ? '#1a1a2e' : '#e8eef5',
            width: minWidth,
            height: minHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            },
            filter: node => {
              // Exclude zoom controls from export
              if (node.classList?.contains('zoom-controls')) return false;
              return true;
            }
          });

          // Restore original style
          canvas.style.cssText = originalStyle;
          const base64 = dataUrl.split(',')[1];
          zip.file(`${view.toLowerCase()}.png`, base64, {
            base64: true
          });
        }
      }
      if (snapshot.generatedSQL) {
        zip.file('schema.sql', snapshot.generatedSQL);
      }
      const blob = await zip.generateAsync({
        type: 'blob'
      });
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
    } finally {
      // Restore EXACT state from snapshot and clear exporting flag
      useMeriseStore.setState({
        model: snapshot.model,
        mldModel: snapshot.mldModel,
        viewMode: snapshot.viewMode,
        sqlDialect: snapshot.sqlDialect,
        selectedEntityId: snapshot.selectedEntityId,
        selectedRelationId: snapshot.selectedRelationId,
        generatedSQL: snapshot.generatedSQL,
        isExporting: false
      });
    }
  };

  // Calculate content bounds for proper export sizing
  const calculateContentBounds = (view: ViewMode, snapshotData: {
    model: typeof model;
    mldModel: typeof mldModel;
  }) => {
    let maxX = 800;
    let maxY = 600;
    if (view === 'MCD') {
      snapshotData.model.entities.forEach(entity => {
        maxX = Math.max(maxX, entity.position.x + 200);
        maxY = Math.max(maxY, entity.position.y + 150);
      });
      snapshotData.model.relations.forEach(relation => {
        maxX = Math.max(maxX, relation.position.x + 150);
        maxY = Math.max(maxY, relation.position.y + 100);
      });
    } else if (snapshotData.mldModel) {
      snapshotData.mldModel.tables.forEach(table => {
        maxX = Math.max(maxX, table.position.x + 250);
        maxY = Math.max(maxY, table.position.y + 50 + table.columns.length * 40);
      });
    }
    return {
      maxX,
      maxY
    };
  };
  return <TooltipProvider delayDuration={200}>
    <>
    {/* Announcement Banner */}
    {isAnnouncementActive() && (
      <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium sticky top-0 z-[51]">
        {settings.announcement_text}
      </div>
    )}

    <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      {/* Mobile Menu */}
      <MobileMenu
        user={user}
        profile={profile}
        roles={roles}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        isPremium={isPremium}
        viewMode={viewMode}
        theme={theme}
        connected={realtime.connected}
        isProjectAdmin={realtime.isAdmin}
        onSetViewMode={setViewMode}
        onCycleTheme={cycleTheme}
        onSignOut={signOut}
        onOpenCollab={() => setCollabOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSchemas={() => setSchemasOpen(true)}
        onOpenSave={() => setSaveOpen(true)}
        onOpenLoad={() => setLoadOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenPremium={() => setPremiumOpen(true)}
        onImportSQL={() => fileInputRef.current?.click()}
        onExportZip={handleExportZip}
        mldModel={mldModel}
      />

      {/* Logo & Branding - Dynamic from settings (NO default logo if field is empty) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {hasLogo() && settings.logo_url && (
          <img 
            src={settings.logo_url} 
            alt="Logo" 
            style={{ height: `${getLogoSize()}px` }}
            className="object-contain" 
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} 
          />
        )}
        {hasSiteName() && settings.site_name && (
          <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent hidden xs:block">
            {settings.site_name}
          </h1>
        )}
      </div>

      {/* Desktop Tabs */}
      <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)} className="hidden md:block">
        <TabsList className="bg-secondary/50 backdrop-blur-sm border border-border/30">
          <TabsTrigger value="MCD" className="font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            MCD
          </TabsTrigger>
          <TabsTrigger value="MLD" className="font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            MLD
          </TabsTrigger>
          <TabsTrigger value="MPD" className="font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            MPD (SQL)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Mobile Menu + Desktop Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {viewMode === 'MPD' && <Select value={sqlDialect} onValueChange={v => setSqlDialect(v as SQLDialect)}>
            <SelectTrigger className="w-28 bg-secondary/50 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MariaDB">MariaDB</SelectItem>
              <SelectItem value="MySQL">MySQL</SelectItem>
            </SelectContent>
          </Select>}
        
        <input type="file" ref={fileInputRef} onChange={handleImportSQL} accept=".sql" className="hidden" />

        {/* User Profile First */}
        {user ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors">
                <Avatar className="w-8 h-8 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                    {profile?.first_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isPremium && <Sparkles className="w-3 h-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md border-border/50">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.first_name || profile?.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Mon Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/my-projects')} className="cursor-pointer">
                <FolderOpen className="w-4 h-4 mr-2" />
                Mes Projets
              </DropdownMenuItem>
              {isPremium ? <DropdownMenuItem className="text-amber-500 cursor-default">
                  <Crown className="w-4 h-4 mr-2" />
                  Premium actif
                </DropdownMenuItem> : <DropdownMenuItem onClick={() => setPremiumOpen(true)} className="cursor-pointer">
                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                  Passer Premium
                </DropdownMenuItem>}
              {isAdmin && <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                    {isSuperAdmin ? <ShieldCheck className="w-4 h-4 mr-2 text-amber-500" /> : <Shield className="w-4 h-4 mr-2" />}
                    Dashboard Admin
                  </DropdownMenuItem>
                </>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/support')} className="cursor-pointer">
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="hover:bg-primary/10 rounded-3xl">
                <User className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="animate-scale-in">
              <p>Connexion</p>
            </TooltipContent>
          </Tooltip>}

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Collaboration Group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={realtime.connected ? 'default' : 'ghost'} size="icon" onClick={() => setCollabOpen(true)} className={realtime.connected ? 'bg-accent hover:bg-accent/90' : 'hover:bg-primary/10'}>
              <UsersRound className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="animate-scale-in">
            <p>Collaboration</p>
          </TooltipContent>
        </Tooltip>

        {realtime.connected && <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)} className="relative hover:bg-primary/10">
                  <Clock className="w-5 h-5" />
                  {realtime.syncHistory.pendingCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse">
                      {realtime.syncHistory.pendingCount}
                    </Badge>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="animate-scale-in">
                <p>Historique</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setSchemasOpen(true)} className="hover:bg-primary/10">
                  <Layers className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="animate-scale-in">
                <p>Schémas</p>
              </TooltipContent>
            </Tooltip>

            {realtime.isAdmin && <Badge className="gap-1 admin-badge-gold font-semibold">
                <Shield className="w-3 h-3" />
                Admin
              </Badge>}
          </>}

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Project Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="hover:bg-primary/10">
              <Upload className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="animate-scale-in">
            <p>Importer SQL</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setSaveOpen(true)} className="hover:bg-primary/10">
              <Bookmark className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="animate-scale-in">
            <p>Sauvegarder</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setLoadOpen(true)} className="hover:bg-primary/10">
              <FolderOpen className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="animate-scale-in">
            <p>Charger</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={cycleTheme} className="hover:bg-primary/10">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : theme === 'spotify' ? <Music className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="animate-scale-in">
            <p>Thème: {theme === 'dark' ? 'Sombre' : theme === 'spotify' ? 'Spotify' : 'Clair'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Export ZIP */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" onClick={handleExportZip} disabled={!mldModel} className="relative gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-border/50">
              <FileArchive className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              {!isPremium && <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="animate-scale-in">
            <p>Exporter ZIP</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <SaveProjectDialog open={saveOpen} onOpenChange={setSaveOpen} onSave={handleSaveProject} />
      <LoadProjectDialog open={loadOpen} onOpenChange={setLoadOpen} projects={getSavedProjects()} onLoad={handleLoadProject} onDelete={handleDeleteProject} />
      <CollaborationDialog open={collabOpen} onOpenChange={setCollabOpen} onJoin={realtime.joinProject} connected={realtime.connected} projectName={realtime.projectName} username={realtime.username} onLeave={realtime.leaveProject} onPush={realtime.pushState} users={realtime.users} myColor={realtime.myColor} creatorId={realtime.creatorId} userStats={realtime.userStats.stats} isPremium={!!isPremium} onOpenPremium={() => setPremiumOpen(true)} isAuthenticated={!!user} />
      <SyncHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} history={realtime.syncHistory.history} pendingCount={realtime.syncHistory.pendingCount} isAdmin={realtime.isAdmin} currentUsername={realtime.username} onApprove={id => realtime.syncHistory.approveEntry(id, realtime.username)} onReject={id => realtime.syncHistory.rejectEntry(id, realtime.username)} onAddComment={(id, comment) => realtime.syncHistory.addComment(id, comment)} />
      <SchemasDialog open={schemasOpen} onOpenChange={setSchemasOpen} schemas={realtime.projectSchemas.schemas} currentSchemaId={realtime.projectSchemas.currentSchemaId} onCreateSchema={realtime.projectSchemas.createSchema} onLoadSchema={realtime.projectSchemas.loadSchema} onUpdateSchema={realtime.projectSchemas.updateCurrentSchema} onDeleteSchema={realtime.projectSchemas.deleteSchema} onRenameSchema={realtime.projectSchemas.renameSchema} />
      <PremiumDialog open={premiumOpen} onOpenChange={setPremiumOpen} userId={user?.id} onSuccess={refreshProfile} />
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} profile={profile} roles={roles} onUpdateProfile={updateProfile} onOpenPremium={() => {
        setProfileOpen(false);
        setPremiumOpen(true);
      }} />
    </header>
    </>
    </TooltipProvider>;
}