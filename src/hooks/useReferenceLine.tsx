import * as React from "react";
import { useCallback, useState } from "react";

type UseReferenceLineParams = {
    xBaseline: number;
    width: number;
};

export const useReferenceLine = ({ xBaseline, width }: UseReferenceLineParams) => {
    const [referenceLine, setReferenceLine] = useState<JSX.Element>();

    const setReferenceLineEl = useCallback(
        (yCoord?: number) => {
            return setReferenceLine(
                yCoord ? <line className="chart__reference-line" x1={xBaseline} x2={xBaseline + width} y1={yCoord} y2={yCoord} /> : undefined
            )
        },
        [xBaseline, width]
    );

    return {
        referenceLine,
        setReferenceLine: setReferenceLineEl,
    };
};
