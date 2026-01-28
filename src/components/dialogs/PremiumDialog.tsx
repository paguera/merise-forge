import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Sparkles, Archive, Users, History, Zap, Gift, Check, Star, Rocket, Shield, Infinity } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId?: string;
}

const FEATURES = [
  {
    icon: Archive,
    title: 'Export ZIP Complet',
    description: 'MCD, MLD, MPD en images + SQL',
    highlight: true
  },
  {
    icon: Users,
    title: 'Collaboration Illimitée',
    description: 'Invitez autant de collaborateurs que vous voulez'
  },
  {
    icon: History,
    title: 'Historique Complet',
    description: 'Retrouvez toutes vos modifications'
  },
  {
    icon: Infinity,
    title: 'Projets Illimités',
    description: 'Créez et sauvegardez sans limite'
  },
  {
    icon: Shield,
    title: 'Support Prioritaire',
    description: 'Assistance rapide et dédiée'
  },
  {
    icon: Rocket,
    title: 'Accès Anticipé',
    description: 'Testez les nouvelles fonctionnalités en avant-première'
  }
];

export function PremiumDialog({ open, onOpenChange, onSuccess, userId }: PremiumDialogProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim() || !userId) {
      toast.error('Veuillez entrer un code promo');
      return;
    }

    setLoading(true);
    try {
      // Check if promo code exists and is valid
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promoError || !promo) {
        toast.error('Code promo invalide ou expiré');
        return;
      }

      // Check if already used by this user
      const { data: existingUse } = await supabase
        .from('promo_code_uses')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('user_id', userId)
        .single();

      if (existingUse) {
        toast.error('Vous avez déjà utilisé ce code promo');
        return;
      }

      // Check max uses
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        toast.error('Ce code promo a atteint son nombre maximum d\'utilisations');
        return;
      }

      // Check expiration
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        toast.error('Ce code promo a expiré');
        return;
      }

      // Apply promo code
      if (promo.gives_premium) {
        const premiumDays = promo.premium_days || 30;
        const premiumUntil = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from('profiles')
          .update({ 
            is_premium: true, 
            premium_until: premiumUntil 
          })
          .eq('user_id', userId);
      }

      // Record usage
      await supabase
        .from('promo_code_uses')
        .insert({
          promo_code_id: promo.id,
          user_id: userId,
        });

      // Increment usage count
      await supabase
        .from('promo_codes')
        .update({ current_uses: promo.current_uses + 1 })
        .eq('id', promo.id);

      toast.success('🎉 Code promo appliqué ! Vous êtes maintenant Premium !');
      setPromoCode('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Erreur lors de l\'application du code promo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader className="text-center pb-2">
          {/* Premium Icon */}
          <div className="relative mx-auto mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30 animate-pulse">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -bottom-1 -left-1 animate-bounce delay-100" />
          </div>
          
          <DialogTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            Passez à Premium
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Débloquez tout le potentiel de Ressou Merise
          </DialogDescription>
        </DialogHeader>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {FEATURES.map((feature, idx) => (
            <Card 
              key={idx} 
              className={cn(
                "neu-card border-2 transition-all hover:scale-[1.02]",
                feature.highlight 
                  ? "border-amber-500/50 bg-amber-500/5" 
                  : "border-border"
              )}
            >
              <CardContent className="p-3 flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  feature.highlight 
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" 
                    : "bg-primary/10 text-primary"
                )}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1">
                    {feature.title}
                    {feature.highlight && <Star className="w-3 h-3 text-amber-500" />}
                  </h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 gap-4 my-4">
          {/* Monthly */}
          <Card className="neu-card border-2 border-border hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Badge variant="secondary" className="mb-2">Mensuel</Badge>
              <div className="text-2xl font-bold text-foreground">
                9,99€
              </div>
              <p className="text-xs text-muted-foreground">/mois</p>
            </CardContent>
          </Card>
          
          {/* Annual */}
          <Card className="neu-card border-2 border-amber-500 bg-amber-500/5 cursor-pointer relative overflow-hidden">
            <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5">
              -17%
            </Badge>
            <CardContent className="p-4 text-center">
              <Badge className="mb-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">Annuel</Badge>
              <div className="text-2xl font-bold text-foreground">
                99€
              </div>
              <p className="text-xs text-muted-foreground">/an</p>
            </CardContent>
          </Card>
        </div>

        {/* Promo Code Section */}
        <div className="border-t border-border pt-4">
          {!showPromo ? (
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setShowPromo(true)}
            >
              <Gift className="w-4 h-4 mr-2" />
              J'ai un code promo
            </Button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="promo-code" className="text-sm font-medium flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Code promo
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promo-code"
                  placeholder="PROMO2024"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="uppercase neu-input"
                />
                <Button 
                  variant="secondary" 
                  onClick={handleApplyPromoCode}
                  disabled={loading || !promoCode.trim()}
                  className="shrink-0"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto"
          >
            Plus tard
          </Button>
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30"
            onClick={() => {
              toast.info('Intégration Stripe à venir...');
            }}
          >
            <Crown className="w-4 h-4 mr-2" />
            Devenir Premium
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>

        {/* Trust Badge */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Paiement sécurisé • Annulation à tout moment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
