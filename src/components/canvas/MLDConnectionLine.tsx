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

  return (
    <g>
      {/* Direct connection line */}
      <line
        x1={fromEdge.x}
        y1={fromEdge.y}
        x2={toEdge.x}
        y2={toEdge.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Connection point circles */}
      <circle cx={fromEdge.x} cy={fromEdge.y} r="5" fill="hsl(var(--primary))" />
      <circle cx={toEdge.x} cy={toEdge.y} r="5" fill="hsl(var(--primary))" />
      
      {/* Cardinality labels */}
      <g>
        <rect
          x={labelFromPos.x - 14}
          y={labelFromPos.y - 12}
          width="28"
          height="24"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
        />
        <text
          x={labelFromPos.x}
          y={labelFromPos.y}
          fill="white"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {labels.from}
        </text>
      </g>
      
      <g>
        <rect
          x={labelToPos.x - 14}
          y={labelToPos.y - 12}
          width="28"
          height="24"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
        />
        <text
          x={labelToPos.x}
          y={labelToPos.y}
          fill="white"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
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
  
  // Normalized direction
  const nx = dx / len;
  const ny = dy / len;
  
  // Position 40px along the line from start
  const distanceAlongLine = 40;
  const posX = startX + nx * distanceAlongLine;
  const posY = startY + ny * distanceAlongLine;
  
  // Perpendicular offset
  const perpOffset = 18;
  const perpX = -ny * perpOffset;
  const perpY = nx * perpOffset;
  
  return {
    x: posX + perpX,
    y: posY + perpY
  };
}

function getLabels(relationType: '1-1' | '1-N' | 'N-M') {
  switch (relationType) {
    case '1-1':
      return { from: '1', to: '1' };
    case '1-N':
      return { from: 'N', to: '1' };
    case 'N-M':
      return { from: 'N', to: 'M' };
    default:
      return { from: '1', to: '1' };
  }
}
