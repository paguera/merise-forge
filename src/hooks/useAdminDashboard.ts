import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, UserRole } from './useAuth';

export interface AdminUser extends UserProfile {
  roles: UserRole[];
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  gives_premium: boolean;
  premium_days: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  user_email?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  collaborator_count: number;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_type: string;
  target_id: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export function useAdminDashboard(enabled: boolean = true, isSuperAdmin: boolean = false) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      // Combine profiles with roles
      if (profiles && roles) {
        const usersWithRoles = profiles.map(profile => ({
          ...profile,
          roles: roles.filter(r => r.user_id === profile.user_id),
        }));
        setUsers(usersWithRoles as AdminUser[]);
      }

      // Fetch projects with stats
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsData) {
        setProjects(projectsData as Project[]);
      }

      // Fetch support tickets
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsData && profiles) {
        const ticketsWithEmails = ticketsData.map(ticket => ({
          ...ticket,
          user_email: profiles.find(p => p.user_id === ticket.user_id)?.email,
        }));
        setTickets(ticketsWithEmails as SupportTicket[]);
      }

      // Super admin only data
      if (isSuperAdmin) {
        // Fetch promo codes
        const { data: promos } = await supabase
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (promos) {
          setPromoCodes(promos as PromoCode[]);
        }

        // Fetch subscriptions with user emails
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (subs && profiles) {
          const subsWithEmails = subs.map(sub => ({
            ...sub,
            user_email: profiles.find(p => p.user_id === sub.user_id)?.email,
          }));
          setSubscriptions(subsWithEmails as Subscription[]);
        }

        // Fetch notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (notifs) {
          setNotifications(notifs as Notification[]);
        }

        // Fetch site settings
        const { data: settings } = await supabase
          .from('site_settings')
          .select('*');

        if (settings) {
          setSiteSettings(settings as SiteSetting[]);
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // User management
  const togglePremium = async (userId: string, isPremium: boolean, days: number = 30) => {
    const premiumUntil = isPremium 
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: isPremium, 
        premium_until: premiumUntil 
      })
      .eq('user_id', userId);

    if (profileError) {
      return { error: profileError };
    }

    // Create or update subscription record
    if (isPremium) {
      // Check if subscription exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            expires_at: premiumUntil,
          })
          .eq('id', existingSub.id);
      } else {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_name: 'Premium',
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: premiumUntil,
          });
      }
    } else {
      // Deactivate subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId);
    }

    await fetchData();
    return { error: null };
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });

    if (!error) await fetchData();
    return { error };
  };

  // Promo code management (Super Admin only)
  const createPromoCode = async (data: {
    code: string;
    discount_percent: number;
    gives_premium: boolean;
    premium_days?: number;
    max_uses?: number;
    expires_at?: string;
  }) => {
    const { error } = await supabase
      .from('promo_codes')
      .insert({
        code: data.code.toUpperCase(),
        discount_percent: data.discount_percent,
        gives_premium: data.gives_premium,
        premium_days: data.premium_days || 30,
        max_uses: data.max_uses || null,
        expires_at: data.expires_at || null,
      });

    if (!error) await fetchData();
    return { error };
  };

  const togglePromoCode = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', id);

    if (!error) await fetchData();
    return { error };
  };

  const deletePromoCode = async (id: string) => {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (!error) await fetchData();
    return { error };
  };

  // Notification management (Super Admin only)
  const createNotification = async (data: {
    title: string;
    message: string;
    type: string;
    target_type: string;
    target_id?: string;
    expires_at?: string;
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('notifications')
      .insert({
        ...data,
        created_by: userData.user?.id,
      });

    if (!error) await fetchData();
    return { error };
  };

  const toggleNotification = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: isActive })
      .eq('id', id);

    if (!error) await fetchData();
    return { error };
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) await fetchData();
    return { error };
  };

  // Site settings (Super Admin only)
  const updateSiteSetting = async (key: string, value: string | null) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('site_settings')
      .update({ 
        value, 
        updated_at: new Date().toISOString(),
        updated_by: userData.user?.id 
      })
      .eq('key', key);

    if (!error) await fetchData();
    return { error };
  };

  // Ticket management
  const updateTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) await fetchData();
    return { error };
  };

  const assignTicket = async (id: string, assignedTo: string | null) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) await fetchData();
    return { error };
  };

  // Send message to project chat (Super Admin)
  const sendGlobalMessage = async (projectId: string, message: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        project_id: projectId,
        username: '🛡️ Super Admin',
        color: '#f59e0b',
        message,
      });

    return { error };
  };

  return {
    users,
    promoCodes,
    subscriptions,
    projects,
    tickets,
    notifications,
    siteSettings,
    loading,
    refresh: fetchData,
    // User management
    togglePremium,
    updateUserRole,
    // Promo codes (Super Admin)
    createPromoCode,
    togglePromoCode,
    deletePromoCode,
    // Notifications (Super Admin)
    createNotification,
    toggleNotification,
    deleteNotification,
    // Site settings (Super Admin)
    updateSiteSetting,
    // Tickets
    updateTicketStatus,
    assignTicket,
    // Messaging (Super Admin)
    sendGlobalMessage,
  };
}
