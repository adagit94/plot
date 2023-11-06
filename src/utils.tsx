import * as React from "react";

export const getValueCharsCount = (value: number, precision: number) => Number(value).toFixed(precision ?? 0).length;

export const getValueXOffset = (value: number, precision: number, fontSize: number) => (getValueCharsCount(value, precision) * fontSize) / 2;

export const getValueXOffsetForChars = (chars: number, fontSize: number) => (chars * fontSize) / 2;

type CreateXDivides = (params: {
    length: number;
    max: number;
    steps: number;
    xBaseline: number;
    yBaseline: number;
    spacing: number;
    fontSize: number;
    divideOffset: number;
    precision?: number;
}) => JSX.Element[];

export const createXDivides: CreateXDivides = ({ length, max, steps, xBaseline, yBaseline, spacing, fontSize, divideOffset, precision }) => {
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
                className="chart__divide-txt"
                x={xOffset - getValueXOffsetForChars(displayValue.length, fontSize) / 2}
                y={verticalDivideY1 + spacing}
                fontSize={fontSize}
                dominantBaseline={"hanging"}
            >
                {displayValue}
            </text>
        );

        divides.push(line, txt);
    }

    return divides
};

export const createYDivides: CreateXDivides = ({ length, max, steps, xBaseline, yBaseline, spacing, fontSize, divideOffset, precision }) => {
    const divides: JSX.Element[] = [];

    const valueStep = max / steps;
    const step = length / steps;
    const horizontalDivideX1 = xBaseline - divideOffset;
    const horizontalDivideX2 = xBaseline + divideOffset;

    for (let i = 0, yOffset = yBaseline - step, value = valueStep; i < steps; i++, yOffset -= step, value += valueStep) {
        const displayValue = Number(value).toFixed(precision ?? 0);

        const line = (
            <line key={`ly${i}`} className="chart__divide" x1={horizontalDivideX1} y1={yOffset} x2={horizontalDivideX2} y2={yOffset} />
        );
        const txt = (
            <text
                key={`ty${i}`}
                className="chart__divide-txt"
                x={horizontalDivideX1 - spacing - getValueXOffsetForChars(displayValue.length, fontSize)}
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
