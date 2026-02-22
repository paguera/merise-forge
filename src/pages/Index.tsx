import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MCDSidebar } from '@/components/sidebar/MCDSidebar';
import { MLDSidebar } from '@/components/sidebar/MLDSidebar';
import { MPDSidebar } from '@/components/sidebar/MPDSidebar';
import { MCDCanvas } from '@/components/canvas/MCDCanvas';
import { MLDCanvas } from '@/components/canvas/MLDCanvas';
import { MPDCanvas } from '@/components/canvas/MPDCanvas';
import { CollaboratorChat } from '@/components/chat/CollaboratorChat';
import { CanvasProtectionOverlay } from '@/components/canvas/CanvasProtectionOverlay';
import { PremiumDialog } from '@/components/dialogs/PremiumDialog';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useRealtimeProject } from '@/hooks/useRealtimeProject';
import { useAuth } from '@/hooks/useAuth';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';

const Index = () => {
  const { viewMode, isReadOnly } = useMeriseStore();
  const realtime = useRealtimeProject();
  const { user, isPremium, refreshProfile } = useAuth();
  const { users, updateCursor, connected, projectId, username, myColor } = realtime;
  const [premiumOpen, setPremiumOpen] = useState(false);
  const zoom = useCanvasZoom();

  const handleCursorMove = connected ? updateCursor : undefined;

  const zoomControlProps = {
    scale: zoom.scale,
    onZoomIn: zoom.zoomIn,
    onZoomOut: zoom.zoomOut,
    onReset: zoom.resetZoom,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Header realtime={realtime} />
      
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'MCD' && <MCDSidebar zoomControls={zoomControlProps} />}
        {viewMode === 'MLD' && <MLDSidebar zoomControls={zoomControlProps} />}
        {viewMode === 'MPD' && <MPDSidebar zoomControls={zoomControlProps} />}
        
        <div className="relative flex-1">
          {viewMode === 'MCD' && <MCDCanvas users={users} onCursorMove={handleCursorMove} zoom={zoom} />}
          {viewMode === 'MLD' && <MLDCanvas users={users} onCursorMove={handleCursorMove} zoom={zoom} />}
          {viewMode === 'MPD' && <MPDCanvas users={users} onCursorMove={handleCursorMove} zoom={zoom} />}
          
          <CanvasProtectionOverlay 
            isPremium={!!isPremium} 
            isAuthenticated={!!user}
            onUpgrade={() => setPremiumOpen(true)} 
          />
        </div>
      </div>

      <CollaboratorChat 
        projectId={projectId} 
        username={username} 
        userColor={myColor}
        connected={connected}
        isReadOnly={isReadOnly}
      />

      <PremiumDialog 
        open={premiumOpen} 
        onOpenChange={setPremiumOpen} 
        userId={user?.id}
        onSuccess={refreshProfile}
      />

      <Footer />
    </div>
  );
};

export default Index;
