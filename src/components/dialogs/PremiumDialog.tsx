import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, Archive, Users, History, Zap, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId?: string;
}

export function PremiumDialog({ open, onOpenChange, onSuccess, userId }: PremiumDialogProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Passez à Premium
            <Sparkles className="w-5 h-5 text-amber-500" />
          </DialogTitle>
          <DialogDescription>
            Débloquez toutes les fonctionnalités de Ressou Merize
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Features list */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Fonctionnalités Premium
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Archive className="w-4 h-4 text-primary" />
                Export ZIP (MCD, MLD, MPD + SQL)
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                Collaboration temps réel illimitée
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <History className="w-4 h-4 text-primary" />
                Historique complet des modifications
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-foreground">
              9,99€<span className="text-lg font-normal text-muted-foreground">/mois</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ou 99€/an (économisez 17%)
            </p>
          </div>

          {/* Promo code section */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary" />
              <Label htmlFor="promo-code" className="text-sm font-medium">
                Vous avez un code promo ?
              </Label>
            </div>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                placeholder="PROMO2024"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button 
                variant="secondary" 
                onClick={handleApplyPromoCode}
                disabled={loading || !promoCode.trim()}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Plus tard
          </Button>
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={() => {
              toast.info('Intégration Stripe à venir...');
            }}
          >
            <Crown className="w-4 h-4 mr-2" />
            Souscrire maintenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
