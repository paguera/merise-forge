import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Clock, 
  Users, 
  Trash2, 
  ExternalLink,
  Copy,
  Check,
  Shield,
  Calendar,
  Edit3,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeProject } from '@/hooks/useRealtimeProject';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  collaborator_count: number | null;
  created_at: string;
  updated_at: string;
  isCreator: boolean;
}

interface LocalProject {
  name: string;
  savedAt: string;
  type: 'local';
}

export default function MyProjects() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const realtime = useRealtimeProject();
  
  const [cloudProjects, setCloudProjects] = useState<Project[]>([]);
  const [localProjects, setLocalProjects] = useState<LocalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'created' | 'collaborating' | 'local'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProjects();
    }
    loadLocalProjects();
  }, [user, authLoading, navigate]);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch projects where user is creator OR has participated
      const { data: createdProjects, error: createdError } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', user.email || user.id);

      if (createdError) throw createdError;

      // Fetch projects where user has stats (participated)
      const { data: participatedStats, error: statsError } = await supabase
        .from('project_user_stats')
        .select('project_id')
        .eq('username', user.email || user.id);

      if (statsError) throw statsError;

      const participatedIds = participatedStats?.map(s => s.project_id) || [];
      
      let participatedProjects: Project[] = [];
      if (participatedIds.length > 0) {
        const { data: collabProjects, error: collabError } = await supabase
          .from('projects')
          .select('*')
          .in('id', participatedIds)
          .neq('creator_id', user.email || user.id);

        if (!collabError && collabProjects) {
          participatedProjects = collabProjects.map(p => ({
            ...p,
            isCreator: false
          }));
        }
      }

      const allProjects: Project[] = [
        ...(createdProjects || []).map(p => ({ ...p, isCreator: true })),
        ...participatedProjects
      ];

      setCloudProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalProjects = () => {
    const projects: LocalProject[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('merise-project-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          projects.push({
            name: key.replace('merise-project-', ''),
            savedAt: data.savedAt || new Date().toISOString(),
            type: 'local'
          });
        } catch {
          // Skip invalid entries
        }
      }
    }
    setLocalProjects(projects.sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    ));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copié !');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleJoinProject = (projectName: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }
    const username = user.email || user.id;
    realtime.joinProject(projectName, username);
    navigate('/');
  };

  const handleDeleteLocalProject = (name: string) => {
    localStorage.removeItem(`merise-project-${name}`);
    loadLocalProjects();
    toast.success(`Projet "${name}" supprimé`);
  };

  const filteredCloudProjects = cloudProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === 'created') return matchesSearch && p.isCreator;
    if (filter === 'collaborating') return matchesSearch && !p.isCreator;
    if (filter === 'local') return false;
    return matchesSearch;
  });

  const filteredLocalProjects = filter === 'local' || filter === 'all' 
    ? localProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="w-7 h-7 text-primary" />
                Mes Projets
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos projets Merise locaux et collaboratifs
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/')}
            className="neu-button gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau projet
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 neu-input"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {(['all', 'created', 'collaborating', 'local'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? 'neu-button' : ''}
              >
                {f === 'all' && 'Tous'}
                {f === 'created' && 'Créés'}
                {f === 'collaborating' && 'Collaborations'}
                {f === 'local' && 'Locaux'}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="neu-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {cloudProjects.filter(p => p.isCreator).length}
              </div>
              <div className="text-xs text-muted-foreground">Projets créés</div>
            </CardContent>
          </Card>
          <Card className="neu-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {cloudProjects.filter(p => !p.isCreator).length}
              </div>
              <div className="text-xs text-muted-foreground">Collaborations</div>
            </CardContent>
          </Card>
          <Card className="neu-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary-foreground">
                {localProjects.length}
              </div>
              <div className="text-xs text-muted-foreground">Projets locaux</div>
            </CardContent>
          </Card>
          <Card className="neu-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {cloudProjects.length + localProjects.length}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-6">
            {/* Cloud Projects */}
            {(filter === 'all' || filter === 'created' || filter === 'collaborating') && (
              <>
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="neu-card">
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3 mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredCloudProjects.length > 0 ? (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Projets Cloud
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredCloudProjects.map(project => (
                        <Card 
                          key={project.id} 
                          className="neu-card hover:shadow-lg transition-all group"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                                  <span className="truncate">{project.name}</span>
                                  {project.isCreator && (
                                    <Badge className="admin-badge-gold text-xs shrink-0">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Créateur
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="mt-1 line-clamp-2">
                                  {project.description || 'Aucune description'}
                                </CardDescription>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyCode(project.name)}
                                className="shrink-0"
                              >
                                {copiedCode === project.name ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(project.created_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(project.updated_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                              {project.collaborator_count !== null && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {project.collaborator_count}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleJoinProject(project.name)}
                                className="flex-1 neu-button"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Ouvrir
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Local Projects */}
            {filteredLocalProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-secondary-foreground" />
                  Projets Locaux
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredLocalProjects.map(project => (
                    <Card key={project.name} className="neu-card hover:shadow-lg transition-all">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="truncate">{project.name}</span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Local
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3" />
                          {format(new Date(project.savedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLocalProject(project.name)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Load and navigate
                              const data = localStorage.getItem(`merise-project-${project.name}`);
                              if (data) {
                                const parsed = JSON.parse(data);
                                const { useMeriseStore } = require('@/hooks/useMeriseStore');
                                useMeriseStore.setState({
                                  model: parsed.model,
                                  mldModel: parsed.mldModel,
                                  sqlDialect: parsed.sqlDialect,
                                  generatedSQL: parsed.generatedSQL
                                });
                                toast.success(`Projet "${project.name}" chargé`);
                                navigate('/');
                              }
                            }}
                            className="flex-1 neu-button"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Charger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCloudProjects.length === 0 && filteredLocalProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  Aucun projet trouvé
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery 
                    ? 'Essayez une autre recherche'
                    : 'Créez votre premier projet Merise !'
                  }
                </p>
                <Button 
                  onClick={() => navigate('/')} 
                  className="mt-4 neu-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un projet
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <Footer />
    </div>
  );
}
