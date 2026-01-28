import { useState, useRef, ChangeEvent } from 'react';
import { Save, Image, Type, Megaphone, Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { SiteSetting } from '@/hooks/useAdminDashboard';

interface SiteSettingsManagerProps {
  settings: SiteSetting[];
  onUpdate: (key: string, value: string | null) => Promise<{ error: Error | null }>;
}

export function SiteSettingsManager({ settings, onUpdate }: SiteSettingsManagerProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `site/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      updateLocal('logo_url', data.publicUrl);
      toast.success('Logo téléchargé');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleClearLogo = () => {
    updateLocal('logo_url', '');
  };

  const logoSize = parseInt(getSetting('logo_size') || '48', 10);

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
            Personnalisez le logo affiché sur le site. Laissez vide pour masquer le logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL du logo ou téléchargement</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://exemple.com/logo.png"
                value={getSetting('logo_url') || ''}
                onChange={(e) => updateLocal('logo_url', e.target.value || null)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleClearLogo}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Logo Size Slider */}
          <div className="space-y-2">
            <Label>Taille du logo: {logoSize}px</Label>
            <Slider
              value={[logoSize]}
              onValueChange={([value]) => updateLocal('logo_size', String(value))}
              min={24}
              max={96}
              step={4}
              className="w-full"
            />
          </div>

          {getSetting('logo_url') && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Aperçu :</p>
              <img 
                src={getSetting('logo_url') || ''} 
                alt="Logo preview" 
                style={{ height: `${logoSize}px` }}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {!getSetting('logo_url') && (
            <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
              <p className="text-sm text-muted-foreground text-center">
                Aucun logo défini - Le logo sera masqué
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => handleSave('logo_url')} 
              disabled={!hasChanges('logo_url') || saving === 'logo_url'}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder URL
            </Button>
            <Button 
              onClick={() => handleSave('logo_size')} 
              disabled={!hasChanges('logo_size') || saving === 'logo_size'}
              variant="outline"
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder taille
            </Button>
          </div>
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
