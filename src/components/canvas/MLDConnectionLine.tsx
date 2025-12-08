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

function getEdgePoint(
  fromX: number,
  fromY: number,
  fromWidth: number,
  fromHeight: number,
  toX: number,
  toY: number
): { x: number; y: number } {
  const centerFromX = fromX + fromWidth / 2;
  const centerFromY = fromY + fromHeight / 2;
  
  const dx = toX - centerFromX;
  const dy = toY - centerFromY;
  
  // Calculate which edge to connect to
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  let edgeX: number;
  let edgeY: number;
  
  if (absDx * fromHeight > absDy * fromWidth) {
    // Connect to left or right edge
    if (dx > 0) {
      edgeX = fromX + fromWidth;
      edgeY = centerFromY + (dy / dx) * (fromWidth / 2);
    } else {
      edgeX = fromX;
      edgeY = centerFromY - (dy / dx) * (fromWidth / 2);
    }
  } else {
    // Connect to top or bottom edge
    if (dy > 0) {
      edgeY = fromY + fromHeight;
      edgeX = centerFromX + (dx / dy) * (fromHeight / 2);
    } else {
      edgeY = fromY;
      edgeX = centerFromX - (dx / dy) * (fromHeight / 2);
    }
  }
  
  return { x: edgeX, y: edgeY };
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
  
  // Calculate label positions (20% and 80% along the line)
  const labelFromX = fromEdge.x + (toEdge.x - fromEdge.x) * 0.15;
  const labelFromY = fromEdge.y + (toEdge.y - fromEdge.y) * 0.15 - 10;
  const labelToX = fromEdge.x + (toEdge.x - fromEdge.x) * 0.85;
  const labelToY = fromEdge.y + (toEdge.y - fromEdge.y) * 0.85 - 10;

  // Determine cardinality labels based on relation type
  const getLabels = () => {
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
  };

  const labels = getLabels();

  // Create a curved path for better visibility
  const midX = (fromEdge.x + toEdge.x) / 2;
  const midY = (fromEdge.y + toEdge.y) / 2;
  
  // Add slight curve offset
  const dx = toEdge.x - fromEdge.x;
  const dy = toEdge.y - fromEdge.y;
  const curveOffset = 0; // Can be adjusted for curved lines

  return (
    <g>
      {/* Main connection line */}
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
      <circle
        cx={fromEdge.x}
        cy={fromEdge.y}
        r="4"
        fill="hsl(var(--primary))"
      />
      <circle
        cx={toEdge.x}
        cy={toEdge.y}
        r="4"
        fill="hsl(var(--primary))"
      />
      
      {/* Cardinality labels */}
      <g>
        <rect
          x={labelFromX - 12}
          y={labelFromY - 12}
          width="24"
          height="18"
          rx="4"
          fill="hsl(var(--destructive))"
        />
        <text
          x={labelFromX}
          y={labelFromY}
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {labels.from}
        </text>
      </g>
      
      <g>
        <rect
          x={labelToX - 12}
          y={labelToY - 12}
          width="24"
          height="18"
          rx="4"
          fill="hsl(var(--destructive))"
        />
        <text
          x={labelToX}
          y={labelToY}
          fill="white"
          fontSize="12"
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
