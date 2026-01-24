import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.some(r => r.role === 'admin' || r.role === 'super_admin');
  const isSuperAdmin = roles.some(r => r.role === 'super_admin');
  const isPremium = profile?.is_premium || (profile?.premium_until && new Date(profile.premium_until) > new Date());

  const fetchUserData = useCallback(async (userId: string) => {
    // Profile: avoid .single() to prevent 406 when the row doesn't exist yet
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    setProfile(((profileRows?.[0] as UserProfile) ?? null));

    // Roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    setRoles((rolesData as UserRole[]) ?? []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadFromSession = async (sessionUser: User | null) => {
      if (!isMounted) return;

      setUser(sessionUser);

      if (!sessionUser) {
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      // IMPORTANT: keep loading=true until roles are fetched,
      // otherwise pages that depend on isAdmin can redirect too early.
      setLoading(true);
      try {
        await fetchUserData(sessionUser.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadFromSession(session?.user ?? null);
    });

    // Then check current session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadFromSession(session?.user ?? null))
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  return {
    user,
    profile,
    roles,
    loading,
    isAdmin,
    isSuperAdmin,
    isPremium,
    signOut,
    updateProfile,
    refreshProfile,
  };
}
