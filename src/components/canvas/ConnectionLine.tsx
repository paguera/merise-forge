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
const RELATION_HALF_W = 40;
const RELATION_HALF_H = 16;

/**
 * Get edge intersection point of a line from center (cx,cy) toward target (tx,ty)
 * on a rectangle of half-width hw and half-height hh.
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

export function ConnectionLine({
  x1, y1, x2, y2,
  relationX, relationY,
  cardinality1, cardinality2,
}: ConnectionLineProps) {
  const relCX = relationX + RELATION_HALF_W;
  const relCY = relationY + RELATION_HALF_H;

  // Edge points: line exits entity edge and enters relation edge
  const e1Edge = getEdgePoint(x1, y1, ENTITY_HALF_W, ENTITY_HALF_H, relCX, relCY);
  const relEdge1 = getEdgePoint(relCX, relCY, RELATION_HALF_W, RELATION_HALF_H, x1, y1);
  const relEdge2 = getEdgePoint(relCX, relCY, RELATION_HALF_W, RELATION_HALF_H, x2, y2);
  const e2Edge = getEdgePoint(x2, y2, ENTITY_HALF_W, ENTITY_HALF_H, relCX, relCY);

  // Cardinality positions: fixed distance outside the entity edge along the line
  const CARD_DIST = 30;
  const card1Pos = getPointAlongLine(e1Edge, relEdge1, CARD_DIST);
  const card2Pos = getPointAlongLine(e2Edge, relEdge2, CARD_DIST);

  return (
    <g>
      {/* Straight line: entity 1 edge → relation edge */}
      <line
        x1={e1Edge.x} y1={e1Edge.y}
        x2={relEdge1.x} y2={relEdge1.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Straight line: relation edge → entity 2 edge */}
      <line
        x1={relEdge2.x} y1={relEdge2.y}
        x2={e2Edge.x} y2={e2Edge.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Small dots at entity connection points */}
      <circle cx={e1Edge.x} cy={e1Edge.y} r="4" fill="hsl(var(--primary))" />
      <circle cx={e2Edge.x} cy={e2Edge.y} r="4" fill="hsl(var(--primary))" />

      {/* Cardinality 1 — outside entity 1 */}
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

      {/* Cardinality 2 — outside entity 2 */}
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

/** Move `dist` pixels from `from` toward `to`. */
function getPointAlongLine(
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
