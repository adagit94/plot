import { useCallback, useEffect, useState } from "react";
import { AxesValues } from "../components/ChartCommonTypes";
import { clamp, getIntervalValues } from "../utils";

type ZoomValues = {
  values: AxesValues;
  xMax: number;
  yMax: number;
};

type UseZoomerSettings = {
  xStep: number;
  yStep: number;
  values: AxesValues;
  xOffset: number;
  xAxisBorderline: number;
  xMax: number;
  yOffset: number;
  yAxisBorderline: number;
  yMax: number;
};

function useZoomer({
  xStep,
  yStep,
  values,
  xOffset,
  xAxisBorderline,
  xMax,
  yOffset,
  yAxisBorderline,
  yMax,
}: UseZoomerSettings) {
  const [zoomValues, setZoomValues] = useState<ZoomValues>({
    values: getIntervalValues(values, xMax, yMax),
    xMax,
    yMax,
  });

  const zoom: React.WheelEventHandler<SVGSVGElement> = useCallback(
    (e) => {
      const zoomVec = e.deltaY < 0 ? 1 : -1;

      const { max: newXMax } = computeZoomValues(
        "x",
        xStep,
        e.nativeEvent.offsetX,
        xOffset,
        xAxisBorderline,
        zoomValues.xMax,
        xMax,
        zoomVec,
      );

      const { max: newYMax } = computeZoomValues(
        "y",
        yStep,
        e.nativeEvent.offsetY,
        yOffset,
        yAxisBorderline,
        zoomValues.yMax,
        yMax,
        zoomVec,
      );

      const newZoomValues = getIntervalValues(values, newXMax, newYMax);

      setZoomValues({
        values: newZoomValues,
        xMax: newXMax,
        yMax: newYMax,
      });
    },
    [xStep, yStep, xMax, yMax, values, xOffset, xAxisBorderline, yOffset, yAxisBorderline, zoomValues],
  );

  useEffect(() => {
    setZoomValues({ values: getIntervalValues(values, xMax, yMax), xMax, yMax });
  }, [values, xMax, yMax]);

  return { zoom, zoomValues };
}

const computeZoomValues = (
  axis: "x" | "y",
  step: number,
  cursorPos: number,
  offset: number,
  axisBorderline: number,
  prevMax: number,
  initialMax: number,
  zoomVec: -1 | 1,
) => {
  const axisPos = clamp(cursorPos - offset, 0, axisBorderline);
  const axisPercPos = axisPos / axisBorderline;
  const maxScale = axis === "x" ? 1 - axisPercPos : axisPercPos;
  const stepLength = step * maxScale;
  const newMax = prevMax - stepLength * zoomVec;

  return {
    max: clamp(newMax, 0, initialMax),
  };
};

export default useZoomer;
