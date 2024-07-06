import { AxesValues } from "./components/ChartCommonTypes";

type Density = (params: {
  values: AxesValues;
  maxXVal: number;
  maxYVal: number;
  width: number;
  height: number;
  xInterval?: [number, number];
  yInterval?: [number, number];
}) => number;

export const density: Density = ({ values, xInterval, yInterval, maxXVal, maxYVal, width, height }) => {
  const intervalValues =
    xInterval === undefined && yInterval === undefined
      ? values
      : values.filter(
          ([x, y]) =>
            (xInterval === undefined || (x >= xInterval[0] && x <= xInterval[1])) &&
            (yInterval === undefined || (y >= yInterval[0] && y <= yInterval[1])),
        );

  const x1 = width * ((xInterval?.[0] ?? 0) / maxXVal);
  const x2 = width * ((xInterval?.[1] ?? maxXVal) / maxXVal);
  const y1 = height * ((yInterval?.[0] ?? 0) / maxYVal);
  const y2 = height * ((yInterval?.[1] ?? maxYVal) / maxYVal);

  const intervalWidth = x2 - x1;
  const intervalHeight = y2 - y1;

  const area = intervalWidth * intervalHeight;
  const ratio = intervalValues.length / area;

  return ratio;
};

type DensityPopulated = (params: { values: AxesValues; width: number; height: number }) => number;

export const densityPopulated: DensityPopulated = ({ values, width, height }) => {
  let minX = values[0][0];
  let maxX = values[0][0];
  let minY = values[0][1];
  let maxY = values[0][1];

  for (let i = 1; i < values.length; i++) {
    const [xVal, yVal] = values[i];

    minX = Math.min(minX, xVal);
    maxX = Math.max(maxX, xVal);
    minY = Math.min(minY, yVal);
    maxY = Math.max(maxY, yVal);
  }

  const minXCoord = width * (minX / maxX);
  const maxXCoord = width;
  const minYCoord = height * (minY / maxY);
  const maxYCoord = height;

  const intervalWidth = maxXCoord - minXCoord;
  const intervalHeight = maxYCoord - minYCoord;

  const area = intervalWidth * intervalHeight;
  const ratio = values.length / area;

  return ratio;
};

export const percentageOffset = (a: number, b: number) => (a / b) * 100 - 100