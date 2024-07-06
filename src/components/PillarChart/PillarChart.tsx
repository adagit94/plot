import * as React from "react";
import { ChartProps } from "../ChartCommonTypes";
import { useReferenceLine } from "../../hooks/useReferenceLine";
import { PillarChartItemInfo, useValueInfo, valueInfoCreators } from "../../hooks/useValueInfo";
import { comparePrimitiveArrays, createXDivides, createYDivides, getBoundingRects } from "../../utils";

type PillarChartProps = ChartProps & {
    values: [[number, number], number][]; // [[x1, x2], y]; values themself, not coordinates; x1 and x2 defines interval on x axis
};

export const PillarChart = React.memo(
    ({ width, height, xLimit, xSteps, ySteps, yLimit, values, fontSize, divideLength, xPrecision, yPrecision, spacing }: PillarChartProps) => {
        const [xTextsWidths, setXTextsWidths] = React.useState<number[]>([]);
        const [yTextsWidths, setYTextsWidths] = React.useState<number[]>([]);

        const containerRef = React.useRef<SVGElement>();

        const xMax = React.useMemo(() => xLimit ?? Math.max(...values.map(([[_x1, x2]]) => x2)), [xLimit, values]);
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
                    yOrigin: yBaseline,
                    divideOffset,
                    xOrigin: xBaseline,
                    fontSize,
                    precision: xPrecision,
                    spacing,
                    textsWidths: xTextsWidths,
                }),
            [divideOffset, fontSize, gridWidth, spacing, xBaseline, xMax, xPrecision, xSteps, yBaseline, xTextsWidths]
        );

        const yDivides = React.useMemo(
            () =>
                createYDivides({
                    max: yMax,
                    steps: ySteps,
                    length: gridHeight,
                    yOrigin: yBaseline,
                    divideOffset,
                    xOrigin: xBaseline,
                    fontSize,
                    precision: yPrecision,
                    spacing,
                    textsWidths: yTextsWidths,
                }),
            [divideOffset, fontSize, gridHeight, spacing, xBaseline, yBaseline, yMax, yPrecision, ySteps, yTextsWidths]
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
        } = useValueInfo<PillarChartItemInfo>({
            xBaseline,
            divideOffset,
            spacing,
            fontSize,
            infoCreators: { single: valueInfoCreators.singleInterval, multiple: valueInfoCreators.multipleIntervals },
        });

        const plot = React.useCallback(() => {
            valueInfoItemsRef.current = [];

            return values.map(([[x1Val, x2Val], yVal], index) => {
                const x1Coord = xBaseline + gridWidth * (x1Val / xMax);
                const x2Coord = xBaseline + gridWidth * (x2Val / xMax);
                const yCoord = yBaseline - gridHeight * (yVal / yMax);

                const valueInfoItem: PillarChartItemInfo = {
                    index,
                    coords: { x1: x1Coord, x2: x2Coord, y1: yCoord, y2: yBaseline },
                    values: { x1: x1Val, x2: x2Val, y: yVal },
                };
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
                className="chart pillar-chart"
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

                {rectangles}

                {selectionRect}

                {valueInfo}
            </svg>
        );
    }
);
