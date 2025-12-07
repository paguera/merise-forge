import { Header } from '@/components/Header';
import { MCDSidebar } from '@/components/sidebar/MCDSidebar';
import { MLDSidebar } from '@/components/sidebar/MLDSidebar';
import { MPDSidebar } from '@/components/sidebar/MPDSidebar';
import { MCDCanvas } from '@/components/canvas/MCDCanvas';
import { MLDCanvas } from '@/components/canvas/MLDCanvas';
import { MPDCanvas } from '@/components/canvas/MPDCanvas';
import { useMeriseStore } from '@/hooks/useMeriseStore';

const Index = () => {
  const { viewMode } = useMeriseStore();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'MCD' && <MCDSidebar />}
        {viewMode === 'MLD' && <MLDSidebar />}
        {viewMode === 'MPD' && <MPDSidebar />}
        
        {viewMode === 'MCD' && <MCDCanvas />}
        {viewMode === 'MLD' && <MLDCanvas />}
        {viewMode === 'MPD' && <MPDCanvas />}
      </div>
    </div>
  );
};

export default Index;
