interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  relationX: number;
  relationY: number;
  cardinality1: string;
  cardinality2: string;
  isMLD: boolean;
}

const ENTITY_HALF_W = 75;
const ENTITY_HALF_H = 30;

/**
 * Get the point where a line from (cx,cy) toward (tx,ty) exits a rectangle
 * centered at (cx,cy) with half-dimensions (hw,hh).
 */
function getEdgePoint(
  cx: number, cy: number, hw: number, hh: number,
  tx: number, ty: number
): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx + hw, y: cy };

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let scale: number;
  if (absDx * hh > absDy * hw) {
    scale = hw / absDx;
  } else {
    scale = hh / absDy;
  }

  return { x: cx + dx * scale, y: cy + dy * scale };
}

/** Move `dist` px from `from` toward `to`. */
function pointAlong(
  from: { x: number; y: number },
  to: { x: number; y: number },
  dist: number
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: from.x + (dx / len) * dist,
    y: from.y + (dy / len) * dist,
  };
}

export function ConnectionLine({
  x1, y1, x2, y2,
  relationX, relationY,
  cardinality1, cardinality2,
}: ConnectionLineProps) {
  // Relation center (the relation node is an ellipse/pill centered here)
  const relCX = relationX + 40;
  const relCY = relationY + 16;

  // Edge points on entities (lines start from entity border, not center)
  const e1Edge = getEdgePoint(x1, y1, ENTITY_HALF_W, ENTITY_HALF_H, relCX, relCY);
  const e2Edge = getEdgePoint(x2, y2, ENTITY_HALF_W, ENTITY_HALF_H, relCX, relCY);

  // Draw straight lines from entity edges to relation CENTER (not edge)
  // so the two segments join seamlessly through the relation node

  // Cardinality badges: 30px outside entity edge, along the line
  const card1Pos = pointAlong(e1Edge, { x: relCX, y: relCY }, 30);
  const card2Pos = pointAlong(e2Edge, { x: relCX, y: relCY }, 30);

  return (
    <g>
      {/* Single continuous line: entity1 edge → relation center → entity2 edge */}
      <line
        x1={e1Edge.x} y1={e1Edge.y}
        x2={relCX} y2={relCY}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={relCX} y1={relCY}
        x2={e2Edge.x} y2={e2Edge.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Dots at entity connection points */}
      <circle cx={e1Edge.x} cy={e1Edge.y} r="4" fill="hsl(var(--primary))" />
      <circle cx={e2Edge.x} cy={e2Edge.y} r="4" fill="hsl(var(--primary))" />

      {/* Cardinality 1 — near entity 1 */}
      <g>
        <rect
          x={card1Pos.x - 22} y={card1Pos.y - 12}
          width="44" height="24" rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))"
        />
        <text
          x={card1Pos.x} y={card1Pos.y}
          fill="white" fontSize="13" fontWeight="bold"
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {cardinality1}
        </text>
      </g>

      {/* Cardinality 2 — near entity 2 */}
      <g>
        <rect
          x={card2Pos.x - 22} y={card2Pos.y - 12}
          width="44" height="24" rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))"
        />
        <text
          x={card2Pos.x} y={card2Pos.y}
          fill="white" fontSize="13" fontWeight="bold"
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {cardinality2}
        </text>
      </g>
    </g>
  );
}
