import * as React from "react";
import { ChartProps } from "../../types";
import { useReferenceLine } from "../../useReferenceLine";
import { PointChartItemInfo, useValueInfo, valueInfoCreators } from "../../useValueInfo";
import { comparePrimitiveArrays, createXDivides, createYDivides, getBoundingRects } from "../../utils";

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
        divideLength,
        xPrecision,
        yPrecision,
        connectPoints,
        spacing,
        fontSize,
    }: PointChartProps) => {
        const [xTextsWidths, setXTextsWidths] = React.useState<number[]>([]);
        const [yTextsWidths, setYTextsWidths] = React.useState<number[]>([]);

        const containerRef = React.useRef<SVGElement>();

        const xMax = React.useMemo(() => xLimit ?? Math.max(...values.map(([x]) => x)), [xLimit, values]);
        const yMax = React.useMemo(() => yLimit ?? Math.max(...values.map(([_x, y]) => y)), [yLimit, values]);

        const divideOffset = divideLength / 2;

        const xOffset = React.useMemo(() => (yTextsWidths.length > 0 ? Math.max(...yTextsWidths) : 0) + spacing + divideOffset, [divideOffset, spacing, yTextsWidths]);
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
                    textsWidths: xTextsWidths,
                    precision: xPrecision,
                    spacing,
                    fontSize,
                }),
            [divideOffset, xTextsWidths, gridWidth, spacing, xBaseline, xMax, xPrecision, xSteps, yBaseline, fontSize]
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
                    textsWidths: yTextsWidths,
                    precision: yPrecision,
                    spacing,
                    fontSize,
                }),
            [divideOffset, yTextsWidths, gridHeight, spacing, xBaseline, yBaseline, yMax, yPrecision, ySteps, fontSize]
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
        } = useValueInfo<PointChartItemInfo>({
            xBaseline,
            divideOffset,
            spacing,
            fontSize,
            infoCreators: { single: valueInfoCreators.singlePoint, multiple: valueInfoCreators.multiplePoints },
        });

        const createPoint = React.useCallback(
            (xCoord: number, yCoord: number, xVal: number, yVal: number, index: number) => {
                const valueInfoItem: PointChartItemInfo = {
                    index,
                    coords: { x1: xCoord - pointR, x2: xCoord + pointR, y1: yCoord - pointR, y2: yCoord + pointR },
                    values: { x: xVal, y: yVal },
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

        // eslint-disable-next-line react-hooks/exhaustive-deps
        React.useEffect(() => {
            const container = containerRef.current;

            if (!container) return;

            const newXTextsWidths = getBoundingRects(container.querySelectorAll(".chart__divide-txt--x")).map(({ width }) => Math.round(width));
            const newYTextsWidths = getBoundingRects(container.querySelectorAll(".chart__divide-txt--y")).map(({ width }) => Math.round(width));

            if (!comparePrimitiveArrays(newXTextsWidths, xTextsWidths)) {
                setXTextsWidths(newXTextsWidths);
            }

            if (!comparePrimitiveArrays(newYTextsWidths, yTextsWidths)) {
                setYTextsWidths(newYTextsWidths);
            }
        });

        return (
            <svg
                className="chart point-chart"
                style={{ outline: "none" }}
                ref={containerRef as React.LegacyRef<SVGSVGElement>}
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
