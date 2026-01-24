import { useState } from 'react';
import { Users, ShieldCheck, Shield, User as UserIcon, Search, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { AdminUser } from '@/hooks/useAdminDashboard';

interface RoleManagementSectionProps {
  users: AdminUser[];
  isSuperAdmin: boolean;
  onUpdateRole: (userId: string, newRole: 'user' | 'admin' | 'super_admin') => Promise<{ error: any }>;
  onTogglePremium: (userId: string, isPremium: boolean) => Promise<{ error: any }>;
}

const ROLE_DESCRIPTIONS = {
  super_admin: {
    title: 'Super Admin',
    description: 'Contrôle total de la plateforme',
    capabilities: ['Gestion des rôles', 'Codes promo', 'Abonnements', 'Notifications', 'Paramètres'],
    icon: ShieldCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  admin: {
    title: 'Admin',
    description: 'Accès au dashboard avec restrictions',
    capabilities: ['Voir utilisateurs', 'Voir projets', 'Gérer tickets'],
    icon: Shield,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  user: {
    title: 'Utilisateur',
    description: 'Accès standard aux fonctionnalités',
    capabilities: ['Créer projets', 'Collaborer', 'Chat'],
    icon: UserIcon,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
  },
};

export function RoleManagementSection({ 
  users, 
  isSuperAdmin, 
  onUpdateRole,
  onTogglePremium 
}: RoleManagementSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleValue = (roles: AdminUser['roles']): 'user' | 'admin' | 'super_admin' => {
    if (roles.some(r => r.role === 'super_admin')) return 'super_admin';
    if (roles.some(r => r.role === 'admin')) return 'admin';
    return 'user';
  };

  const handleRoleToggle = async (userId: string, targetRole: 'admin' | 'super_admin', checked: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Seuls les Super Admins peuvent modifier les rôles');
      return;
    }

    setUpdating(userId);
    
    const newRole = checked ? targetRole : 'user';
    const { error } = await onUpdateRole(userId, newRole);
    
    if (error) {
      toast.error('Erreur lors de la mise à jour du rôle');
    } else {
      toast.success(`Rôle mis à jour vers ${ROLE_DESCRIPTIONS[newRole].title}`);
    }
    
    setUpdating(null);
  };

  const handlePremiumToggle = async (userId: string, currentPremium: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Seuls les Super Admins peuvent gérer les abonnements');
      return;
    }

    setUpdating(userId);
    const { error } = await onTogglePremium(userId, !currentPremium);
    
    if (error) {
      toast.error('Erreur lors de la mise à jour Premium');
    } else {
      toast.success(!currentPremium ? 'Premium activé' : 'Premium désactivé');
    }
    
    setUpdating(null);
  };

  if (!isSuperAdmin) {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardContent className="py-12 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto text-amber-500/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Accès Super Admin requis</h3>
          <p className="text-muted-foreground">
            La gestion des rôles et permissions est réservée aux Super Administrateurs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Legend */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(ROLE_DESCRIPTIONS).map(([key, role]) => {
          const Icon = role.icon;
          return (
            <Card key={key} className={`${role.borderColor} ${role.bgColor} border transition-all hover:shadow-lg`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${role.color}`}>
                  <Icon className="w-5 h-5" />
                  {role.title}
                </CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {role.capabilities.map(cap => (
                    <Badge key={cap} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map(user => {
          const currentRole = getRoleValue(user.roles);
          const isUpdating = updating === user.user_id;
          const roleInfo = ROLE_DESCRIPTIONS[currentRole];
          const RoleIcon = roleInfo.icon;

          return (
            <Card 
              key={user.id} 
              className={`transition-all hover:shadow-lg ${isUpdating ? 'opacity-70' : ''} ${roleInfo.borderColor} border-2`}
            >
              <CardContent className="pt-6">
                {/* User Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12 ring-2 ring-offset-2 ring-offset-background" style={{ '--tw-ring-color': `hsl(var(--${currentRole === 'super_admin' ? 'primary' : currentRole === 'admin' ? 'primary' : 'muted'}))` } as any}>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className={`${roleInfo.bgColor} ${roleInfo.color}`}>
                      {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
                      <p className="font-semibold truncate">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.email.split('@')[0]
                        }
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {currentRole === 'super_admin' && (
                        <Badge className="admin-badge-gold text-xs gap-1">
                          <Sparkles className="w-3 h-3" />
                          Super Admin
                        </Badge>
                      )}
                      {currentRole === 'admin' && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Shield className="w-3 h-3" />
                          Admin
                        </Badge>
                      )}
                      {user.is_premium && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs gap-1">
                          <Crown className="w-3 h-3" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Checkboxes */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Attribution des rôles
                  </p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={currentRole === 'super_admin'}
                        onCheckedChange={(checked) => handleRoleToggle(user.user_id, 'super_admin', checked as boolean)}
                        disabled={isUpdating}
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">Super Admin</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={currentRole === 'admin'}
                        onCheckedChange={(checked) => handleRoleToggle(user.user_id, 'admin', checked as boolean)}
                        disabled={isUpdating || currentRole === 'super_admin'}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Admin</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={user.is_premium}
                        onCheckedChange={() => handlePremiumToggle(user.user_id, user.is_premium)}
                        disabled={isUpdating}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500"
                      />
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">Premium</span>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
