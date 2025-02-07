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

const CustomSpellTick = ({ x, y, payload }: CustomTickProps) => {
  if (!payload || typeof payload.value !== "number") {
    return <g />;
  }

  const fontSize = 12;
  const rotation = -45;
  const dy = 10;
  const textAnchor = "end";

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

export default CustomSpellTick;
