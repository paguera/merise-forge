import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSetting {
  key: string;
  value: string | null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string | null>>({
    logo_url: null,
    logo_size: '48',
    site_name: 'Ressou Merise',
    announcement_text: null,
    announcement_active: 'false',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value');

      if (data) {
        const settingsMap: Record<string, string | null> = {};
        data.forEach((setting) => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string): string | null => {
    return settings[key] ?? null;
  };

  const hasLogo = (): boolean => {
    const logoUrl = settings.logo_url;
    return !!logoUrl && logoUrl.trim() !== '';
  };

  const getLogoSize = (): number => {
    return parseInt(settings.logo_size || '48', 10);
  };

  const hasSiteName = (): boolean => {
    const siteName = settings.site_name;
    return !!siteName && siteName.trim() !== '';
  };

  const isAnnouncementActive = (): boolean => {
    return settings.announcement_active === 'true' && !!settings.announcement_text;
  };

  return {
    settings,
    loading,
    getSetting,
    hasLogo,
    getLogoSize,
    hasSiteName,
    isAnnouncementActive,
    refresh: fetchSettings,
  };
}
