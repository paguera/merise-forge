import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MCDSidebar } from '@/components/sidebar/MCDSidebar';
import { MLDSidebar } from '@/components/sidebar/MLDSidebar';
import { MPDSidebar } from '@/components/sidebar/MPDSidebar';
import { MCDCanvas } from '@/components/canvas/MCDCanvas';
import { MLDCanvas } from '@/components/canvas/MLDCanvas';
import { MPDCanvas } from '@/components/canvas/MPDCanvas';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';

const Index = () => {
  const { viewMode } = useMeriseStore();
  const zoom = useCanvasZoom();

  const zoomControlProps = {
    scale: zoom.scale,
    onZoomIn: zoom.zoomIn,
    onZoomOut: zoom.zoomOut,
    onReset: zoom.resetZoom,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden select-none">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'MCD' && <MCDSidebar zoomControls={zoomControlProps} />}
        {viewMode === 'MLD' && <MLDSidebar zoomControls={zoomControlProps} />}
        {viewMode === 'MPD' && <MPDSidebar zoomControls={zoomControlProps} />}

        <div className="relative flex-1">
          {viewMode === 'MCD' && <MCDCanvas zoom={zoom} />}
          {viewMode === 'MLD' && <MLDCanvas zoom={zoom} />}
          {viewMode === 'MPD' && <MPDCanvas zoom={zoom} />}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
