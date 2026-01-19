import { Header } from '@/components/Header';
import { MCDSidebar } from '@/components/sidebar/MCDSidebar';
import { MLDSidebar } from '@/components/sidebar/MLDSidebar';
import { MPDSidebar } from '@/components/sidebar/MPDSidebar';
import { MCDCanvas } from '@/components/canvas/MCDCanvas';
import { MLDCanvas } from '@/components/canvas/MLDCanvas';
import { MPDCanvas } from '@/components/canvas/MPDCanvas';
import { CollaboratorChat } from '@/components/chat/CollaboratorChat';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { useRealtimeProject } from '@/hooks/useRealtimeProject';

const Index = () => {
  const { viewMode } = useMeriseStore();
  const { users, updateCursor, connected, projectId, username, myColor } = useRealtimeProject();

  const handleCursorMove = connected ? updateCursor : undefined;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'MCD' && <MCDSidebar />}
        {viewMode === 'MLD' && <MLDSidebar />}
        {viewMode === 'MPD' && <MPDSidebar />}
        
        {viewMode === 'MCD' && <MCDCanvas users={users} onCursorMove={handleCursorMove} />}
        {viewMode === 'MLD' && <MLDCanvas users={users} onCursorMove={handleCursorMove} />}
        {viewMode === 'MPD' && <MPDCanvas users={users} onCursorMove={handleCursorMove} />}
      </div>

      <CollaboratorChat 
        projectId={projectId} 
        username={username} 
        userColor={myColor}
        connected={connected}
      />
    </div>
  );
};

export default Index;
