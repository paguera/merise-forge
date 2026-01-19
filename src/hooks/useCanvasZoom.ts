import { useState, useCallback, useRef, useEffect } from 'react';
import { useMeriseStore } from '@/hooks/useMeriseStore';

export function useCanvasZoom() {
  const isExporting = useMeriseStore((state) => state.isExporting);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  // Store the scale/position before export to restore after
  const preExportState = useRef<{ scale: number; position: { x: number; y: number } } | null>(null);

  // When export starts, save current state and reset to 100% for clean capture
  useEffect(() => {
    if (isExporting && !preExportState.current) {
      preExportState.current = { scale, position };
      // Don't reset scale during export - keep current scale
    } else if (!isExporting && preExportState.current) {
      // Restore after export
      setScale(preExportState.current.scale);
      setPosition(preExportState.current.position);
      preExportState.current = null;
    }
  }, [isExporting]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.1, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.1, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((s) => Math.max(0.5, Math.min(2, s + delta)));
    }
  }, []);

  const startPan = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const movePan = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    scale,
    position,
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    startPan,
    movePan,
    endPan,
  };
}
