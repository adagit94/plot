import { useMemo } from "react";
import { getInterpolatedValue } from "curve-ts";

type UseInterpolatedValueParams = { values: [number, number][] };

export default function useInterpolatedValue({ values }: UseInterpolatedValueParams) {
  const interpolatedValue = useMemo(() => getInterpolatedValue(), []);
}
