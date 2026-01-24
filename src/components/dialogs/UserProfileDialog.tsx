import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Camera, Crown, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, UserRole } from '@/hooks/useAuth';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile | null;
  roles: UserRole[];
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  onOpenPremium: () => void;
}

export function UserProfileDialog({ 
  open, 
  onOpenChange, 
  profile, 
  roles,
  onUpdateProfile,
  onOpenPremium,
}: UserProfileDialogProps) {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  const isPremium = profile?.is_premium || (profile?.premium_until && new Date(profile.premium_until) > new Date());
  const highestRole = roles.find(r => r.role === 'super_admin')?.role 
    || roles.find(r => r.role === 'admin')?.role 
    || 'user';

  const handleSave = async () => {
    setLoading(true);
    const { error } = await onUpdateProfile({
      first_name: firstName || null,
      last_name: lastName || null,
      avatar_url: avatarUrl || null,
    });
    setLoading(false);

    if (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    } else {
      toast.success('Profil mis à jour');
      onOpenChange(false);
    }
  };

  const getInitials = () => {
    if (firstName || lastName) {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }
    return profile?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    switch (highestRole) {
      case 'super_admin':
        return <Badge className="admin-badge-gold gap-1"><Shield className="w-3 h-3" />Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default" className="gap-1"><Shield className="w-3 h-3" />Admin</Badge>;
      default:
        return <Badge variant="secondary">Utilisateur</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mon Profil
          </DialogTitle>
          <DialogDescription>
            Gérez vos informations personnelles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 w-full">
              <Input
                placeholder="URL de l'avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {getRoleBadge()}
            {isPremium ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20"
                onClick={onOpenPremium}
              >
                <Crown className="w-3 h-3 mr-1 text-amber-500" />
                Passer Premium
              </Badge>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </div>
            </div>

            {profile?.premium_until && isPremium && (
              <div className="space-y-2">
                <Label>Premium jusqu'au</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(profile.premium_until).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
