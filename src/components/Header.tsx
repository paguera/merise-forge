import { useState, useRef } from 'react';
import { Database, Moon, Sun, Info, Save, FolderOpen, Archive, Upload, Users, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useTheme } from '@/hooks/useTheme';
import { ViewMode, SQLDialect, Entity, Relation, Attribute } from '@/types/merise';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SaveProjectDialog } from '@/components/dialogs/SaveProjectDialog';
import { LoadProjectDialog } from '@/components/dialogs/LoadProjectDialog';
import { CollaborationDialog } from '@/components/dialogs/CollaborationDialog';
import type { useRealtimeProject } from '@/hooks/useRealtimeProject';
import JSZip from 'jszip';

interface HeaderProps {
  realtime: ReturnType<typeof useRealtimeProject>;
}

export function Header({ realtime }: HeaderProps) {
  const navigate = useNavigate();
  const { viewMode, setViewMode, sqlDialect, setSqlDialect, generatedSQL, mldModel, model, addEntity, addRelation } = useMeriseStore();
  const { theme, cycleTheme } = useTheme();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSQLFile = (sql: string) => {
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const foreignKeys: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[] = [];
    
    // Normalize SQL: remove comments and extra whitespace
    let normalizedSQL = sql
      .replace(/--[^\n]*/g, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    // Extract all CREATE TABLE statements using a more robust approach
    const tableMatches: { name: string; content: string }[] = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(/gi;
    
    let match;
    while ((match = createTableRegex.exec(normalizedSQL)) !== null) {
      const tableName = match[1];
      const startIdx = match.index + match[0].length;
      
      // Find matching closing parenthesis
      let depth = 1;
      let endIdx = startIdx;
      for (let i = startIdx; i < normalizedSQL.length && depth > 0; i++) {
        if (normalizedSQL[i] === '(') depth++;
        else if (normalizedSQL[i] === ')') depth--;
        endIdx = i;
      }
      
      const columnsSection = normalizedSQL.substring(startIdx, endIdx);
      tableMatches.push({ name: tableName, content: columnsSection });
    }
    
    let yPos = 100;
    
    tableMatches.forEach(({ name: tableName, content: columnsSection }, tableIdx) => {
      const attributes: Attribute[] = [];
      
      // Split by comma but not commas inside parentheses
      const lines: string[] = [];
      let depth = 0;
      let current = '';
      for (let i = 0; i < columnsSection.length; i++) {
        const char = columnsSection[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
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
            toColumn: fkMatch[3],
          });
        }
      });
      
      // Filter constraint lines and parse column definitions
      const columnLines = lines.filter(l => {
        const upper = l.toUpperCase().trim();
        return l && 
          !upper.startsWith('PRIMARY KEY') && 
          !upper.startsWith('FOREIGN KEY') && 
          !upper.startsWith('KEY ') && 
          !upper.startsWith('CONSTRAINT') && 
          !upper.startsWith('UNIQUE') && 
          !upper.startsWith('INDEX') &&
          !upper.startsWith('CHECK') &&
          !upper.startsWith('FULLTEXT') &&
          !upper.startsWith('SPATIAL');
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
          
          const isPK = line.toUpperCase().includes('AUTO_INCREMENT') || 
                       line.toUpperCase().includes('PRIMARY KEY') ||
                       colName.toLowerCase() === 'id';
          
          attributes.push({
            id: `attr_${Date.now()}_${tableIdx}_${idx}_${Math.random().toString(36).substr(2,5)}`,
            name: colName,
            type: colType as Attribute['type'],
            isPrimaryKey: isPK,
            isNullable: !line.toUpperCase().includes('NOT NULL'),
          });
        }
      });
      
      if (attributes.length > 0) {
        entities.push({
          id: `entity_${Date.now()}_${tableIdx}_${Math.random().toString(36).substr(2,5)}`,
          name: tableName,
          attributes,
          position: { x: 100 + (tableIdx % 3) * 350, y: yPos },
        });
        if ((tableIdx + 1) % 3 === 0) yPos += 250;
      }
    });
    
    // Parse ALTER TABLE FK statements
    const alterFkRegex = /ALTER\s+TABLE\s+[`"']?(\w+)[`"']?[^;]*?ADD\s+(?:CONSTRAINT\s+[`"']?\w+[`"']?\s+)?FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/gi;
    while ((match = alterFkRegex.exec(normalizedSQL)) !== null) {
      const exists = foreignKeys.some(fk => 
        fk.fromTable.toLowerCase() === match![1].toLowerCase() && 
        fk.fromColumn.toLowerCase() === match![2].toLowerCase() && 
        fk.toTable.toLowerCase() === match![3].toLowerCase()
      );
      if (!exists) {
        foreignKeys.push({
          fromTable: match[1],
          fromColumn: match[2],
          toTable: match[3],
          toColumn: match[4],
        });
      }
    }
    
    // Detect junction tables (tables with only FKs as primary attributes)
    const junctionTables = new Set<string>();
    entities.forEach(entity => {
      const entityFKs = foreignKeys.filter(fk => fk.fromTable.toLowerCase() === entity.name.toLowerCase());
      if (entityFKs.length >= 2) {
        const nonFKCols = entity.attributes.filter(a => 
          !entityFKs.some(fk => fk.fromColumn.toLowerCase() === a.name.toLowerCase()) && !a.isPrimaryKey
        );
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
            y: (fromEntity.position.y + toEntity.position.y) / 2,
          },
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
            id: `rel_junction_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            name: junctionName,
            entity1Id: entity1.id,
            entity2Id: entity2.id,
            cardinality1: '0,n',
            cardinality2: '0,n',
            position: {
              x: (entity1.position.x + entity2.position.x) / 2,
              y: (entity1.position.y + entity2.position.y) / 2,
            },
          });
        }
      }
    });
    
    // Remove junction tables from entities list
    const filteredEntities = entities.filter(e => !junctionTables.has(e.name.toLowerCase()));
    
    return { entities: filteredEntities, relations };
  };

  const handleImportSQL = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const sql = e.target?.result as string;
      const { entities, relations } = parseSQLFile(sql);
      
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
    // Set exporting flag to prevent canvas zoom reset
    useMeriseStore.setState({ isExporting: true });
    
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
        generatedSQL: s.generatedSQL,
      };
    })();

    // Backup to localStorage
    try {
      localStorage.setItem(
        'merise-last-zip-backup',
        JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() })
      );
    } catch {
      // ignore
    }

    const zip = new JSZip();
    const { toPng } = await import('html-to-image');

    toast.info('Génération du ZIP en cours...');

    try {
      const views: ViewMode[] = ['MCD', 'MLD', 'MPD'];

      for (const view of views) {
        // Directly set viewMode WITHOUT triggering transform (bypass setViewMode)
        useMeriseStore.setState({ viewMode: view });
        
        // Ensure MLD model is preserved for MLD/MPD views
        if ((view === 'MLD' || view === 'MPD') && snapshot.mldModel) {
          useMeriseStore.setState({ mldModel: snapshot.mldModel });
        }
        
        await new Promise((r) => setTimeout(r, 600));

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
          
          await new Promise((r) => setTimeout(r, 100));
          
          const dataUrl = await toPng(canvas, {
            quality: 1,
            backgroundColor: theme === 'dark' ? '#1a1a2e' : '#e8eef5',
            width: minWidth,
            height: minHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left',
            },
            filter: (node) => {
              // Exclude zoom controls from export
              if (node.classList?.contains('zoom-controls')) return false;
              return true;
            }
          });
          
          // Restore original style
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
        isExporting: false,
      });
    }
  };

  // Calculate content bounds for proper export sizing
  const calculateContentBounds = (view: ViewMode, snapshotData: { model: typeof model; mldModel: typeof mldModel }) => {
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
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportSQL}
          accept=".sql"
          className="hidden"
        />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Importer SQL">
          <Upload className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setSaveOpen(true)} title="Sauvegarder">
          <Save className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setLoadOpen(true)} title="Charger">
          <FolderOpen className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/info')} title="Info">
          <Info className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Thème: ${theme}`}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : theme === 'spotify' ? <Music className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button
          variant={realtime.connected ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setCollabOpen(true)}
          title="Collaboration"
        >
          <Users className="w-5 h-5" />
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
      <CollaborationDialog
        open={collabOpen}
        onOpenChange={setCollabOpen}
        onJoin={realtime.joinProject}
        connected={realtime.connected}
        projectName={realtime.projectName}
        username={realtime.username}
        onLeave={realtime.leaveProject}
        onPush={realtime.pushState}
        users={realtime.users}
        myColor={realtime.myColor}
      />
    </header>
  );
}
