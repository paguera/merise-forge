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

  // Calculate label positions (closer to entities, offset from line)
  const label1X = x1 + (relCenterX - x1) * 0.15;
  const label1Y = y1 + (relCenterY - y1) * 0.15;
  const label2X = relCenterX + (x2 - relCenterX) * 0.85;
  const label2Y = relCenterY + (y2 - relCenterY) * 0.85;

  // Calculate perpendicular offset for labels
  const getPerpendicularOffset = (startX: number, startY: number, endX: number, endY: number) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { ox: (-dy / len) * 18, oy: (dx / len) * 18 };
  };

  const offset1 = getPerpendicularOffset(x1, y1, relCenterX, relCenterY);
  const offset2 = getPerpendicularOffset(relCenterX, relCenterY, x2, y2);

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
      <circle cx={x1} cy={y1} r="4" fill="hsl(var(--primary))" />
      
      {/* Connection point at entity 2 */}
      <circle cx={x2} cy={y2} r="4" fill="hsl(var(--primary))" />
      
      {/* Cardinality 1 - near entity 1 with badge */}
      <g>
        <rect
          x={label1X + offset1.ox - 20}
          y={label1Y + offset1.oy - 12}
          width="40"
          height="20"
          rx="4"
          fill="hsl(var(--destructive))"
        />
        <text
          x={label1X + offset1.ox}
          y={label1Y + offset1.oy}
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {cardinality1}
        </text>
      </g>
      
      {/* Cardinality 2 - near entity 2 with badge */}
      <g>
        <rect
          x={label2X + offset2.ox - 20}
          y={label2Y + offset2.oy - 12}
          width="40"
          height="20"
          rx="4"
          fill="hsl(var(--destructive))"
        />
        <text
          x={label2X + offset2.ox}
          y={label2Y + offset2.oy}
          fill="white"
          fontSize="12"
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
