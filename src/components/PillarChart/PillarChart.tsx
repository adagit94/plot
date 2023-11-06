import * as React from "react";
import { ChartProps } from "../../types";
import { useReferenceLine } from "../../useReferenceLine";
import { useValueInfo } from "../../useValueInfo";
import { getValueXOffset, createXDivides, createYDivides } from "../../utils";

type PillarChartProps = ChartProps & {
    values: [[number, number], number][]; // [[x1, x2], y]; values themself, not coordinates; x1 and x2 defines interval on x axis
};

export const PillarChart = React.memo(
    ({ width, height, xLimit, xSteps, ySteps, yLimit, values, fontSize, divideLength, xPrecision, yPrecision, spacing }: PillarChartProps) => {
        const xMax = React.useMemo(() => xLimit ?? Math.max(...values.map(([[_x1, x2]]) => x2)), [xLimit, values]);
        const yMax = React.useMemo(() => yLimit ?? Math.max(...values.map(([_x, y]) => y)), [yLimit, values]);

        const divideOffset = divideLength / 2;

        const xOffset = getValueXOffset(yMax, yPrecision ?? 0, fontSize) + spacing + divideOffset;
        const yOffset = fontSize + spacing + divideOffset;

        const gridWidth = width - xOffset - spacing;
        const gridHeight = height - yOffset - spacing;

        const xBaseline = xOffset;
        const yBaseline = height - yOffset;

        const xDivides = React.useMemo(
            () =>
                createXDivides({
                    max: xMax,
                    steps: xSteps,
                    length: gridWidth,
                    yBaseline,
                    divideOffset,
                    xBaseline,
                    fontSize,
                    precision: xPrecision,
                    spacing,
                }),
            [divideOffset, fontSize, gridWidth, spacing, xBaseline, xMax, xPrecision, xSteps, yBaseline]
        );

        const yDivides = React.useMemo(
            () =>
                createYDivides({
                    max: yMax,
                    steps: ySteps,
                    length: gridHeight,
                    yBaseline,
                    divideOffset,
                    xBaseline,
                    fontSize,
                    precision: yPrecision,
                    spacing,
                }),
            [divideOffset, fontSize, gridHeight, spacing, xBaseline, yBaseline, yMax, yPrecision, ySteps]
        );

        const { referenceLine, setReferenceLine } = useReferenceLine({ xBaseline, width, spacing });
        const {
            addValueInfoItem,
            removeValueInfoItem,
            replaceValueInfoItems,
            clearValueInfoItems,
            setAllValueInfoItems,
            valueInfo,
            isItemActive: isPointActive,
            valueInfoItemsRef,
        } = useValueInfo({
            xBaseline,
            divideOffset,
        });

        const plot = React.useCallback(() => {
            valueInfoItemsRef.current = [];

            return values.map(([[x1Val, x2Val], yVal], index) => {
                const x1Coord = xBaseline + gridWidth * (x1Val / xMax);
                const x2Coord = xBaseline + gridWidth * (x2Val / xMax);
                const yCoord = yBaseline - gridHeight * (yVal / yMax);

                const valueInfoItem = { index, yVal, txt: `interval: ${x1Val} - ${x2Val}, y: ${yVal}` };
                const isActive = isPointActive(index);

                valueInfoItemsRef.current.push(valueInfoItem);

                return (
                    <rect
                        key={`r${index}`}
                        className={`chart__item${isActive ? " chart__item--active" : ""} chart__rectangle`}
                        x={x1Coord}
                        width={x2Coord - x1Coord}
                        y={yCoord}
                        height={yBaseline - yCoord}
                        onMouseEnter={() => setReferenceLine(yCoord)}
                        onMouseLeave={() => setReferenceLine(undefined)}
                        onClick={e => {
                            e.stopPropagation();

                            if (e.ctrlKey) {
                                isActive ? removeValueInfoItem(index) : addValueInfoItem(valueInfoItem);
                            } else {
                                isActive ? clearValueInfoItems() : replaceValueInfoItems([valueInfoItem]);
                            }
                        }}
                    />
                );
            });
        }, [
            addValueInfoItem,
            clearValueInfoItems,
            gridHeight,
            gridWidth,
            isPointActive,
            removeValueInfoItem,
            replaceValueInfoItems,
            setReferenceLine,
            valueInfoItemsRef,
            values,
            xBaseline,
            xMax,
            yBaseline,
            yMax,
        ]);

        const rectangles = React.useMemo(() => plot(), [plot]);

        const onKeyDown: React.KeyboardEventHandler<SVGSVGElement> = React.useCallback(
            e => {
                if (e.ctrlKey && e.keyCode === 65) {
                    e.preventDefault();
                    setAllValueInfoItems();
                }
            },
            [setAllValueInfoItems]
        );

        return (
            <div>
                <svg
                    className="chart pillar-chart"
                    style={{ outline: "none" }}
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    onClick={clearValueInfoItems}
                    onKeyDown={onKeyDown}
                    tabIndex={-1}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle r={0} cx={xBaseline} cy={yBaseline} />

                    <line className="chart__axis" x1={xBaseline} y1={yBaseline} x2={width - spacing} y2={yBaseline} />
                    <line className="chart__axis" x1={xBaseline} y1={yBaseline} x2={xBaseline} y2={spacing} />

                    {xDivides}
                    {yDivides}

                    {referenceLine}

                    {rectangles}

                    {valueInfo}
                </svg>
            </div>
        );
    }
);
