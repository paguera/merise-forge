import { Users, Crown, Shield, Gift, FolderOpen, MessageSquare, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminStatsCardsProps {
  usersCount: number;
  premiumCount: number;
  adminCount: number;
  activePromoCount: number;
  projectsCount: number;
  ticketsCount: number;
  isSuperAdmin: boolean;
}

export function AdminStatsCards({
  usersCount,
  premiumCount,
  adminCount,
  activePromoCount,
  projectsCount,
  ticketsCount,
  isSuperAdmin,
}: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{usersCount}</span>
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Projets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">{projectsCount}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold">{ticketsCount}</span>
          </div>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Codes Promo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{activePromoCount}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
