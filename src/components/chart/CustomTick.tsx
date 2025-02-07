import { useIsMobile } from "@/hooks/useIsMobile";

interface CustomTickProps {
  x: number;
  y: number;
  payload: {
    value: number;
    coordinate: number;
  };
  index?: number;
  ticks?: Array<number>;
  tickLimit?: number;
}

const tickLimit = 12;
const mobileTickLimit = 8;

const CustomTick = ({ x, y, payload, ticks = [] }: CustomTickProps) => {
  const isMobile = useIsMobile();

  if (!payload || typeof payload.value !== "number") {
    return <g />;
  }

  const _tickLimit = isMobile ? mobileTickLimit : tickLimit;
  const shouldRotate = ticks.length > _tickLimit;

  const fontSize = shouldRotate ? 12 : 14;
  const rotation = shouldRotate ? -45 : 0;
  const dy = shouldRotate ? 10 : 16;
  const textAnchor = shouldRotate ? "end" : "middle";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={dy}
        textAnchor={textAnchor}
        transform={`rotate(${rotation})`}
        fontSize={fontSize}
        fill="#eee"
      >
        {payload.value.toFixed(1)}
      </text>
    </g>
  );
};

export default CustomTick;
