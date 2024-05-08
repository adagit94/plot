import * as React from "react";
import { useCallback, useState } from "react";

type UseReferenceLineParams = {
    xBaseline: number;
    width: number;
    spacing: number;
};

export const useReferenceLine = ({ xBaseline, width, spacing }: UseReferenceLineParams) => {
    const [referenceLine, setReferenceLine] = useState<JSX.Element>();

    const setReferenceLineEl = useCallback(
        (yCoord?: number) =>
            setReferenceLine(
                yCoord ? <line className="chart__reference-line" x1={xBaseline} y1={yCoord} x2={width - spacing} y2={yCoord} /> : undefined
            ),
        [xBaseline, width, spacing]
    );

    return {
        referenceLine,
        setReferenceLine: setReferenceLineEl,
    };
};
