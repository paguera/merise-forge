interface MLDConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  relationType: '1-1' | '1-N' | 'N-M';
}

export function MLDConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  relationType,
}: MLDConnectionLineProps) {
  // Calculate label positions
  const labelFromX = fromX + (toX - fromX) * 0.2;
  const labelFromY = fromY + (toY - fromY) * 0.2 - 8;
  const labelToX = fromX + (toX - fromX) * 0.8;
  const labelToY = fromY + (toY - fromY) * 0.8 - 8;

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

  return (
    <g>
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <text
        x={labelFromX}
        y={labelFromY}
        fill="hsl(var(--destructive))"
        fontSize="14"
        fontWeight="bold"
      >
        {labels.from}
      </text>
      <text
        x={labelToX}
        y={labelToY}
        fill="hsl(var(--destructive))"
        fontSize="14"
        fontWeight="bold"
      >
        {labels.to}
      </text>
    </g>
  );
}
