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
}: ConnectionLineProps) {
  const relCenterX = relationX + 40;
  const relCenterY = relationY + 16;

  // Calculate positions for cardinalities - fixed distance from entities
  const card1Pos = getCardinalityPosition(x1, y1, relCenterX, relCenterY);
  const card2Pos = getCardinalityPosition(x2, y2, relCenterX, relCenterY);

  return (
    <g>
      {/* Line from entity 1 to relation */}
      <line
        x1={x1}
        y1={y1}
        x2={relCenterX}
        y2={relCenterY}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Line from relation to entity 2 */}
      <line
        x1={relCenterX}
        y1={relCenterY}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Connection point at entity 1 */}
      <circle cx={x1} cy={y1} r="5" fill="hsl(var(--primary))" />
      
      {/* Connection point at entity 2 */}
      <circle cx={x2} cy={y2} r="5" fill="hsl(var(--primary))" />
      
      {/* Cardinality 1 - near entity 1 */}
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
      
      {/* Cardinality 2 - near entity 2 */}
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

// Position cardinality label along the line, offset perpendicular to avoid overlap
function getCardinalityPosition(
  entityX: number,
  entityY: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const dx = targetX - entityX;
  const dy = targetY - entityY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Normalized direction
  const nx = dx / len;
  const ny = dy / len;
  
  // Position 45px along the line from entity
  const distanceAlongLine = 50;
  const posX = entityX + nx * distanceAlongLine;
  const posY = entityY + ny * distanceAlongLine;
  
  // Perpendicular offset to avoid line overlap
  const perpOffset = 20;
  const perpX = -ny * perpOffset;
  const perpY = nx * perpOffset;
  
  return {
    x: posX + perpX,
    y: posY + perpY
  };
}
