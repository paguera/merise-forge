import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Shield, 
  ShieldCheck, 
  Crown, 
  User, 
  Mail,
  Calendar,
  Lock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type { AdminUser } from '@/hooks/useAdminDashboard';

interface UsersManagementSectionProps {
  users: AdminUser[];
  isSuperAdmin: boolean;
  currentUserId: string;
  onUpdateRole: (userId: string, newRole: 'user' | 'admin' | 'super_admin') => Promise<{ error: any }>;
  onTogglePremium: (userId: string, isPremium: boolean) => Promise<{ error: any }>;
}

export function UsersManagementSection({
  users,
  isSuperAdmin,
  currentUserId,
  onUpdateRole,
  onTogglePremium,
}: UsersManagementSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleValue = (roles: AdminUser['roles']): 'user' | 'admin' | 'super_admin' => {
    if (roles.some((r) => r.role === 'super_admin')) return 'super_admin';
    if (roles.some((r) => r.role === 'admin')) return 'admin';
    return 'user';
  };

  const handleRoleChange = async (userId: string, targetRole: 'admin' | 'super_admin', checked: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Seuls les Super Admins peuvent modifier les rôles');
      return;
    }

    // Prevent changing own role
    if (userId === currentUserId) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }

    setUpdating(userId);
    
    let newRole: 'user' | 'admin' | 'super_admin' = 'user';
    
    if (targetRole === 'super_admin') {
      newRole = checked ? 'super_admin' : 'admin';
    } else if (targetRole === 'admin') {
      newRole = checked ? 'admin' : 'user';
    }

    const { error } = await onUpdateRole(userId, newRole);
    if (error) {
      toast.error('Erreur lors de la mise à jour du rôle');
    } else {
      toast.success(`Rôle mis à jour: ${newRole}`);
    }
    setUpdating(null);
  };

  const handlePremiumToggle = async (userId: string, currentPremium: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Seuls les Super Admins peuvent gérer le premium');
      return;
    }

    setUpdating(userId);
    const { error } = await onTogglePremium(userId, !currentPremium);
    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      toast.success(currentPremium ? 'Premium retiré' : 'Premium accordé');
    }
    setUpdating(null);
  };

  const getInitials = (user: AdminUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <div className="space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.is_premium).length}
              </p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => getRoleValue(u.roles) === 'admin').length}
              </p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => getRoleValue(u.roles) === 'super_admin').length}
              </p>
              <p className="text-xs text-muted-foreground">Super Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user, index) => {
          const role = getRoleValue(user.roles);
          const isPremium = user.is_premium || (user.premium_until && new Date(user.premium_until) > new Date());
          const isSelf = isCurrentUser(user.user_id);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`relative overflow-hidden ${updating === user.user_id ? 'opacity-50' : ''} ${isSelf ? 'ring-2 ring-primary/50' : ''}`}>
                {/* Role indicator stripe */}
                <div
                  className={`absolute top-0 left-0 w-full h-1 ${
                    role === 'super_admin'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                      : role === 'admin'
                      ? 'bg-blue-500'
                      : 'bg-muted'
                  }`}
                />

                {/* Self indicator */}
                {isSelf && (
                  <Badge className="absolute top-3 right-3 gap-1 bg-primary/20 text-primary text-xs">
                    C'est vous
                  </Badge>
                )}

                <CardContent className="p-4 pt-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : 'Sans nom'}
                        </h3>
                        {isPremium && (
                          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Role badges */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {role === 'super_admin' && (
                      <Badge className="admin-badge-gold gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Super Admin
                      </Badge>
                    )}
                    {role === 'admin' && (
                      <Badge variant="default" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                    {role === 'user' && (
                      <Badge variant="secondary">Utilisateur</Badge>
                    )}
                  </div>

                  {/* Role checkboxes - Super Admin only */}
                  {isSuperAdmin && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Super Admin role - disabled for self */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`sa-${user.id}`}
                            checked={role === 'super_admin'}
                            onCheckedChange={(checked) =>
                              handleRoleChange(user.user_id, 'super_admin', !!checked)
                            }
                            disabled={updating === user.user_id || isSelf}
                          />
                          <label
                            htmlFor={`sa-${user.id}`}
                            className={`text-sm flex items-center gap-1 ${isSelf ? 'text-muted-foreground' : 'cursor-pointer'}`}
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            Super Admin
                            {isSelf && <Lock className="w-3 h-3 ml-1" />}
                          </label>
                        </div>
                      </div>

                      {/* Admin role - disabled for self */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`admin-${user.id}`}
                            checked={role === 'admin' || role === 'super_admin'}
                            onCheckedChange={(checked) =>
                              handleRoleChange(user.user_id, 'admin', !!checked)
                            }
                            disabled={updating === user.user_id || role === 'super_admin' || isSelf}
                          />
                          <label
                            htmlFor={`admin-${user.id}`}
                            className={`text-sm flex items-center gap-1 ${isSelf ? 'text-muted-foreground' : 'cursor-pointer'}`}
                          >
                            <Shield className="w-4 h-4 text-blue-500" />
                            Admin
                            {isSelf && <Lock className="w-3 h-3 ml-1" />}
                          </label>
                        </div>
                      </div>

                      {/* Premium - allowed for self */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`premium-${user.id}`}
                            checked={!!isPremium}
                            onCheckedChange={() =>
                              handlePremiumToggle(user.user_id, !!isPremium)
                            }
                            disabled={updating === user.user_id}
                          />
                          <label
                            htmlFor={`premium-${user.id}`}
                            className="text-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Crown className="w-4 h-4 text-amber-500" />
                            Premium
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
            <p className="text-sm">Essayez de modifier votre recherche</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
