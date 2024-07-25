import * as React from "react";
import { AxesValues, ChartProps } from "../ChartCommonTypes";
import { useReferenceLine } from "../../hooks/useReferenceLine";
import { PointChartItemInfo, useValueInfo, valueInfoCreators } from "../../hooks/useValueInfo";
import { comparePrimitiveArrays, createMilestoneLine, createXDivides, createYDivides, getBoundingRects, getCoord } from "../../utils";
import useZoomer from "../../hooks/useZoomer";
import { getInterpolatedValue } from "curve-ts";

enum PointType {
    Data,
    Interpolated
}

type InterpolationSettings = { axis: "x" | "y"; value: number, pointR: number }

type PointChartProps = ChartProps & {
    pointR: number;
    values: AxesValues; // [x, y]; values themself, not coordinates
    connectPoints?: boolean;
    interpolation?: InterpolationSettings
};

export const PointChart = React.memo(
    ({
        width,
        height,
        xSteps,
        ySteps,
        values,
        divideLength,
        xPrecision,
        yPrecision,
        valueInfoXPrecision,
        valueInfoYPrecision,
        connectPoints,
        spacing,
        fontSize,
        valueInfoFontSize,
        xMilestones,
        yMilestones,
        zoomXStep,
        zoomYStep,
        xMaxValue,
        yMaxValue,
        interpolation,
        pointR: basePointR,
    }: PointChartProps) => {
        const containerRef = React.useRef<SVGElement>();

        const [xTextsWidths, setXTextsWidths] = React.useState<number[]>([]);
        const [yTextsWidths, setYTextsWidths] = React.useState<number[]>([]);

        const xMax = React.useMemo(() => xMaxValue ?? Math.max(...values.map(([x]) => x)), [values, xMaxValue]);
        const yMax = React.useMemo(() => yMaxValue ?? Math.max(...values.map(([_x, y]) => y)), [values, yMaxValue]);

        const divideOffset = divideLength / 2;

        const xOffset = React.useMemo(() => (yTextsWidths.length > 0 ? Math.max(...yTextsWidths) : 0) + spacing + divideOffset, [divideOffset, spacing, yTextsWidths]);
        const yTopOffset = fontSize / 2 + valueInfoFontSize * 2;
        const yBottomOffset = fontSize + spacing + divideOffset;

        const gridWidth = width - xOffset - (xTextsWidths[xTextsWidths.length - 1] ?? 0) / 2;
        const gridHeight = height - yBottomOffset - yTopOffset;

        const xOrigin = xOffset;
        const yOrigin = height - yBottomOffset;

        const xAxisPxRange: [number, number] = React.useMemo(() => [xOrigin, xOrigin + gridWidth], [xOrigin, gridWidth])
        const yAxisPxRange: [number, number] = React.useMemo(() => [yOrigin, yOrigin - gridHeight], [yOrigin, gridHeight])

        const { zoom, zoomValues } = useZoomer({ values, xOffset, xAxisBorderline: xAxisPxRange[1], xMax, yOffset: yTopOffset, yAxisBorderline: yOrigin, yMax, xStep: zoomXStep, yStep: zoomYStep })
        const interpolatedValue = React.useMemo(() => interpolation?.axis && interpolation?.value !== undefined ? getInterpolatedValue(interpolation.axis, interpolation.value, zoomValues.values) : undefined, [interpolation?.axis, interpolation?.value, zoomValues.values]);

        const pointRScale = (zoomValues.xMax / xMax + zoomValues.yMax / yMax) / 2
        const pointR = basePointR / pointRScale
        const interpolatedPointR = (interpolation?.pointR ?? 0) / pointRScale

        const [xDivides, xDividesValues, xDividesCoords] = React.useMemo(
            () =>
                createXDivides({
                    xOrigin,
                    yOrigin,
                    spacing,
                    fontSize,
                    divideOffset,
                    valueRange: [0, zoomValues.xMax],
                    steps: xSteps,
                    length: gridWidth,
                    textsWidths: xTextsWidths,
                    precision: xPrecision,
                }),
            [divideOffset, xTextsWidths, gridWidth, spacing, zoomValues, xPrecision, xSteps, yOrigin, fontSize, xOrigin]
        );

        const [yDivides, yDividesValues, yDividesCoords] = React.useMemo(
            () =>
                createYDivides({
                    xOrigin,
                    yOrigin,
                    divideOffset,
                    spacing,
                    fontSize,
                    valueRange: [0, zoomValues.yMax],
                    steps: ySteps,
                    length: gridHeight,
                    textsWidths: yTextsWidths,
                    precision: yPrecision,
                }),
            [divideOffset, yTextsWidths, gridHeight, spacing, xOrigin, zoomValues, yPrecision, ySteps, fontSize, yOrigin]
        );

        const xMilestoneLines = React.useMemo(() => {
            const createLine = (val: number, index: number, coord?: number) => createMilestoneLine({ val, index, axis: "x", origin: xOrigin, length: gridWidth, coords: { y1: yAxisPxRange[0], y2: yAxisPxRange[1] }, min: 0, max: zoomValues.xMax, coord })

            if (xMilestones === "values") {
                return zoomValues.values.map(([xVal], index) => createLine(xVal, index))
            } else if (xMilestones === "divides") {
                return xDividesCoords.map((coord, index) => createLine(xDividesValues[index], index, coord))
            } else if (Array.isArray(xMilestones)) {
                return xMilestones.map((val, index) => createLine(val, index))
            }

            return []
        }, [gridWidth, xMilestones, xOrigin, yAxisPxRange, zoomValues, xDividesValues, xDividesCoords])

        const yMilestoneLines = React.useMemo(() => {
            const createLine = (val: number, index: number, coord?: number) => createMilestoneLine({ val, index, axis: "y", origin: yOrigin, length: -gridHeight, coords: { x1: xAxisPxRange[0], x2: xAxisPxRange[1] }, min: 0, max: zoomValues.yMax, coord })

            if (yMilestones === "values") {
                return zoomValues.values.map(([_xVal, yVal], index) => createLine(yVal, index))
            } else if (yMilestones === "divides") {
                return yDividesCoords.map((coord, index) => createLine(yDividesValues[index], index, coord))
            } else if (Array.isArray(yMilestones)) {
                return yMilestones.map((val, index) => createLine(val, index))
            }

            return []
        }, [gridHeight, yMilestones, yOrigin, yDividesCoords, xAxisPxRange, zoomValues, yDividesValues])

        const { referenceLine, setReferenceLine } = useReferenceLine({ xBaseline: xOrigin, width: gridWidth });

        const {
            addValueInfoItem,
            removeValueInfoItem,
            replaceValueInfoItems,
            clearValueInfoItems,
            setAllValueInfoItems,
            valueInfo,
            valueInfoItemsRef,
            activateSelectionRect,
            deactivateSelectionRect,
            onSelectionRectResize,
            selectionRect,
            activeItems: activePoints,
            isItemActive: isPointActive,
        } = useValueInfo<PointChartItemInfo>({
            fontSize,
            divideOffset,
            spacing,
            xPrecision: valueInfoXPrecision,
            yPrecision: valueInfoYPrecision,
            infoFontSize: valueInfoFontSize,
            xBaseline: xOrigin,
            infoCreators: { single: valueInfoCreators.singlePoint, multiple: valueInfoCreators.multiplePoints },
        });

        const createPoint = React.useCallback(
            (xCoord: number, yCoord: number, xVal: number, yVal: number, index: number, type = PointType.Data) => {
                const r = type === PointType.Data ? pointR : interpolatedPointR
                const valueInfoItem: PointChartItemInfo = {
                    index,
                    coords: { x1: xCoord - r, x2: xCoord + r, y1: yCoord - r, y2: yCoord + r },
                    values: { x: xVal, y: yVal },
                };
                const isActive = isPointActive(index);

                valueInfoItemsRef.current.push(valueInfoItem);

                return (
                    <circle
                        key={`c${index}`}
                        className={`chart__item${isActive ? " chart__item--active" : ""} chart__point${isActive ? " chart__point--active" : ""}${type === PointType.Interpolated ? " chart__interpolated-point" : ""}`}
                        r={r}
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
                                if (activePoints.length > 1) {
                                    replaceValueInfoItems([valueInfoItem])
                                } else {
                                    isActive ? clearValueInfoItems() : replaceValueInfoItems([valueInfoItem]);
                                }
                            }
                        }}
                    />
                );
            },
            [
                isPointActive,
                valueInfoItemsRef,
                pointR,
                interpolatedPointR,
                setReferenceLine,
                removeValueInfoItem,
                addValueInfoItem,
                clearValueInfoItems,
                replaceValueInfoItems,
                activePoints
            ]
        );

        const plot = React.useCallback(() => {
            valueInfoItemsRef.current = [];

            return zoomValues.values.map(([xVal, yVal], i) => {
                const xCoord = getCoord(xOrigin, gridWidth, xVal, zoomValues.xMax)
                const yCoord = getCoord(yOrigin, -gridHeight, yVal, zoomValues.yMax)

                return createPoint(xCoord, yCoord, xVal, yVal, i);
            });
        }, [createPoint, gridHeight, gridWidth, valueInfoItemsRef, zoomValues, xOrigin, yOrigin]);

        const plotWithConnections = React.useCallback(() => {
            valueInfoItemsRef.current = [];

            let els: JSX.Element[] = [];

            for (let i = 0, prevCoords = { x: xOrigin, y: yOrigin }; i < zoomValues.values.length; i++) {
                const [xVal, yVal] = zoomValues.values[i];

                const coords = { x: getCoord(xOrigin, gridWidth, xVal, zoomValues.xMax), y: getCoord(yOrigin, -gridHeight, yVal, zoomValues.yMax) };

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
        }, [createPoint, gridHeight, gridWidth, valueInfoItemsRef, zoomValues, xOrigin, yOrigin]);

        const points = React.useMemo(() => {
            let points = connectPoints ? plotWithConnections() : plot()

            if (interpolatedValue !== undefined && interpolation?.value !== undefined) {
                const interpolatedPoint = createPoint(interpolation?.axis === "x" ? getCoord(xOrigin, gridWidth, interpolation.value, zoomValues.xMax) : getCoord(xOrigin, gridWidth, interpolatedValue, zoomValues.xMax), interpolation?.axis === "x" ? getCoord(yOrigin, -gridHeight, interpolatedValue, zoomValues.yMax) : getCoord(yOrigin, -gridHeight, interpolation.value, zoomValues.yMax), interpolation?.axis === "x" ? interpolation.value : interpolatedValue, interpolation?.axis === "x" ? interpolatedValue : interpolation.value, points.length, PointType.Interpolated)

                points.push(interpolatedPoint)
            }

            return points
        }, [connectPoints, plotWithConnections, plot, interpolatedValue, interpolation?.value, interpolation?.axis, createPoint, xOrigin, gridWidth, zoomValues.xMax, yOrigin, gridHeight, zoomValues.yMax]);

        const onKeyDown: React.KeyboardEventHandler<SVGSVGElement> = React.useCallback(
            e => {
                if (e.ctrlKey && e.keyCode === 65) {
                    e.preventDefault();
                    setAllValueInfoItems();
                }
            },
            [setAllValueInfoItems]
        );

        React.useEffect(() => {
            const container = containerRef.current;

            if (!container) return;

            const newXTextsWidths = getBoundingRects(container.querySelectorAll(".chart__divide-txt--x")).map(({ width }) => Math.round(width));

            if (!comparePrimitiveArrays(newXTextsWidths, xTextsWidths)) {
                setXTextsWidths(newXTextsWidths);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [xDivides]);

        React.useEffect(() => {
            const container = containerRef.current;

            if (!container) return;

            const newYTextsWidths = getBoundingRects(container.querySelectorAll(".chart__divide-txt--y")).map(({ width }) => Math.round(width));

            if (!comparePrimitiveArrays(newYTextsWidths, yTextsWidths)) {
                setYTextsWidths(newYTextsWidths);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [yDivides]);

        return (
            <svg
                ref={containerRef as React.LegacyRef<SVGSVGElement>}
                className="chart point-chart"
                style={{ outline: "none" }}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                tabIndex={-1}
                xmlns="http://www.w3.org/2000/svg"
                onClick={clearValueInfoItems}
                onKeyDown={onKeyDown}
                onMouseDown={activateSelectionRect}
                onMouseUp={deactivateSelectionRect}
                onMouseMove={onSelectionRectResize}
                onWheel={zoom}
            >
                <circle r={0} cx={xOrigin} cy={yOrigin} />

                {xMilestoneLines}
                {yMilestoneLines}

                <line className="chart__axis" x1={xAxisPxRange[0]} x2={xAxisPxRange[1]} y1={yOrigin} y2={yOrigin} />
                <line className="chart__axis" x1={xOrigin} x2={xOrigin} y1={yAxisPxRange[0]} y2={yAxisPxRange[1]} />

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
