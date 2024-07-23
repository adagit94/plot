import { useMemo } from "react";
import { getInterpolatedValue } from "curve-ts";

export default function useInterpolatedValue(width: number, height: number, settings?: { axis: "x" | "y"; value: number; values: [number, number][], pointR: number }) {
  const interpolatedValue = useMemo(() => settings && getInterpolatedValue(settings.axis, settings.value, settings.values), [settings]);
  const point = <circle r={pointR} cx={ } cy={ } />

  return { point }
}
