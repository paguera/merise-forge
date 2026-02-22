import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Menu,
  User,
  LogOut,
  Crown,
  Shield,
  ShieldCheck,
  HelpCircle,
  Users,
  FolderOpen,
  Upload,
  Bookmark,
  FileArchive,
  Moon,
  Sun,
  Music,
  Clock,
  Layers,
  Sparkles,
  Home,
  Settings,
  Zap
} from 'lucide-react';
import { UserProfile, UserRole } from '@/hooks/useAuth';
import { ViewMode } from '@/types/merise';
import { UserBadges, getUserBadges } from './badges/UserBadges';

interface MobileMenuProps {
  user: any;
  profile: UserProfile | null;
  roles: UserRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPremium: boolean;
  viewMode: ViewMode;
  theme: string;
  connected: boolean;
  isProjectAdmin: boolean;
  onSetViewMode: (mode: ViewMode) => void;
  onCycleTheme: () => void;
  onSignOut: () => void;
  onOpenCollab: () => void;
  onOpenHistory: () => void;
  onOpenSchemas: () => void;
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenProfile: () => void;
  onOpenPremium: () => void;
  onImportSQL: () => void;
  onExportZip: () => void;
  mldModel: any;
}

export function MobileMenu({
  user,
  profile,
  roles,
  isAdmin,
  isSuperAdmin,
  isPremium,
  viewMode,
  theme,
  connected,
  isProjectAdmin,
  onSetViewMode,
  onCycleTheme,
  onSignOut,
  onOpenCollab,
  onOpenHistory,
  onOpenSchemas,
  onOpenSave,
  onOpenLoad,
  onOpenProfile,
  onOpenPremium,
  onImportSQL,
  onExportZip,
  mldModel
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const userBadges = getUserBadges({
    isSuperAdmin,
    isAdmin,
    isPremium,
    isCreator: isProjectAdmin
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-60px)] overflow-y-auto">
          {/* User Profile Section */}
          {user ? (
            <div className="p-4 bg-secondary/30">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                    {profile?.first_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {profile?.first_name || profile?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>
              </div>
              {userBadges.length > 0 && (
                <div className="mt-3">
                  <UserBadges badges={userBadges} size="sm" maxVisible={4} />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-secondary/30">
              <Button 
                className="w-full" 
                onClick={() => handleAction(() => navigate('/auth'))}
              >
                <User className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            </div>
          )}

          {/* View Mode Tabs */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Vue</p>
            <Tabs value={viewMode} onValueChange={v => handleAction(() => onSetViewMode(v as ViewMode))}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="MCD" className="text-xs">MCD</TabsTrigger>
                <TabsTrigger value="MLD" className="text-xs">MLD</TabsTrigger>
                <TabsTrigger value="MPD" className="text-xs">MPD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          {/* Navigation */}
          <div className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Navigation</p>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-base" 
              onClick={() => handleAction(() => navigate('/'))}
            >
              <Home className="w-5 h-5 mr-3" />
              Accueil
            </Button>

            {user && (
              <Button 
                variant="ghost" 
                className="w-full justify-start h-11 text-base" 
                onClick={() => handleAction(() => navigate('/my-projects'))}
              >
                <FolderOpen className="w-5 h-5 mr-3" />
                Mes Projets
              </Button>
            )}

            <Button 
              variant={connected ? 'secondary' : 'ghost'}
              className="w-full justify-start h-11 text-base" 
              onClick={() => handleAction(onOpenCollab)}
            >
              <Users className="w-5 h-5 mr-3" />
              Collaboration
              {connected && <Badge className="ml-auto" variant="default">Connecté</Badge>}
            </Button>

            {connected && (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-base" 
                  onClick={() => handleAction(onOpenHistory)}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  Historique
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-base" 
                  onClick={() => handleAction(onOpenSchemas)}
                >
                  <Layers className="w-5 h-5 mr-3" />
                  Schémas
                </Button>
              </>
            )}
          </div>

          <Separator />

          {/* Project Actions */}
          <div className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Projet</p>

            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-base" 
              onClick={() => handleAction(onImportSQL)}
            >
              <Upload className="w-5 h-5 mr-3" />
              Importer SQL
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-base" 
              onClick={() => handleAction(onOpenSave)}
            >
              <Bookmark className="w-5 h-5 mr-3" />
              Sauvegarder
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-base" 
              onClick={() => handleAction(onOpenLoad)}
            >
              <FolderOpen className="w-5 h-5 mr-3" />
              Charger
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-base relative" 
              onClick={() => handleAction(onExportZip)}
              disabled={!mldModel}
            >
              <FileArchive className="w-5 h-5 mr-3" />
              Export ZIP
              {!isPremium && <Crown className="w-4 h-4 ml-auto text-amber-500" />}
            </Button>
          </div>

          <Separator />

          {/* Settings */}
          <div className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Paramètres</p>

            <Button 
              variant="ghost" 
              className="w-full justify-start h-11 text-base" 
              onClick={() => handleAction(onCycleTheme)}
            >
              {theme === 'violet' ? (
                <Zap className="w-5 h-5 mr-3 text-purple-400" />
              ) : theme === 'dark' ? (
                <Sun className="w-5 h-5 mr-3 text-amber-400" />
              ) : theme === 'spotify' ? (
                <Music className="w-5 h-5 mr-3 text-accent" />
              ) : (
                <Moon className="w-5 h-5 mr-3 text-primary" />
              )}
              Thème: {theme === 'violet' ? 'Violet Néon' : theme === 'dark' ? 'Sombre' : theme === 'spotify' ? 'Spotify' : 'Clair'}
            </Button>

            {user && (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-base" 
                  onClick={() => handleAction(onOpenProfile)}
                >
                  <User className="w-5 h-5 mr-3" />
                  Mon Profil
                </Button>

                {!isPremium && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-11 text-base text-amber-500" 
                    onClick={() => handleAction(onOpenPremium)}
                  >
                    <Crown className="w-5 h-5 mr-3" />
                    Passer Premium
                    <Sparkles className="w-4 h-4 ml-auto" />
                  </Button>
                )}

                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-11 text-base" 
                    onClick={() => handleAction(() => navigate('/admin'))}
                  >
                    {isSuperAdmin ? (
                      <ShieldCheck className="w-5 h-5 mr-3 text-amber-500" />
                    ) : (
                      <Shield className="w-5 h-5 mr-3" />
                    )}
                    Dashboard Admin
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-base" 
                  onClick={() => handleAction(() => navigate('/support'))}
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  Support
                </Button>
              </>
            )}
          </div>

          {/* Logout */}
          {user && (
            <>
              <Separator />
              <div className="p-4 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-11 text-base text-destructive hover:text-destructive" 
                  onClick={() => handleAction(onSignOut)}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Déconnexion
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
