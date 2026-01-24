import { useState } from 'react';
import { Settings, Save, Image, Type, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { SiteSetting } from '@/hooks/useAdminDashboard';

interface SiteSettingsManagerProps {
  settings: SiteSetting[];
  onUpdate: (key: string, value: string | null) => Promise<{ error: Error | null }>;
}

export function SiteSettingsManager({ settings, onUpdate }: SiteSettingsManagerProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const getSetting = (key: string) => {
    if (localSettings[key] !== undefined) return localSettings[key];
    return settings.find(s => s.key === key)?.value || null;
  };

  const updateLocal = (key: string, value: string | null) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    const { error } = await onUpdate(key, localSettings[key] ?? getSetting(key));
    setSaving(null);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Paramètre sauvegardé');
      setLocalSettings(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const hasChanges = (key: string) => {
    return localSettings[key] !== undefined && 
           localSettings[key] !== settings.find(s => s.key === key)?.value;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo du site
          </CardTitle>
          <CardDescription>
            Personnalisez le logo affiché sur le site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL du logo</Label>
            <Input
              placeholder="https://exemple.com/logo.png"
              value={getSetting('logo_url') || ''}
              onChange={(e) => updateLocal('logo_url', e.target.value || null)}
            />
          </div>
          {getSetting('logo_url') && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Aperçu :</p>
              <img 
                src={getSetting('logo_url') || ''} 
                alt="Logo preview" 
                className="max-h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <Button 
            onClick={() => handleSave('logo_url')} 
            disabled={!hasChanges('logo_url') || saving === 'logo_url'}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </CardContent>
      </Card>

      {/* Site Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Nom du site
          </CardTitle>
          <CardDescription>
            Modifiez le nom affiché sur le site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du site</Label>
            <Input
              placeholder="Ressou Merise"
              value={getSetting('site_name') || ''}
              onChange={(e) => updateLocal('site_name', e.target.value)}
            />
          </div>
          <Button 
            onClick={() => handleSave('site_name')} 
            disabled={!hasChanges('site_name') || saving === 'site_name'}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </CardContent>
      </Card>

      {/* Announcement Banner */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Bannière d'annonce
          </CardTitle>
          <CardDescription>
            Affichez une bannière en haut du site pour les annonces importantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activer la bannière</Label>
            <Switch
              checked={getSetting('announcement_active') === 'true'}
              onCheckedChange={(v) => {
                updateLocal('announcement_active', v ? 'true' : 'false');
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Texte de l'annonce</Label>
            <Textarea
              placeholder="Nouvelle fonctionnalité disponible ! Découvrez..."
              value={getSetting('announcement_text') || ''}
              onChange={(e) => updateLocal('announcement_text', e.target.value || null)}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleSave('announcement_active')} 
              disabled={!hasChanges('announcement_active') || saving === 'announcement_active'}
              variant="outline"
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder statut
            </Button>
            <Button 
              onClick={() => handleSave('announcement_text')} 
              disabled={!hasChanges('announcement_text') || saving === 'announcement_text'}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder texte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
