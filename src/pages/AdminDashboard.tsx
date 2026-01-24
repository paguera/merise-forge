import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Users, Crown, Gift, Settings, LogOut, ArrowLeft, 
  Shield, ShieldCheck, User as UserIcon, Plus, Trash2, 
  ToggleLeft, ToggleRight, Search, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile, isSuperAdmin, isAdmin, signOut, loading: authLoading } = useAuth();
  const { 
    users, promoCodes, subscriptions, loading: dataLoading, 
    refresh, togglePremium, updateUserRole, createPromoCode, togglePromoCode, deletePromoCode 
  } = useAdminData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [createPromoOpen, setCreatePromoOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_percent: 0,
    gives_premium: true,
    premium_days: 30,
    max_uses: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/auth');
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePromo = async () => {
    if (!newPromo.code.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }

    const { error } = await createPromoCode(newPromo);
    if (error) {
      toast.error('Erreur lors de la création du code promo');
    } else {
      toast.success('Code promo créé');
      setCreatePromoOpen(false);
      setNewPromo({
        code: '',
        discount_percent: 0,
        gives_premium: true,
        premium_days: 30,
        max_uses: 0,
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    const { error } = await updateUserRole(userId, newRole);
    if (error) {
      toast.error('Erreur lors du changement de rôle');
    } else {
      toast.success('Rôle mis à jour');
    }
  };

  const handleTogglePremium = async (userId: string, currentPremium: boolean) => {
    const { error } = await togglePremium(userId, !currentPremium);
    if (error) {
      toast.error('Erreur lors du changement de statut Premium');
    } else {
      toast.success(!currentPremium ? 'Premium activé' : 'Premium désactivé');
    }
  };

  const premiumCount = users.filter(u => u.is_premium).length;
  const adminCount = users.filter(u => u.roles.some(r => r.role === 'admin' || r.role === 'super_admin')).length;
  const activePromoCount = promoCodes.filter(p => p.is_active).length;

  const getRoleIcon = (roles: typeof users[0]['roles']) => {
    if (roles.some(r => r.role === 'super_admin')) return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    if (roles.some(r => r.role === 'admin')) return <Shield className="w-4 h-4 text-primary" />;
    return <UserIcon className="w-4 h-4 text-muted-foreground" />;
  };

  const getRoleValue = (roles: typeof users[0]['roles']) => {
    if (roles.some(r => r.role === 'super_admin')) return 'super_admin';
    if (roles.some(r => r.role === 'admin')) return 'admin';
    return 'user';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">Dashboard Admin</h1>
              <p className="text-sm text-muted-foreground">Ressou Merize</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="admin-badge-gold gap-1">
            {isSuperAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </Badge>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/auth'); }}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold">{premiumCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{adminCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Codes Promo Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">{activePromoCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="promos" className="gap-2">
              <Gift className="w-4 h-4" />
              Codes Promo
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Crown className="w-4 h-4" />
              Abonnements
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback>
                              {u.first_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {u.first_name && u.last_name 
                              ? `${u.first_name} ${u.last_name}`
                              : u.email.split('@')[0]
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        {isSuperAdmin ? (
                          <Select
                            value={getRoleValue(u.roles)}
                            onValueChange={(v) => handleRoleChange(u.user_id, v as 'user' | 'admin' | 'super_admin')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Utilisateur</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {getRoleIcon(u.roles)}
                            <span className="capitalize">{getRoleValue(u.roles).replace('_', ' ')}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.is_premium}
                          onCheckedChange={() => handleTogglePremium(u.user_id, u.is_premium)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promos" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={createPromoOpen} onOpenChange={setCreatePromoOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nouveau code promo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un code promo</DialogTitle>
                    <DialogDescription>
                      Créez un nouveau code promo pour vos utilisateurs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input
                        placeholder="PREMIUM2024"
                        value={newPromo.code}
                        onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                        className="uppercase"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Offre Premium</Label>
                      <Switch
                        checked={newPromo.gives_premium}
                        onCheckedChange={(v) => setNewPromo({ ...newPromo, gives_premium: v })}
                      />
                    </div>
                    {newPromo.gives_premium && (
                      <div className="space-y-2">
                        <Label>Durée Premium (jours)</Label>
                        <Input
                          type="number"
                          value={newPromo.premium_days}
                          onChange={(e) => setNewPromo({ ...newPromo, premium_days: parseInt(e.target.value) || 30 })}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Utilisations max (0 = illimité)</Label>
                      <Input
                        type="number"
                        value={newPromo.max_uses}
                        onChange={(e) => setNewPromo({ ...newPromo, max_uses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreatePromoOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreatePromo}>
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-semibold">{promo.code}</TableCell>
                      <TableCell>
                        {promo.gives_premium ? (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                            <Crown className="w-3 h-3" />
                            {promo.premium_days} jours
                          </Badge>
                        ) : (
                          <Badge variant="secondary">-{promo.discount_percent}%</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.current_uses}/{promo.max_uses || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                          {promo.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(promo.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePromoCode(promo.id, !promo.is_active)}
                          >
                            {promo.is_active ? (
                              <ToggleRight className="w-4 h-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePromoCode(promo.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {promoCodes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun code promo créé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Expiration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.user_email}</TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                          <Crown className="w-3 h-3" />
                          {sub.plan_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sub.started_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('fr-FR') : 'Illimité'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun abonnement actif
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
