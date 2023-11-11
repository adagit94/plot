import * as React from "react";

type CreateDividesBase = {
    length: number;
    max: number;
    steps: number;
    xBaseline: number;
    yBaseline: number;
    spacing: number;
    fontSize: number;
    divideOffset: number;
    precision?: number;
};

export const createXDivides = ({
    length,
    max,
    steps,
    xBaseline,
    yBaseline,
    spacing,
    divideOffset,
    precision,
    textsWidths,
    fontSize,
}: CreateDividesBase & { textsWidths: number[] }) => {
    const divides: JSX.Element[] = [];

    const valueStep = max / steps;
    const step = length / steps;
    const verticalDivideY1 = yBaseline + divideOffset;
    const verticalDivideY2 = yBaseline - divideOffset;

    for (let i = 0, xOffset = xBaseline + step, value = valueStep; i < steps; i++, xOffset += step, value += valueStep) {
        const displayValue = Number(value).toFixed(precision ?? 0);

        const line = <line key={`lx${i}`} className="chart__divide" x1={xOffset} y1={verticalDivideY1} x2={xOffset} y2={verticalDivideY2} />;
        const txt = (
            <text
                key={`tx${i}`}
                className="chart__divide-txt chart__divide-txt--x"
                x={xOffset - ((textsWidths[i] ?? 0) / 2)}
                y={verticalDivideY1 + spacing}
                fontSize={fontSize}
                dominantBaseline={"hanging"}
            >
                {displayValue}
            </text>
        );

        divides.push(line, txt);
    }

    return divides;
};

export const createYDivides = ({
    length,
    max,
    steps,
    xBaseline,
    yBaseline,
    spacing,
    divideOffset,
    precision,
    textsWidths,
    fontSize,
}: CreateDividesBase & { textsWidths: number[] }) => {
    const divides: JSX.Element[] = [];

    const valueStep = max / steps;
    const step = length / steps;
    const horizontalDivideX1 = xBaseline - divideOffset;
    const horizontalDivideX2 = xBaseline + divideOffset;

    for (let i = 0, yOffset = yBaseline - step, value = valueStep; i < steps; i++, yOffset -= step, value += valueStep) {
        const displayValue = Number(value).toFixed(precision ?? 0);

        const line = <line key={`ly${i}`} className="chart__divide" x1={horizontalDivideX1} y1={yOffset} x2={horizontalDivideX2} y2={yOffset} />;
        const txt = (
            <text
                key={`ty${i}`}
                className="chart__divide-txt chart__divide-txt--y"
                x={horizontalDivideX1 - spacing - (textsWidths[i] ?? 0)}
                y={yOffset}
                fontSize={fontSize}
                dominantBaseline={"middle"}
            >
                {displayValue}
            </text>
        );

        divides.push(line, txt);
    }

    return divides;
};

export const getBoundingRects = (els: NodeListOf<Element>) => {
    let rects: DOMRect[] = [];

    for (const el of els) {
        rects.push(el.getBoundingClientRect());
    }

    return rects;
};

type PrimitiveArr = (string | number | boolean)[];

export const comparePrimitiveArrays = (a: PrimitiveArr, b: PrimitiveArr) => a.length === b.length && a.every((x, i) => x === b[i]);
