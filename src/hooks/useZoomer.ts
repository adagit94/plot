import { useCallback, useEffect, useMemo, useState } from "react";
import { AxesValues } from "../components/ChartCommonTypes";
import { getIntervalValues } from "../utils";

type ZoomValues = {
  values: AxesValues[];
  minMax: [[number, number], [number, number]];
};

type AxisValues = {
  viewOffset: number;
  viewMax: number;
  valueMinMax: [number, number];
};

export type AxesZoomValues = {
  x: AxisValues;
  y: AxisValues;
};

type UseZoomerParams = {
  axes: AxesZoomValues;
  inputValues: AxesValues[];
  scale: number;
};

function useZoomer({ axes, inputValues, scale }: UseZoomerParams) {
  const initialZoomValues: ZoomValues = useMemo(
    () => ({
      values: inputValues.map(values => getIntervalValues(values, [axes.x.valueMinMax, axes.y.valueMinMax])),
      minMax: [axes.x.valueMinMax, axes.y.valueMinMax],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputValues, axes.x.valueMinMax[0], axes.x.valueMinMax[1], axes.y.valueMinMax[0], axes.y.valueMinMax[1]],
  );

  const [zoomValues, setZoomValues] = useState<ZoomValues>(initialZoomValues);

  const zoom: React.WheelEventHandler<SVGSVGElement> = useCallback(
    (e) => {
      const zoomVec = e.deltaY < 0 ? 1 : -1;
      const newMinMax: [[number, number], [number, number]] = [
        computeZoomValues(
          "x",
          zoomVec,
          axes.x.viewOffset,
          axes.x.viewMax,
          e.nativeEvent.offsetX,
          scale,
          zoomValues.minMax[0],
          initialZoomValues.minMax[0],
        ),
        computeZoomValues(
          "y",
          zoomVec,
          axes.y.viewOffset,
          axes.y.viewMax,
          e.nativeEvent.offsetY,
          scale,
          zoomValues.minMax[1],
          initialZoomValues.minMax[1],
        ),
      ];

      setZoomValues({
        values: inputValues.map(values => getIntervalValues(values, [axes.x.valueMinMax, axes.y.valueMinMax])),
        minMax: newMinMax,
      });
    },
    [axes, scale, zoomValues, initialZoomValues, inputValues],
  );

  useEffect(() => {
    setZoomValues(initialZoomValues);
  }, [initialZoomValues]);

  return { zoom, zoomValues };
}

const computeZoomValues = (
  axis: "x" | "y",
  zoomVec: 1 | -1,
  viewOffset: number,
  viewMax: number,
  cursorPos: number,
  scale: number,
  minMax: [number, number],
  initialMinMax: [number, number],
): [number, number] => {
  const valueInterval = minMax[1] - minMax[0];
  const cursorRatioPos = (cursorPos - viewOffset) / (viewMax - viewOffset);
  const valueIntervalPos = axis === "x" ? valueInterval * cursorRatioPos : valueInterval * (1 - cursorRatioPos);
  const minMaxLimit = minMax[0] + valueIntervalPos;
  const newMinMax: [number, number] = [
    zoomVec === 1 ? minMax[0] + valueIntervalPos * (1 - 1 / scale) : minMax[0] + valueIntervalPos - (valueIntervalPos * scale),
    zoomVec === 1 ? minMax[1] - (valueInterval - valueIntervalPos) * (1 - 1 / scale) : minMax[0] + valueIntervalPos + (valueInterval - valueIntervalPos) * scale,
  ];

  if (newMinMax[0] >= minMaxLimit) {
    newMinMax[0] = minMax[0];
  } else if (newMinMax[0] < initialMinMax[0]) {
    newMinMax[0] = initialMinMax[0];
  }

  if (newMinMax[1] <= minMaxLimit) {
    newMinMax[1] = minMax[1];
  } else if (newMinMax[1] > initialMinMax[1]) {
    newMinMax[1] = initialMinMax[1];
  }

  return newMinMax;
};

export default useZoomer;
