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

// Entity approximate half-dimensions (used to compute edge exit points)
const ENTITY_HALF_W = 75;
const ENTITY_HALF_H = 30;
const RELATION_HALF_W = 40;
const RELATION_HALF_H = 16;

/**
 * Compute the point on the edge of a rectangle closest to a target,
 * and the outward direction from that edge.
 */
function getEdgePoint(
  cx: number, cy: number, hw: number, hh: number,
  tx: number, ty: number
): { x: number; y: number; dir: 'left' | 'right' | 'top' | 'bottom' } {
  const dx = tx - cx;
  const dy = ty - cy;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Determine which edge to exit from based on angle
  if (absDx * hh > absDy * hw) {
    // Exit left or right
    if (dx > 0) return { x: cx + hw, y: cy, dir: 'right' };
    return { x: cx - hw, y: cy, dir: 'left' };
  } else {
    // Exit top or bottom
    if (dy > 0) return { x: cx, y: cy + hh, dir: 'bottom' };
    return { x: cx, y: cy - hh, dir: 'top' };
  }
}

/**
 * Build an orthogonal (right-angle) path from point A exiting in dirA
 * to point B exiting in dirB.
 */
function buildOrthogonalPath(
  ax: number, ay: number, dirA: string,
  bx: number, by: number, dirB: string
): string {
  const GAP = 20; // gap before first turn

  // Start with a short segment in the exit direction
  let startX = ax, startY = ay;
  if (dirA === 'right') startX += GAP;
  else if (dirA === 'left') startX -= GAP;
  else if (dirA === 'bottom') startY += GAP;
  else if (dirA === 'top') startY -= GAP;

  // End with a short segment into the entry direction
  let endX = bx, endY = by;
  if (dirB === 'right') endX += GAP;
  else if (dirB === 'left') endX -= GAP;
  else if (dirB === 'bottom') endY += GAP;
  else if (dirB === 'top') endY -= GAP;

  // Determine mid routing — we route with one or two bends
  const isHorizA = dirA === 'left' || dirA === 'right';
  const isHorizB = dirB === 'left' || dirB === 'right';

  let points: string;

  if (isHorizA && isHorizB) {
    // Both horizontal exit: route via midX
    const midX = (startX + endX) / 2;
    points = `${ax},${ay} ${startX},${startY} ${midX},${startY} ${midX},${endY} ${endX},${endY} ${bx},${by}`;
  } else if (!isHorizA && !isHorizB) {
    // Both vertical exit: route via midY
    const midY = (startY + endY) / 2;
    points = `${ax},${ay} ${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY} ${bx},${by}`;
  } else if (isHorizA && !isHorizB) {
    // A exits horizontally, B exits vertically
    points = `${ax},${ay} ${startX},${startY} ${startX},${endY} ${endX},${endY} ${bx},${by}`;
  } else {
    // A exits vertically, B exits horizontally
    points = `${ax},${ay} ${startX},${startY} ${endX},${startY} ${endX},${endY} ${bx},${by}`;
  }

  // Convert points to SVG path with rounded corners
  const pts = points.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });

  return buildRoundedPath(pts, 8);
}

/**
 * Build an SVG path from a list of points with rounded corners.
 */
function buildRoundedPath(pts: { x: number; y: number }[], radius: number): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    // Vectors to prev and next
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    const r = Math.min(radius, len1 / 2, len2 / 2);

    // Point before the corner
    const bx = curr.x - (dx1 / len1) * r;
    const by = curr.y - (dy1 / len1) * r;

    // Point after the corner
    const ax = curr.x + (dx2 / len2) * r;
    const ay = curr.y + (dy2 / len2) * r;

    d += ` L ${bx} ${by}`;
    d += ` Q ${curr.x} ${curr.y} ${ax} ${ay}`;
  }

  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
}

export function ConnectionLine({
  x1, y1, x2, y2,
  relationX, relationY,
  cardinality1, cardinality2,
}: ConnectionLineProps) {
  const relCenterX = relationX + RELATION_HALF_W;
  const relCenterY = relationY + RELATION_HALF_H;

  // Compute edge exit points
  const exitE1 = getEdgePoint(x1, y1, ENTITY_HALF_W, ENTITY_HALF_H, relCenterX, relCenterY);
  const entryRel1 = getEdgePoint(relCenterX, relCenterY, RELATION_HALF_W, RELATION_HALF_H, x1, y1);
  const exitRel2 = getEdgePoint(relCenterX, relCenterY, RELATION_HALF_W, RELATION_HALF_H, x2, y2);
  const entryE2 = getEdgePoint(x2, y2, ENTITY_HALF_W, ENTITY_HALF_H, relCenterX, relCenterY);

  // Build orthogonal paths
  const path1 = buildOrthogonalPath(
    exitE1.x, exitE1.y, exitE1.dir,
    entryRel1.x, entryRel1.y, entryRel1.dir
  );
  const path2 = buildOrthogonalPath(
    exitRel2.x, exitRel2.y, exitRel2.dir,
    entryE2.x, entryE2.y, entryE2.dir
  );

  // Place cardinalities at a fixed offset OUTSIDE the entity edge
  const CARD_OFFSET = 32;
  const card1Pos = getCardOutsidePos(exitE1, CARD_OFFSET);
  const card2Pos = getCardOutsidePos(entryE2, CARD_OFFSET);

  return (
    <g>
      {/* Line from entity 1 to relation */}
      <path
        d={path1}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Line from relation to entity 2 */}
      <path
        d={path2}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Connection dots */}
      <circle cx={exitE1.x} cy={exitE1.y} r="4" fill="hsl(var(--primary))" />
      <circle cx={entryE2.x} cy={entryE2.y} r="4" fill="hsl(var(--primary))" />

      {/* Cardinality 1 - outside entity 1 */}
      <g>
        <rect
          x={card1Pos.x - 22}
          y={card1Pos.y - 12}
          width="44"
          height="24"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))"
        />
        <text
          x={card1Pos.x}
          y={card1Pos.y}
          fill="white"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {cardinality1}
        </text>
      </g>

      {/* Cardinality 2 - outside entity 2 */}
      <g>
        <rect
          x={card2Pos.x - 22}
          y={card2Pos.y - 12}
          width="44"
          height="24"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.2))"
        />
        <text
          x={card2Pos.x}
          y={card2Pos.y}
          fill="white"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {cardinality2}
        </text>
      </g>
    </g>
  );
}

/**
 * Place cardinality label outside the entity edge in the exit direction.
 */
function getCardOutsidePos(
  edge: { x: number; y: number; dir: string },
  offset: number
): { x: number; y: number } {
  switch (edge.dir) {
    case 'right': return { x: edge.x + offset, y: edge.y };
    case 'left':  return { x: edge.x - offset, y: edge.y };
    case 'bottom': return { x: edge.x, y: edge.y + offset };
    case 'top':    return { x: edge.x, y: edge.y - offset };
    default:       return { x: edge.x + offset, y: edge.y };
  }
}
