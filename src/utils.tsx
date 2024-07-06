import * as React from "react";
import { AxesValues } from "./components/ChartCommonTypes";

type CreateDividesBase = {
    length: number;
    valueRange: [number, number];
    steps: number;
    xOrigin: number;
    yOrigin: number;
    spacing: number;
    fontSize: number;
    divideOffset: number;
    precision?: number;
};

export const createXDivides = ({
    length,
    valueRange,
    steps,
    xOrigin,
    yOrigin,
    spacing,
    divideOffset,
    precision,
    textsWidths,
    fontSize,
}: CreateDividesBase & { textsWidths: number[] }): [JSX.Element[], number[], number[]] => {
    const els: JSX.Element[] = [];
    const values: number[] = [];
    const coords: number[] = [];

    const valueInterval = valueRange[1] - valueRange[0]
    const valueStep = valueInterval / steps;
    const step = length / steps;
    const verticalDivideY1 = yOrigin + divideOffset;
    const verticalDivideY2 = yOrigin - divideOffset;

    for (let i = 0, xOffset = xOrigin + step, value = valueRange[0] + valueStep; i < steps; i++, xOffset += step, value += valueStep) {
        const displayValue = Number(value).toFixed(precision ?? 0);

        const line = <line key={`lx${i}`} className="chart__divide" x1={xOffset} y1={verticalDivideY1} x2={xOffset} y2={verticalDivideY2} />;
        const txt = (
            <text
                key={`tx${i}`}
                className="chart__divide-txt chart__divide-txt--x"
                style={{ "userSelect": "none" }}
                x={xOffset - ((textsWidths[i] ?? 0) / 2)}
                y={verticalDivideY1 + spacing}
                fontSize={fontSize}
                dominantBaseline={"hanging"}
            >
                {displayValue}
            </text>
        );

        els.push(line, txt);
        values.push(value)
        coords.push(xOffset)
    }

    return [els, values, coords];
};

export const createYDivides = ({
    length,
    valueRange,
    steps,
    xOrigin,
    yOrigin,
    spacing,
    divideOffset,
    precision,
    textsWidths,
    fontSize,
}: CreateDividesBase & { textsWidths: number[] }): [JSX.Element[], number[], number[]] => {
    const els: JSX.Element[] = [];
    const values: number[] = [];
    const coords: number[] = [];

    const valueInterval = valueRange[1] - valueRange[0]
    const valueStep = valueInterval / steps;
    const step = length / steps;
    const horizontalDivideX1 = xOrigin - divideOffset;
    const horizontalDivideX2 = xOrigin + divideOffset;

    for (let i = 0, yOffset = yOrigin - step, value = valueRange[0] + valueStep; i < steps; i++, yOffset -= step, value += valueStep) {
        const displayValue = Number(value).toFixed(precision ?? 0);

        const line = <line key={`ly${i}`} className="chart__divide" x1={horizontalDivideX1} y1={yOffset} x2={horizontalDivideX2} y2={yOffset} />;
        const txt = (
            <text
                key={`ty${i}`}
                className="chart__divide-txt chart__divide-txt--y"
                style={{ "userSelect": "none" }}
                x={horizontalDivideX1 - spacing - (textsWidths[i] ?? 0)}
                y={yOffset}
                fontSize={fontSize}
                dominantBaseline={"middle"}
            >
                {displayValue}
            </text>
        );

        els.push(line, txt);
        values.push(value)
        coords.push(yOffset)
    }

    return [els, values, coords];
};

type CreateMilestoneLineParams = { axis: "x" | "y", origin: number, length: number, coords: Partial<{ x1: number, x2: number, y1: number, y2: number }>, val: number, min: number, max: number, index: number; coord?: number }

export const createMilestoneLine = ({ axis, origin, length, coord, coords, val, min, max, index }: CreateMilestoneLineParams) => {
    if (Number(val.toFixed(3)) <= Number(min.toFixed(3)) || Number(val.toFixed(3)) > Number(max.toFixed(3))) {
        return null
    }

    coord = coord ?? getCoord(origin, length, val, max)

    coords = { ...coords }
    coords[`${axis}1`] = coord
    coords[`${axis}2`] = coord

    return <line key={`ms${axis}${index}`} className="chart__milestone" {...coords} />;
}

export const getBoundingRects = (els: NodeListOf<Element>) => {
    let rects: DOMRect[] = [];

    for (const el of els) {
        rects.push(el.getBoundingClientRect());
    }

    return rects;
};

type PrimitiveArr = (string | number | boolean)[];

export const comparePrimitiveArrays = (a: PrimitiveArr, b: PrimitiveArr) => a.length === b.length && a.every((x, i) => x === b[i]);

export const getCoord = (origin: number, length: number, value: number, maxValue: number) => {
    return origin + length * (value / maxValue);
}

export const flipY = (coord: number, height: number) => height - coord

export const getIntervalValues = (values: AxesValues, xMax: number, yMax: number) => values.filter(([x, y]) => x >= 0 && x <= xMax && y >= 0 && y <= yMax)

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)