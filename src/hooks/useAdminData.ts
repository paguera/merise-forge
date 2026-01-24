import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, UserRole } from './useAuth';

interface AdminUser extends UserProfile {
  roles: UserRole[];
}

interface PromoCode {
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

interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  user_email?: string;
}

export function useAdminData() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePremium = async (userId: string, isPremium: boolean, days: number = 30) => {
    const premiumUntil = isPremium 
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: isPremium, 
        premium_until: premiumUntil 
      })
      .eq('user_id', userId);

    if (!error) {
      await fetchData();
    }
    return { error };
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    // First delete existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });

    if (!error) {
      await fetchData();
    }
    return { error };
  };

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

    if (!error) {
      await fetchData();
    }
    return { error };
  };

  const togglePromoCode = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', id);

    if (!error) {
      await fetchData();
    }
    return { error };
  };

  const deletePromoCode = async (id: string) => {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchData();
    }
    return { error };
  };

  return {
    users,
    promoCodes,
    subscriptions,
    loading,
    refresh: fetchData,
    togglePremium,
    updateUserRole,
    createPromoCode,
    togglePromoCode,
    deletePromoCode,
  };
}
