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

  return (
    <g>
      {/* Line from entity 1 to relation */}
      <line
        x1={x1}
        y1={y1}
        x2={relCenterX}
        y2={relCenterY}
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
      />
      
      {/* Line from relation to entity 2 */}
      <line
        x1={relCenterX}
        y1={relCenterY}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
      />
      
      {/* Cardinality 1 - near entity 1 */}
      <text
        x={x1 + (relCenterX - x1) * 0.2}
        y={y1 + (relCenterY - y1) * 0.2 - 8}
        fill="hsl(var(--foreground))"
        fontSize="12"
        fontWeight="500"
      >
        {cardinality1}
      </text>
      
      {/* Cardinality 2 - near entity 2 */}
      <text
        x={relCenterX + (x2 - relCenterX) * 0.8}
        y={relCenterY + (y2 - relCenterY) * 0.8 - 8}
        fill="hsl(var(--foreground))"
        fontSize="12"
        fontWeight="500"
      >
        {cardinality2}
      </text>
    </g>
  );
}
