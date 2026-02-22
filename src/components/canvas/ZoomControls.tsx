import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  inline?: boolean;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset, inline }: ZoomControlsProps) {
  return (
    <div className={
      inline
        ? "flex items-center justify-center gap-2 bg-card/90 rounded-lg p-2"
        : "zoom-controls absolute bottom-4 right-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg z-50"
    }>
      <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-sm font-medium text-foreground min-w-[50px] text-center">
        {Math.round(scale * 100)}%
      </span>
      <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8">
        <Maximize className="w-4 h-4" />
      </Button>
    </div>
  );
}
