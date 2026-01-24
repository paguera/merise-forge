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

  // Calculate arrow positions for directional indicators
  const arrow1Pos = getArrowPosition(x1, y1, relCenterX, relCenterY, 0.7);
  const arrow2Pos = getArrowPosition(relCenterX, relCenterY, x2, y2, 0.3);

  // Arrow directions
  const arrow1Angle = Math.atan2(relCenterY - y1, relCenterX - x1) * (180 / Math.PI);
  const arrow2Angle = Math.atan2(y2 - relCenterY, x2 - relCenterX) * (180 / Math.PI);

  return (
    <g>
      <defs>
        <marker
          id="arrowhead-primary"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path 
            d="M 0 0 L 12 6 L 0 12 L 3 6 Z" 
            fill="hsl(var(--primary))"
          />
        </marker>
        <marker
          id="arrowhead-outline"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path 
            d="M 0 0 L 12 6 L 0 12 L 3 6 Z" 
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </marker>
      </defs>

      {/* Line from entity 1 to relation - with smooth curve */}
      <path
        d={generateSmoothPath(x1, y1, relCenterX, relCenterY)}
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Line from relation to entity 2 - with smooth curve */}
      <path
        d={generateSmoothPath(relCenterX, relCenterY, x2, y2)}
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Direction indicators (chevrons) */}
      <g transform={`translate(${arrow1Pos.x}, ${arrow1Pos.y}) rotate(${arrow1Angle})`}>
        <path
          d="M -4 -5 L 4 0 L -4 5"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      
      <g transform={`translate(${arrow2Pos.x}, ${arrow2Pos.y}) rotate(${arrow2Angle})`}>
        <path
          d="M -4 -5 L 4 0 L -4 5"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Connection point at entity 1 */}
      <circle cx={x1} cy={y1} r="6" fill="hsl(var(--primary))" />
      <circle cx={x1} cy={y1} r="3" fill="hsl(var(--background))" />
      
      {/* Connection point at entity 2 */}
      <circle cx={x2} cy={y2} r="6" fill="hsl(var(--primary))" />
      <circle cx={x2} cy={y2} r="3" fill="hsl(var(--background))" />
      
      {/* Cardinality 1 - near entity 1 */}
      <g>
        <rect
          x={card1Pos.x - 24}
          y={card1Pos.y - 14}
          width="48"
          height="28"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
        />
        <text
          x={card1Pos.x}
          y={card1Pos.y}
          fill="white"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, sans-serif"
        >
          {cardinality1}
        </text>
      </g>
      
      {/* Cardinality 2 - near entity 2 */}
      <g>
        <rect
          x={card2Pos.x - 24}
          y={card2Pos.y - 14}
          width="48"
          height="28"
          rx="6"
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
        />
        <text
          x={card2Pos.x}
          y={card2Pos.y}
          fill="white"
          fontSize="14"
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

// Generate a smooth curved path between two points
function generateSmoothPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // For short distances, use a straight line
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 100) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  
  // Control point offset for curve
  const curveStrength = Math.min(distance * 0.15, 30);
  
  // Calculate perpendicular offset for control point
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Use quadratic bezier for smooth curve
  const perpX = -dy / distance * curveStrength;
  const perpY = dx / distance * curveStrength;
  
  const ctrlX = midX + perpX * 0.3;
  const ctrlY = midY + perpY * 0.3;
  
  return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
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
  
  // Position 55px along the line from entity
  const distanceAlongLine = 55;
  const posX = entityX + nx * distanceAlongLine;
  const posY = entityY + ny * distanceAlongLine;
  
  // Perpendicular offset to avoid line overlap
  const perpOffset = 25;
  const perpX = -ny * perpOffset;
  const perpY = nx * perpOffset;
  
  return {
    x: posX + perpX,
    y: posY + perpY
  };
}

// Get arrow position along the line
function getArrowPosition(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): { x: number; y: number } {
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t
  };
}
