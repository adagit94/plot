import * as React from "react";
import { ChartProps } from "../../types";
import { useReferenceLine } from "../../useReferenceLine";
import { useValueInfo } from "../../useValueInfo";
import { getValueXOffset, createXDivides, createYDivides } from "../../utils";

type PointChartProps = ChartProps & {
    pointR: number;
    values: [number, number][]; // [x, y]; values themself, not coordinates
    connectPoints?: boolean;
};

export const PointChart = React.memo(
    ({
        width,
        height,
        xLimit,
        xSteps,
        ySteps,
        yLimit,
        values,
        pointR,
        fontSize,
        divideLength,
        xPrecision,
        yPrecision,
        connectPoints,
        spacing,
    }: PointChartProps) => {
        const xMax = React.useMemo(() => xLimit ?? Math.max(...values.map(([x]) => x)), [xLimit, values]);
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
                    spacing: spacing,
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
                    spacing: spacing,
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
            activateSelectionRect,
            deactivateSelectionRect,
            onSelectionRectResize,
            selectionRect,
        } = useValueInfo({
            xBaseline,
            divideOffset,
        });

        const createPoint = React.useCallback(
            (xCoord: number, yCoord: number, xVal: number, yVal: number, index: number) => {
                const valueInfoItem = {
                    index,
                    yVal,
                    coords: { x1: xCoord - pointR, x2: xCoord + pointR, y1: yCoord - pointR, y2: yCoord + pointR },
                    txt: `x: ${xVal}, y: ${yVal}`,
                };
                const isActive = isPointActive(index);

                valueInfoItemsRef.current.push(valueInfoItem);

                return (
                    <circle
                        key={`c${index}`}
                        className={`chart__item${isActive ? " chart__item--active" : ""} chart__point`}
                        r={pointR}
                        cx={xCoord}
                        cy={yCoord}
                        shapeRendering={"geometricPrecision"}
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
            },
            [
                isPointActive,
                valueInfoItemsRef,
                pointR,
                setReferenceLine,
                removeValueInfoItem,
                addValueInfoItem,
                clearValueInfoItems,
                replaceValueInfoItems,
            ]
        );

        const plot = React.useCallback(() => {
            valueInfoItemsRef.current = [];

            return values.map(([xVal, yVal], i) => {
                const xCoord = xBaseline + gridWidth * (xVal / xMax);
                const yCoord = yBaseline - gridHeight * (yVal / yMax);

                return createPoint(xCoord, yCoord, xVal, yVal, i);
            });
        }, [createPoint, gridHeight, gridWidth, valueInfoItemsRef, values, xBaseline, xMax, yBaseline, yMax]);

        const plotWithConnections = React.useCallback(() => {
            valueInfoItemsRef.current = [];

            let els: JSX.Element[] = [];

            for (let i = 0, prevCoords = { x: xBaseline, y: yBaseline }; i < values.length; i++) {
                const [xVal, yVal] = values[i];
                const coords = { x: xBaseline + gridWidth * (xVal / xMax), y: yBaseline - gridHeight * (yVal / yMax) };

                els.unshift(
                    <line
                        key={`pl${i}`}
                        className="chart__connection-line"
                        x1={prevCoords.x}
                        y1={prevCoords.y}
                        x2={coords.x}
                        y2={coords.y}
                        shapeRendering={"geometricPrecision"}
                    />
                );

                els.push(createPoint(coords.x, coords.y, xVal, yVal, i));

                prevCoords = coords;
            }

            return els;
        }, [createPoint, gridHeight, gridWidth, valueInfoItemsRef, values, xBaseline, xMax, yBaseline, yMax]);

        const points = React.useMemo(() => (connectPoints ? plotWithConnections() : plot()), [plot, plotWithConnections, connectPoints]);

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
            <svg
                className="chart point-chart"
                style={{ outline: "none" }}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                onClick={clearValueInfoItems}
                onKeyDown={onKeyDown}
                onMouseDown={activateSelectionRect}
                onMouseUp={deactivateSelectionRect}
                onMouseMove={onSelectionRectResize}
                tabIndex={-1}
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle r={0} cx={xBaseline} cy={yBaseline} />

                <line className="chart__axis" x1={xBaseline} y1={yBaseline} x2={width - spacing} y2={yBaseline} />
                <line className="chart__axis" x1={xBaseline} y1={yBaseline} x2={xBaseline} y2={spacing} />

                {xDivides}
                {yDivides}

                {referenceLine}

                {points}

                {selectionRect}

                {valueInfo}
            </svg>
        );
    }
);
