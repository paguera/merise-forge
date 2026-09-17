import { ZoomIn, ZoomOut, Maximize, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { toast } from 'sonner';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  inline?: boolean;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset, inline }: ZoomControlsProps) {
  const { autoLayout, viewMode } = useMeriseStore();

  const handleAutoLayout = () => {
    autoLayout();
    toast.success('✨ Schéma réorganisé proprement !');
  };

  return (
    <TooltipProvider>
      <div
        className={
          inline
            ? 'flex items-center justify-center gap-1.5 bg-card/90 rounded-lg p-1.5'
            : 'zoom-controls absolute bottom-4 right-4 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border/70 rounded-lg p-1.5 shadow-lg z-50'
        }
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAutoLayout}
              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/20 transition-all font-semibold"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="font-medium">Ranger / Aligner le schéma (1 clic)</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-[1px] h-4 bg-border/60 mx-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Zoom arrière</TooltipContent>
        </Tooltip>

        <span className="text-xs font-mono font-medium text-foreground min-w-[45px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Zoom avant</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8">
              <Maximize className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Réinitialiser le zoom</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

