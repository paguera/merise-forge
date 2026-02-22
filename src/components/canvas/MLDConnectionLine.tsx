interface MLDConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromWidth: number;
  fromHeight: number;
  toWidth: number;
  toHeight: number;
  relationType: '1-1' | '1-N' | 'N-M';
}

export function MLDConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromWidth,
  fromHeight,
  toWidth,
  toHeight,
  relationType,
}: MLDConnectionLineProps) {
  // Calculate center points
  const fromCenterX = fromX + fromWidth / 2;
  const fromCenterY = fromY + fromHeight / 2;
  const toCenterX = toX + toWidth / 2;
  const toCenterY = toY + toHeight / 2;
  
  // Get edge connection points
  const fromEdge = getEdgePoint(fromX, fromY, fromWidth, fromHeight, toCenterX, toCenterY);
  const toEdge = getEdgePoint(toX, toY, toWidth, toHeight, fromCenterX, fromCenterY);
  
  // Get cardinality positions with perpendicular offset
  const labelFromPos = getCardinalityPosition(fromEdge.x, fromEdge.y, toEdge.x, toEdge.y);
  const labelToPos = getCardinalityPosition(toEdge.x, toEdge.y, fromEdge.x, fromEdge.y);

  const labels = getLabels(relationType);

  // Calculate arrow position and angle for direction indicator
  const midX = (fromEdge.x + toEdge.x) / 2;
  const midY = (fromEdge.y + toEdge.y) / 2;
  const angle = Math.atan2(toEdge.y - fromEdge.y, toEdge.x - fromEdge.x) * (180 / Math.PI);

  return (
    <g>
      {/* Direct connection line with improved styling */}
      <line
        x1={fromEdge.x}
        y1={fromEdge.y}
        x2={toEdge.x}
        y2={toEdge.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Direction arrow in the middle */}
      <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
        <path
          d="M -5 -6 L 5 0 L -5 6"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      
      {/* Connection point circles - improved with inner circle */}
      <circle cx={fromEdge.x} cy={fromEdge.y} r="6" fill="hsl(var(--primary))" />
      <circle cx={fromEdge.x} cy={fromEdge.y} r="3" fill="hsl(var(--background))" />
      
      <circle cx={toEdge.x} cy={toEdge.y} r="6" fill="hsl(var(--primary))" />
      <circle cx={toEdge.x} cy={toEdge.y} r="3" fill="hsl(var(--background))" />
      
      {/* Cardinality labels with improved styling */}
      <g>
        <rect
          x={labelFromPos.x - 16}
          y={labelFromPos.y - 14}
          width="32"
          height="28"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
        />
        <text
          x={labelFromPos.x}
          y={labelFromPos.y}
          fill="white"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {labels.from}
        </text>
      </g>
      
      <g>
        <rect
          x={labelToPos.x - 16}
          y={labelToPos.y - 14}
          width="32"
          height="28"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
        />
        <text
          x={labelToPos.x}
          y={labelToPos.y}
          fill="white"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {labels.to}
        </text>
      </g>
    </g>
  );
}

function getEdgePoint(
  rectX: number,
  rectY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const centerX = rectX + width / 2;
  const centerY = rectY + height / 2;
  
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx * height > absDy * width) {
    // Connect to left or right edge
    if (dx > 0) {
      const edgeY = centerY + (dy / dx) * (width / 2);
      return { x: rectX + width, y: edgeY };
    } else {
      const edgeY = centerY - (dy / dx) * (width / 2);
      return { x: rectX, y: edgeY };
    }
  } else {
    // Connect to top or bottom edge
    if (dy > 0) {
      const edgeX = centerX + (dx / dy) * (height / 2);
      return { x: edgeX, y: rectY + height };
    } else {
      const edgeX = centerX - (dx / dy) * (height / 2);
      return { x: edgeX, y: rectY };
    }
  }
}

function getCardinalityPosition(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number } {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Position 30px along the line from the edge point (outside the table)
  const dist = 30;
  return {
    x: startX + (dx / len) * dist,
    y: startY + (dy / len) * dist,
  };
}

function getLabels(relationType: '1-1' | '1-N' | 'N-M') {
  // En MLD: fromTable = table avec FK (côté N), toTable = table référencée (côté 1)
  // Pour l'affichage Merise: from affiche la cardinalité côté fromTable, to affiche côté toTable
  // Donc pour 1-N: fromTable a la FK donc est côté "many" (N), toTable est côté "one" (1)
  switch (relationType) {
    case '1-1':
      return { from: '1', to: '1' };
    case '1-N':
      // fromTable = table enfant (N), toTable = table parent (1)
      // Afficher "1" côté from (table enfant reçoit 1 parent), "N" côté to (table parent a N enfants)
      return { from: '1', to: 'N' };
    case 'N-M':
      return { from: 'N', to: 'M' };
    default:
      return { from: '1', to: '1' };
  }
}
