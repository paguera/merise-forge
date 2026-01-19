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

export function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  relationX,
  relationY,
  cardinality1,
  cardinality2,
  isMLD,
}: ConnectionLineProps) {
  const relCenterX = relationX + 40;
  const relCenterY = relationY + 16;

  // Calculate orthogonal path from entity1 to relation
  const path1 = calculateOrthogonalPath(x1, y1, relCenterX, relCenterY);
  // Calculate orthogonal path from relation to entity2
  const path2 = calculateOrthogonalPath(relCenterX, relCenterY, x2, y2);

  // Cardinality positions: fixed near entities
  const card1Pos = getCardinalityPosition(x1, y1, relCenterX, relCenterY);
  const card2Pos = getCardinalityPosition(x2, y2, relCenterX, relCenterY);

  return (
    <g>
      {/* Orthogonal line from entity 1 to relation */}
      <polyline
        points={path1}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Orthogonal line from relation to entity 2 */}
      <polyline
        points={path2}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Connection point at entity 1 */}
      <circle cx={x1} cy={y1} r="5" fill="hsl(var(--primary))" />
      
      {/* Connection point at entity 2 */}
      <circle cx={x2} cy={y2} r="5" fill="hsl(var(--primary))" />
      
      {/* Cardinality 1 - fixed near entity 1 */}
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
        />
        <text
          x={card1Pos.x}
          y={card1Pos.y}
          fill="white"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {cardinality1}
        </text>
      </g>
      
      {/* Cardinality 2 - fixed near entity 2 */}
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
        />
        <text
          x={card2Pos.x}
          y={card2Pos.y}
          fill="white"
          fontSize="13"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {cardinality2}
        </text>
      </g>
    </g>
  );
}

// Calculate orthogonal path (right angles only)
function calculateOrthogonalPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Determine the best routing based on relative positions
  const midX = x1 + dx / 2;
  const midY = y1 + dy / 2;
  
  // If horizontal distance is greater, go horizontal first then vertical
  if (Math.abs(dx) > Math.abs(dy)) {
    return `${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  } else {
    // Go vertical first then horizontal
    return `${x1},${y1} ${x1},${midY} ${x2},${midY} ${x2},${y2}`;
  }
}

// Get cardinality position fixed near entity
function getCardinalityPosition(entityX: number, entityY: number, targetX: number, targetY: number): { x: number; y: number } {
  const dx = targetX - entityX;
  const dy = targetY - entityY;
  
  // Position cardinality 35px away from entity in the direction of the target
  const distance = 40;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection - place cardinality to the side
    return {
      x: entityX + (dx > 0 ? distance : -distance),
      y: entityY
    };
  } else {
    // Vertical connection - place cardinality above/below
    return {
      x: entityX,
      y: entityY + (dy > 0 ? distance : -distance)
    };
  }
}
