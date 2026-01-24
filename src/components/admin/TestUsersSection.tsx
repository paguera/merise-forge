import { useState } from 'react';
import { Users, UserPlus, Mail, Shield, Crown, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AdminUser } from '@/hooks/useAdminDashboard';

interface TestUsersSectionProps {
  users: AdminUser[];
}

// Descriptions des utilisateurs test avec leurs rôles et scénarios
const TEST_USER_DESCRIPTIONS: Record<string, { description: string; scenario: string }> = {
  'user': {
    description: 'Utilisateur standard avec accès aux fonctionnalités de base',
    scenario: 'Peut créer/rejoindre des projets, utiliser le chat, et collaborer en temps réel'
  },
  'premium': {
    description: 'Utilisateur avec abonnement Premium actif',
    scenario: 'Accès à toutes les fonctionnalités utilisateur + fonctionnalités Premium exclusives'
  },
  'admin': {
    description: 'Administrateur avec accès au dashboard',
    scenario: 'Peut voir les utilisateurs, projets, tickets, mais ne peut PAS créer de codes promo ou distribuer des abonnements'
  },
  'super_admin': {
    description: 'Super Administrateur avec tous les droits',
    scenario: 'Accès complet : gestion des rôles, codes promo, abonnements, notifications, paramètres du site'
  }
};

export function TestUsersSection({ users }: TestUsersSectionProps) {
  // Catégoriser les utilisateurs
  const superAdmins = users.filter(u => u.roles.some(r => r.role === 'super_admin'));
  const admins = users.filter(u => u.roles.some(r => r.role === 'admin') && !u.roles.some(r => r.role === 'super_admin'));
  const premiumUsers = users.filter(u => u.is_premium && !u.roles.some(r => r.role === 'admin' || r.role === 'super_admin'));
  const regularUsers = users.filter(u => !u.is_premium && u.roles.every(r => r.role === 'user'));

  const getRoleIcon = (roles: AdminUser['roles'], isPremium: boolean) => {
    if (roles.some(r => r.role === 'super_admin')) return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    if (roles.some(r => r.role === 'admin')) return <Shield className="w-4 h-4 text-primary" />;
    if (isPremium) return <Crown className="w-4 h-4 text-amber-500" />;
    return <UserIcon className="w-4 h-4 text-muted-foreground" />;
  };

  const UserCard = ({ user, type }: { user: AdminUser; type: string }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10">
              {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getRoleIcon(user.roles, user.is_premium)}
              <p className="font-medium truncate">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.email.split('@')[0]
                }
              </p>
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {user.roles.some(r => r.role === 'super_admin') && (
                <Badge className="admin-badge-gold text-xs">Super Admin</Badge>
              )}
              {user.roles.some(r => r.role === 'admin') && !user.roles.some(r => r.role === 'super_admin') && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
              {user.is_premium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {TEST_USER_DESCRIPTIONS[type]?.description}
          </p>
          <p className="text-xs text-primary mt-1">
            <strong>Scénario :</strong> {TEST_USER_DESCRIPTIONS[type]?.scenario}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Super Admins */}
      {superAdmins.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Super Administrateurs ({superAdmins.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {superAdmins.map(user => (
              <UserCard key={user.id} user={user} type="super_admin" />
            ))}
          </div>
        </div>
      )}

      {/* Admins */}
      {admins.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            Administrateurs ({admins.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {admins.map(user => (
              <UserCard key={user.id} user={user} type="admin" />
            ))}
          </div>
        </div>
      )}

      {/* Premium Users */}
      {premiumUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            Utilisateurs Premium ({premiumUsers.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {premiumUsers.map(user => (
              <UserCard key={user.id} user={user} type="premium" />
            ))}
          </div>
        </div>
      )}

      {/* Regular Users */}
      {regularUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            Utilisateurs Standard ({regularUsers.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regularUsers.slice(0, 6).map(user => (
              <UserCard key={user.id} user={user} type="user" />
            ))}
          </div>
          {regularUsers.length > 6 && (
            <p className="text-sm text-muted-foreground mt-4">
              Et {regularUsers.length - 6} autres utilisateurs...
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun utilisateur enregistré</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
