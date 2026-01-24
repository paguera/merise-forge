import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ExternalLink, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { SiteSetting } from '@/hooks/useAdminDashboard';

interface FooterLink {
  label: string;
  url: string;
}

interface SocialLink {
  type: string;
  url: string;
}

interface FooterSettingsManagerProps {
  settings: SiteSetting[];
  onUpdate: (key: string, value: string | null) => Promise<{ error: Error | null }>;
}

const socialTypes = [
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'email', label: 'Email', icon: Mail },
];

export function FooterSettingsManager({ settings, onUpdate }: FooterSettingsManagerProps) {
  const [footerText, setFooterText] = useState('');
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const textSetting = settings.find((s) => s.key === 'footer_text');
    const linksSetting = settings.find((s) => s.key === 'footer_links');
    const socialSetting = settings.find((s) => s.key === 'footer_social');

    if (textSetting?.value) setFooterText(textSetting.value);
    if (linksSetting?.value) {
      try {
        setFooterLinks(JSON.parse(linksSetting.value));
      } catch (e) {
        setFooterLinks([]);
      }
    }
    if (socialSetting?.value) {
      try {
        setSocialLinks(JSON.parse(socialSetting.value));
      } catch (e) {
        setSocialLinks([]);
      }
    }
  }, [settings]);

  const handleSaveText = async () => {
    setSaving('text');
    const { error } = await onUpdate('footer_text', footerText);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Texte du footer mis à jour');
    }
    setSaving(null);
  };

  const handleSaveLinks = async () => {
    setSaving('links');
    const { error } = await onUpdate('footer_links', JSON.stringify(footerLinks));
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Liens mis à jour');
    }
    setSaving(null);
  };

  const handleSaveSocial = async () => {
    setSaving('social');
    const { error } = await onUpdate('footer_social', JSON.stringify(socialLinks));
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Réseaux sociaux mis à jour');
    }
    setSaving(null);
  };

  const addLink = () => {
    setFooterLinks([...footerLinks, { label: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setFooterLinks(footerLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof FooterLink, value: string) => {
    const updated = [...footerLinks];
    updated[index] = { ...updated[index], [field]: value };
    setFooterLinks(updated);
  };

  const addSocial = () => {
    setSocialLinks([...socialLinks, { type: 'github', url: '' }]);
  };

  const removeSocial = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocial = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  return (
    <div className="space-y-6">
      {/* Footer Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Texte du Footer</CardTitle>
          <CardDescription>Copyright et mention légale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texte</Label>
            <Input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="MERISE © 2024 - Tous droits réservés"
            />
          </div>
          <Button onClick={handleSaveText} disabled={saving === 'text'}>
            <Save className="w-4 h-4 mr-2" />
            {saving === 'text' ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Liens du Footer
          </CardTitle>
          <CardDescription>Liens de navigation en bas de page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {footerLinks.map((link, index) => (
            <div key={index} className="flex gap-3 items-center">
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) => updateLink(index, 'label', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateLink(index, 'url', e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLink(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={addLink}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un lien
            </Button>
            <Button onClick={handleSaveLinks} disabled={saving === 'links'}>
              <Save className="w-4 h-4 mr-2" />
              {saving === 'links' ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Réseaux Sociaux</CardTitle>
          <CardDescription>Liens vers vos réseaux sociaux</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialLinks.map((social, index) => (
            <div key={index} className="flex gap-3 items-center">
              <Select
                value={social.type}
                onValueChange={(v) => updateSocial(index, 'type', v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {socialTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="URL"
                value={social.url}
                onChange={(e) => updateSocial(index, 'url', e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSocial(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={addSocial}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un réseau
            </Button>
            <Button onClick={handleSaveSocial} disabled={saving === 'social'}>
              <Save className="w-4 h-4 mr-2" />
              {saving === 'social' ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
