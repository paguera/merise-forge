import { useState, useRef } from 'react';
import { Database, Download, Moon, Sun, Info, Save, FolderOpen, Archive, Upload } from 'lucide-react';
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
import JSZip from 'jszip';

export function Header() {
  const navigate = useNavigate();
  const { viewMode, setViewMode, sqlDialect, setSqlDialect, generatedSQL, mldModel, model, addEntity, addRelation } = useMeriseStore();
  const { theme, toggleTheme } = useTheme();
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSQLFile = (sql: string) => {
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const foreignKeys: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[] = [];
    const tableColumns: Map<string, string[]> = new Map();
    
    // Parse CREATE TABLE statements
    const tableRegex = /CREATE TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi;
    let match;
    let yPos = 100;
    
    while ((match = tableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsSection = match[2];
      
      const attributes: Attribute[] = [];
      const fkColumns: string[] = [];
      const lines = columnsSection.split(/,(?![^()]*\))/).map(l => l.trim());
      
      // Parse FK constraints
      lines.forEach(line => {
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\(`?(\w+)`?\)\s*REFERENCES\s+`?(\w+)`?\s*\(`?(\w+)`?\)/i);
        if (fkMatch) {
          foreignKeys.push({
            fromTable: tableName,
            fromColumn: fkMatch[1],
            toTable: fkMatch[2],
            toColumn: fkMatch[3],
          });
          fkColumns.push(fkMatch[1]);
        }
      });
      
      const columnLines = lines.filter(l => l && !l.startsWith('PRIMARY') && !l.startsWith('FOREIGN') && !l.startsWith('KEY') && !l.startsWith('CONSTRAINT') && !l.startsWith('UNIQUE') && !l.startsWith('INDEX'));
      
      columnLines.forEach((line, idx) => {
        const colMatch = line.match(/`?(\w+)`?\s+(\w+(?:\(\d+(?:,\d+)?\))?)/i);
        if (colMatch) {
          attributes.push({
            id: `attr_${Date.now()}_${idx}_${Math.random().toString(36).substr(2,5)}`,
            name: colMatch[1],
            type: colMatch[2].toUpperCase() as Attribute['type'],
            isPrimaryKey: line.toUpperCase().includes('AUTO_INCREMENT') || colMatch[1].toLowerCase() === 'id',
            isNullable: !line.toUpperCase().includes('NOT NULL'),
          });
        }
      });
      
      tableColumns.set(tableName, attributes.map(a => a.name));
      
      if (attributes.length > 0) {
        entities.push({
          id: `entity_${Date.now()}_${entities.length}_${Math.random().toString(36).substr(2,5)}`,
          name: tableName,
          attributes,
          position: { x: 100 + (entities.length % 3) * 300, y: yPos },
        });
        if ((entities.length) % 3 === 0) yPos += 200;
      }
    }
    
    // Parse ALTER TABLE FK statements
    const alterFkRegex = /ALTER\s+TABLE\s+`?(\w+)`?[\s\S]*?FOREIGN\s+KEY\s*\(`?(\w+)`?\)\s*REFERENCES\s+`?(\w+)`?\s*\(`?(\w+)`?\)/gi;
    while ((match = alterFkRegex.exec(sql)) !== null) {
      foreignKeys.push({
        fromTable: match[1],
        fromColumn: match[2],
        toTable: match[3],
        toColumn: match[4],
      });
    }
    
    // Detect junction tables (tables with only FKs as primary attributes)
    const junctionTables = new Set<string>();
    entities.forEach(entity => {
      const entityFKs = foreignKeys.filter(fk => fk.fromTable === entity.name);
      if (entityFKs.length >= 2) {
        const nonFKCols = entity.attributes.filter(a => 
          !entityFKs.some(fk => fk.fromColumn === a.name) && !a.isPrimaryKey
        );
        if (nonFKCols.length === 0) {
          junctionTables.add(entity.name);
        }
      }
    });
    
    // Create relations from FKs
    foreignKeys.forEach((fk, idx) => {
      const fromEntity = entities.find(e => e.name === fk.fromTable);
      const toEntity = entities.find(e => e.name === fk.toTable);
      
      if (fromEntity && toEntity && !junctionTables.has(fk.fromTable)) {
        relations.push({
          id: `rel_${Date.now()}_${idx}`,
          name: `${fk.fromColumn.replace(/_?id$/i, '')}`,
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
      const junctionFKs = foreignKeys.filter(fk => fk.fromTable === junctionName);
      if (junctionFKs.length >= 2) {
        const entity1 = entities.find(e => e.name === junctionFKs[0].toTable);
        const entity2 = entities.find(e => e.name === junctionFKs[1].toTable);
        
        if (entity1 && entity2) {
          relations.push({
            id: `rel_junction_${Date.now()}`,
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
    const filteredEntities = entities.filter(e => !junctionTables.has(e.name));
    
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
