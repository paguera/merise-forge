import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Crown, Shield, ShieldCheck, FolderOpen, Ticket, 
  TrendingUp, Calendar, Activity, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import type { AdminUser, Project, SupportTicket } from '@/hooks/useAdminDashboard';

interface AdminDashboardStatsProps {
  users: AdminUser[];
  projects: Project[];
  tickets: SupportTicket[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(217 91% 60%)', 'hsl(45 93% 47%)', 'hsl(160 60% 45%)', 'hsl(340 75% 55%)'];

export function AdminDashboardStats({ users, projects, tickets }: AdminDashboardStatsProps) {
  // Role distribution data
  const roleDistribution = useMemo(() => {
    const superAdmins = users.filter(u => u.roles.some(r => r.role === 'super_admin')).length;
    const admins = users.filter(u => u.roles.some(r => r.role === 'admin') && !u.roles.some(r => r.role === 'super_admin')).length;
    const regularUsers = users.length - superAdmins - admins;
    
    return [
      { name: 'Utilisateurs', value: regularUsers, fill: 'hsl(var(--muted-foreground))' },
      { name: 'Admins', value: admins, fill: 'hsl(217 91% 60%)' },
      { name: 'Super Admins', value: superAdmins, fill: 'hsl(45 93% 47%)' },
    ].filter(item => item.value > 0);
  }, [users]);

  // Premium vs Free distribution
  const premiumDistribution = useMemo(() => {
    const premium = users.filter(u => u.is_premium).length;
    const free = users.length - premium;
    
    return [
      { name: 'Gratuit', value: free, fill: 'hsl(var(--muted-foreground))' },
      { name: 'Premium', value: premium, fill: 'hsl(45 93% 47%)' },
    ].filter(item => item.value > 0);
  }, [users]);

  // Ticket status distribution
  const ticketStats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    
    return [
      { name: 'Ouverts', value: open, fill: 'hsl(0 84% 60%)' },
      { name: 'En cours', value: inProgress, fill: 'hsl(45 93% 47%)' },
      { name: 'Résolus', value: resolved, fill: 'hsl(160 60% 45%)' },
      { name: 'Fermés', value: closed, fill: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  }, [tickets]);

  // User registration over time (last 7 days)
  const userRegistrationTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const count = users.filter(u => u.created_at.split('T')[0] === day).length;
      const dayLabel = new Date(day).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      return { date: dayLabel, inscriptions: count };
    });
  }, [users]);

  // Project activity (last 7 days)
  const projectActivityTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const created = projects.filter(p => p.created_at.split('T')[0] === day).length;
      const updated = projects.filter(p => p.updated_at.split('T')[0] === day).length;
      const dayLabel = new Date(day).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      return { date: dayLabel, créés: created, modifiés: updated };
    });
  }, [projects]);

  // Top projects by collaborators
  const topProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => (b.collaborator_count || 0) - (a.collaborator_count || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        collaborateurs: p.collaborator_count || 0
      }));
  }, [projects]);

  // Summary stats
  const stats = useMemo(() => ({
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.is_premium).length,
    superAdmins: users.filter(u => u.roles.some(r => r.role === 'super_admin')).length,
    admins: users.filter(u => u.roles.some(r => r.role === 'admin')).length,
    totalProjects: projects.length,
    activeTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    newUsersToday: users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length,
    newProjectsToday: projects.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length,
  }), [users, projects, tickets]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  {stats.newUsersToday > 0 && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{stats.newUsersToday} aujourd'hui
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.premiumUsers}</p>
                  <p className="text-sm text-muted-foreground">Premium</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}% du total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalProjects}</p>
                  <p className="text-sm text-muted-foreground">Projets</p>
                  {stats.newProjectsToday > 0 && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{stats.newProjectsToday} aujourd'hui
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.activeTickets}</p>
                  <p className="text-sm text-muted-foreground">Tickets actifs</p>
                  <p className="text-xs text-muted-foreground">{tickets.length} au total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User Registration Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Inscriptions (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userRegistrationTrend}>
                  <defs>
                    <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inscriptions" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorInscriptions)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Distribution des rôles
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              {roleDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Utilisateurs Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              {premiumDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={premiumDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {premiumDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-green-500" />
                Activité des projets (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectActivityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="créés" fill="hsl(160 60% 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="modifiés" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Projects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Top 5 Projets (par collaborateurs)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              {topProjects.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProjects} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="collaborateurs" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucun projet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Ticket Stats (if tickets exist) */}
      {tickets.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ticket className="w-4 h-4 text-orange-500" />
                Statut des tickets de support
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {ticketStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}