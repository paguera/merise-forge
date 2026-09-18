import { useState } from 'react';

export interface SiteSetting {
  key: string;
  value: string | null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string | null>>(() => {
    try {
      const saved = localStorage.getItem('merise-site-settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore JSON parse error
    }
    return {
      logo_url: null,
      logo_size: '48',
      site_name: 'MERISE FORGE',
      announcement_text: null,
      announcement_active: 'false',
    };
  });

  const fetchSettings = () => {
    try {
      const saved = localStorage.getItem('merise-site-settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch {
      // ignore JSON parse error
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
    loading: false,
    getSetting,
    hasLogo,
    getLogoSize,
    hasSiteName,
    isAnnouncementActive,
    refresh: fetchSettings,
  };
}
