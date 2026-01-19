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
  
  // Get edge connection points and directions
  const { point: fromEdge, side: fromSide } = getEdgePointWithSide(fromX, fromY, fromWidth, fromHeight, toCenterX, toCenterY);
  const { point: toEdge, side: toSide } = getEdgePointWithSide(toX, toY, toWidth, toHeight, fromCenterX, fromCenterY);
  
  // Calculate orthogonal path
  const path = calculateOrthogonalPath(fromEdge, toEdge, fromSide, toSide);

  // Determine cardinality labels based on relation type
  const labels = getLabels(relationType);

  // Fixed cardinality positions near tables
  const labelFromPos = getCardinalityPosition(fromEdge, fromSide);
  const labelToPos = getCardinalityPosition(toEdge, toSide);

  return (
    <g>
      {/* Orthogonal connection line */}
      <polyline
        points={path}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Connection point circles */}
      <circle cx={fromEdge.x} cy={fromEdge.y} r="5" fill="hsl(var(--primary))" />
      <circle cx={toEdge.x} cy={toEdge.y} r="5" fill="hsl(var(--primary))" />
      
      {/* Cardinality labels - fixed near tables */}
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

type Side = 'left' | 'right' | 'top' | 'bottom';

function getEdgePointWithSide(
  rectX: number,
  rectY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number
): { point: { x: number; y: number }; side: Side } {
  const centerX = rectX + width / 2;
  const centerY = rectY + height / 2;
  
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx * height > absDy * width) {
    // Connect to left or right edge
    if (dx > 0) {
      return { point: { x: rectX + width, y: centerY }, side: 'right' };
    } else {
      return { point: { x: rectX, y: centerY }, side: 'left' };
    }
  } else {
    // Connect to top or bottom edge
    if (dy > 0) {
      return { point: { x: centerX, y: rectY + height }, side: 'bottom' };
    } else {
      return { point: { x: centerX, y: rectY }, side: 'top' };
    }
  }
}

function calculateOrthogonalPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromSide: Side,
  toSide: Side
): string {
  const offset = 30; // Distance to extend before turning
  
  let points: { x: number; y: number }[] = [from];
  
  // Calculate intermediate points based on sides
  if (fromSide === 'right' && toSide === 'left') {
    const midX = (from.x + to.x) / 2;
    points.push({ x: midX, y: from.y });
    points.push({ x: midX, y: to.y });
  } else if (fromSide === 'left' && toSide === 'right') {
    const midX = (from.x + to.x) / 2;
    points.push({ x: midX, y: from.y });
    points.push({ x: midX, y: to.y });
  } else if (fromSide === 'bottom' && toSide === 'top') {
    const midY = (from.y + to.y) / 2;
    points.push({ x: from.x, y: midY });
    points.push({ x: to.x, y: midY });
  } else if (fromSide === 'top' && toSide === 'bottom') {
    const midY = (from.y + to.y) / 2;
    points.push({ x: from.x, y: midY });
    points.push({ x: to.x, y: midY });
  } else if (fromSide === 'right' || fromSide === 'left') {
    // Horizontal start, vertical end
    const extendX = from.x + (fromSide === 'right' ? offset : -offset);
    points.push({ x: extendX, y: from.y });
    points.push({ x: extendX, y: to.y });
  } else {
    // Vertical start, horizontal end
    const extendY = from.y + (fromSide === 'bottom' ? offset : -offset);
    points.push({ x: from.x, y: extendY });
    points.push({ x: to.x, y: extendY });
  }
  
  points.push(to);
  
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function getCardinalityPosition(edge: { x: number; y: number }, side: Side): { x: number; y: number } {
  const offset = 25;
  
  switch (side) {
    case 'right':
      return { x: edge.x + offset, y: edge.y };
    case 'left':
      return { x: edge.x - offset, y: edge.y };
    case 'bottom':
      return { x: edge.x, y: edge.y + offset };
    case 'top':
      return { x: edge.x, y: edge.y - offset };
  }
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
