import { MeriseModel } from '@/types/merise';

interface SchemaThumbnailProps {
  model: MeriseModel;
  width?: number;
  height?: number;
  className?: string;
}

export function SchemaThumbnail({ 
  model, 
  width = 120, 
  height = 80, 
  className = '' 
}: SchemaThumbnailProps) {
  if (!model.entities.length && !model.relations.length) {
    return (
      <div 
        className={`bg-muted rounded border border-border flex items-center justify-center text-muted-foreground text-xs ${className}`}
        style={{ width, height }}
      >
        Vide
      </div>
    );
  }

  // Calculate bounds for scaling
  const allX = [
    ...model.entities.map(e => e.position.x),
    ...model.entities.map(e => e.position.x + 150),
    ...model.relations.map(r => r.position.x),
    ...model.relations.map(r => r.position.x + 80),
  ];
  const allY = [
    ...model.entities.map(e => e.position.y),
    ...model.entities.map(e => e.position.y + 60),
    ...model.relations.map(r => r.position.y),
    ...model.relations.map(r => r.position.y + 32),
  ];

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const modelWidth = maxX - minX + 40;
  const modelHeight = maxY - minY + 40;
  const scaleX = width / modelWidth;
  const scaleY = height / modelHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const offsetX = (width - modelWidth * scale) / 2 - minX * scale + 10;
  const offsetY = (height - modelHeight * scale) / 2 - minY * scale + 10;

  return (
    <svg
      width={width}
      height={height}
      className={`bg-card rounded border border-border ${className}`}
      style={{ minWidth: width }}
    >
      <defs>
        <marker
          id="thumbnail-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
        </marker>
      </defs>

      {/* Connection lines */}
      {model.relations.map((relation) => {
        const entity1 = model.entities.find(e => e.id === relation.entity1Id);
        const entity2 = model.entities.find(e => e.id === relation.entity2Id);
        
        if (!entity1 || !entity2) return null;
        
        const x1 = (entity1.position.x + 75) * scale + offsetX;
        const y1 = (entity1.position.y + 30) * scale + offsetY;
        const relX = (relation.position.x + 40) * scale + offsetX;
        const relY = (relation.position.y + 16) * scale + offsetY;
        const x2 = (entity2.position.x + 75) * scale + offsetX;
        const y2 = (entity2.position.y + 30) * scale + offsetY;

        return (
          <g key={relation.id}>
            <line
              x1={x1}
              y1={y1}
              x2={relX}
              y2={relY}
              stroke="hsl(var(--primary))"
              strokeWidth="1"
            />
            <line
              x1={relX}
              y1={relY}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--primary))"
              strokeWidth="1"
            />
          </g>
        );
      })}

      {/* Entities */}
      {model.entities.map((entity) => {
        const x = entity.position.x * scale + offsetX;
        const y = entity.position.y * scale + offsetY;
        const w = 150 * scale;
        const h = Math.max(40, (30 + entity.attributes.length * 20)) * scale;

        return (
          <g key={entity.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={4 * scale}
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
            />
            <text
              x={x + w / 2}
              y={y + 8 * scale}
              textAnchor="middle"
              fontSize={8 * scale}
              fill="hsl(var(--foreground))"
              fontWeight="600"
            >
              {entity.name.substring(0, 10)}
            </text>
          </g>
        );
      })}

      {/* Relations */}
      {model.relations.map((relation) => {
        const x = relation.position.x * scale + offsetX;
        const y = relation.position.y * scale + offsetY;
        const w = 80 * scale;
        const h = 32 * scale;

        return (
          <g key={relation.id}>
            <polygon
              points={`
                ${x + w / 2},${y}
                ${x + w},${y + h / 2}
                ${x + w / 2},${y + h}
                ${x},${y + h / 2}
              `}
              fill="hsl(var(--accent))"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
}
