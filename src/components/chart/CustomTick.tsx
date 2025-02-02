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

const CustomTick = ({
  x,
  y,
  payload,
  ticks = [],
  tickLimit = 11,
}: CustomTickProps) => {
  if (!payload || typeof payload.value !== "number") {
    return <g />;
  }

  const shouldRotate = ticks.length > tickLimit;

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
        fill="#666"
      >
        {payload.value.toFixed(1)}
      </text>
    </g>
  );
};

export default CustomTick;
