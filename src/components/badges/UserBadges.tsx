import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  ShieldCheck, 
  Crown, 
  Star, 
  Zap, 
  Award,
  Trophy,
  Flame,
  Heart,
  Rocket,
  Target,
  Medal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeType = 
  | 'super_admin'
  | 'admin'
  | 'premium'
  | 'creator'
  | 'active_contributor'
  | 'early_adopter'
  | 'power_user'
  | 'collaborator'
  | 'mentor'
  | 'achiever';

interface BadgeConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

const BADGE_CONFIG: Record<BadgeType, BadgeConfig> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Administrateur principal avec tous les droits',
    icon: ShieldCheck,
    className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-amber-500/30 shadow-lg'
  },
  admin: {
    label: 'Admin',
    description: 'Administrateur du projet',
    icon: Shield,
    className: 'admin-badge-gold'
  },
  premium: {
    label: 'Premium',
    description: 'Membre Premium avec accès à toutes les fonctionnalités',
    icon: Crown,
    className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-purple-500/30 shadow-lg'
  },
  creator: {
    label: 'Créateur',
    description: 'Créateur du projet',
    icon: Star,
    className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400'
  },
  active_contributor: {
    label: 'Contributeur Actif',
    description: 'Plus de 50 modifications sur les projets',
    icon: Zap,
    className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400'
  },
  early_adopter: {
    label: 'Early Adopter',
    description: 'Parmi les premiers utilisateurs de la plateforme',
    icon: Rocket,
    className: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-400'
  },
  power_user: {
    label: 'Power User',
    description: 'Utilisateur expérimenté avec plus de 10 projets',
    icon: Flame,
    className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-400'
  },
  collaborator: {
    label: 'Collaborateur',
    description: 'A collaboré sur plus de 5 projets',
    icon: Heart,
    className: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400'
  },
  mentor: {
    label: 'Mentor',
    description: 'A aidé de nombreux utilisateurs',
    icon: Award,
    className: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-teal-400'
  },
  achiever: {
    label: 'Achiever',
    description: 'A débloqué toutes les réussites',
    icon: Trophy,
    className: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400'
  }
};

interface UserBadgesProps {
  badges: BadgeType[];
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  maxVisible?: number;
  className?: string;
}

export function UserBadges({ 
  badges, 
  size = 'md', 
  showTooltip = true,
  maxVisible = 3,
  className 
}: UserBadgesProps) {
  const visibleBadges = badges.slice(0, maxVisible);
  const hiddenCount = badges.length - maxVisible;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visibleBadges.map((badgeType) => {
        const config = BADGE_CONFIG[badgeType];
        if (!config) return null;

        const Icon = config.icon;
        const badgeElement = (
          <Badge
            key={badgeType}
            className={cn(
              'font-semibold inline-flex items-center gap-1 animate-shimmer',
              sizeClasses[size],
              config.className
            )}
          >
            <Icon className={iconSizes[size]} />
            {size !== 'sm' && config.label}
          </Badge>
        );

        if (showTooltip) {
          return (
            <Tooltip key={badgeType}>
              <TooltipTrigger asChild>
                {badgeElement}
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return badgeElement;
      })}

      {hiddenCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={cn(sizeClasses[size], 'cursor-help')}>
              +{hiddenCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{hiddenCount} autres badges</p>
            <div className="mt-1 space-y-1">
              {badges.slice(maxVisible).map(b => (
                <p key={b} className="text-xs">{BADGE_CONFIG[b]?.label}</p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// Helper function to determine user badges
export function getUserBadges(params: {
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  isPremium?: boolean;
  isCreator?: boolean;
  modificationCount?: number;
  projectCount?: number;
  collaborationCount?: number;
  createdAt?: string;
}): BadgeType[] {
  const badges: BadgeType[] = [];

  // Role badges
  if (params.isSuperAdmin) badges.push('super_admin');
  else if (params.isAdmin) badges.push('admin');
  
  if (params.isPremium) badges.push('premium');
  if (params.isCreator) badges.push('creator');

  // Activity badges
  if (params.modificationCount && params.modificationCount >= 50) {
    badges.push('active_contributor');
  }

  if (params.projectCount && params.projectCount >= 10) {
    badges.push('power_user');
  }

  if (params.collaborationCount && params.collaborationCount >= 5) {
    badges.push('collaborator');
  }

  // Early adopter - if account created before a certain date
  if (params.createdAt) {
    const createdDate = new Date(params.createdAt);
    const earlyAdopterCutoff = new Date('2025-06-01');
    if (createdDate < earlyAdopterCutoff) {
      badges.push('early_adopter');
    }
  }

  return badges;
}

// Single badge component for simple use cases
interface SingleBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SingleBadge({ type, size = 'md', showLabel = true }: SingleBadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn(
            'font-semibold inline-flex items-center gap-1',
            sizeClasses[size],
            config.className
          )}
        >
          <Icon className={iconSizes[size]} />
          {showLabel && config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
