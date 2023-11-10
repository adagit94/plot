import * as React from "react";
import { useCallback, useMemo, useState, useRef } from "react";

type ItemInfoBase = {
    index: number;
    coords: {
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    };
};

export type PointChartItemInfo = ItemInfoBase & {
    values: {
        x: number;
        y: number;
    };
};

export type PillarChartItemInfo = ItemInfoBase & {
    values: {
        x1: number;
        x2: number;
        y: number;
    };
};

type ItemInfo = PointChartItemInfo | PillarChartItemInfo;

type SelectionRect = {
    active: boolean;
    origin?: { x: number; y: number };
    rect?: JSX.Element;
};

type UseValueInfoParams<T> = {
    xBaseline: number;
    divideOffset: number;
    spacing: number;
    fontSize: number;
    infoCreators: {
        single: (item: T, xOffset: number, fontSize: number) => React.ReactNode;
        multiple: (items: T[], xOffset: number, fontSize: number) => React.ReactNode;
    };
};

export const useValueInfo = <T extends ItemInfo>({ xBaseline, divideOffset, spacing, fontSize, infoCreators }: UseValueInfoParams<T>) => {
    const [activeItems, setActiveItems] = useState<T[]>([]);
    const itemsRef = useRef<T[]>([]);

    const valueInfo = useMemo(() => {
        if (activeItems.length === 0) return null;

        const xOffset = xBaseline + divideOffset + spacing;
        let txt: React.ReactNode;

        switch (activeItems.length) {
            case 1:
                txt = infoCreators.single(activeItems[0], xOffset, fontSize);
                break;

            default:
                txt = infoCreators.multiple(activeItems, xOffset, fontSize);
                break;
        }

        return (
            <text className="chart__value-info" x={xOffset} y={0} dominantBaseline={"hanging"}>
                {txt}
            </text>
        );
    }, [divideOffset, xBaseline, activeItems, infoCreators, spacing, fontSize]);

    const addItem = useCallback((itemInfo: T) => setActiveItems(items => [...items, itemInfo]), []);
    const removeItem = useCallback((itemIndex: number) => setActiveItems(items => items.filter(item => item.index !== itemIndex)), []);
    const replaceItems = useCallback((itemsInfos: T[]) => setActiveItems(itemsInfos), []);
    const clearItems = useCallback(() => setActiveItems([]), []);
    const setAllItems = useCallback(() => setActiveItems(itemsRef.current), []);
    const isItemActive = useCallback((index: number) => activeItems.some(item => item.index === index), [activeItems]);

    const [selectionRect, setSelectionRect] = useState<SelectionRect>({ active: false });

    const activateSelectionRect: React.MouseEventHandler<SVGSVGElement> = useCallback(e => {
        setSelectionRect({
            active: true,
            origin: {
                x: e.clientX,
                y: e.clientY,
            },
        });
    }, []);

    const deactivateSelectionRect: React.MouseEventHandler<SVGSVGElement> = useCallback(() => {
        setSelectionRect({ active: false });
    }, []);

    const onSelectionRectResize: React.MouseEventHandler<SVGSVGElement> = useCallback(
        e => {
            e.preventDefault();

            if (!selectionRect.active || !selectionRect.origin) return;

            const selectionRectHigherX = Math.max(selectionRect.origin.x, e.clientX);
            const selectionRectLowerX = Math.min(selectionRect.origin.x, e.clientX);
            const selectionRectHigherY = Math.max(selectionRect.origin.y, e.clientY);
            const selectionRectLowerY = Math.min(selectionRect.origin.y, e.clientY);

            let itemsInRange: T[] = [];

            for (const item of itemsRef.current) {
                const { x1, x2, y1, y2 } = item.coords;

                if (
                    !(
                        (x1 <= selectionRectLowerX && x2 >= selectionRectHigherX) ||
                        (x1 >= selectionRectLowerX && x1 <= selectionRectHigherX) ||
                        (x2 >= selectionRectLowerX && x2 <= selectionRectHigherX)
                    )
                ) {
                    continue;
                }

                if (
                    !(
                        (y1 <= selectionRectLowerY && y2 >= selectionRectHigherY) ||
                        (y1 >= selectionRectLowerY && y1 <= selectionRectHigherY) ||
                        (y2 >= selectionRectLowerY && y2 <= selectionRectHigherY)
                    )
                ) {
                    continue;
                }

                itemsInRange.push(item);
            }

            setSelectionRect(s => ({
                ...s,
                rect: (
                    <rect
                        className="chart__selection-rect"
                        x={selectionRectLowerX}
                        width={selectionRectHigherX - selectionRectLowerX}
                        y={selectionRectLowerY}
                        height={selectionRectHigherY - selectionRectLowerY}
                        fill="transparent"
                    />
                ),
            }));
            replaceItems(itemsInRange);
        },
        [replaceItems, selectionRect.active, selectionRect.origin]
    );

    return {
        addValueInfoItem: addItem,
        removeValueInfoItem: removeItem,
        replaceValueInfoItems: replaceItems,
        clearValueInfoItems: clearItems,
        setAllValueInfoItems: setAllItems,
        isItemActive,
        activateSelectionRect,
        deactivateSelectionRect,
        onSelectionRectResize,
        valueInfo,
        valueInfoItemsRef: itemsRef,
        selectionRect: selectionRect.rect,
    };
};

type Values = {
    min: number;
    max: number;
    sum: number;
    avg: number;
    diff: number | undefined;
};

const computeValues = (values: number[]): Values => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v);
    const avg = sum / values.length;
    const diff = values.length === 2 ? max - min : undefined;

    return {
        min,
        max,
        sum,
        avg,
        diff,
    };
};

export const valueInfoCreators = {
    singlePoint: (item: PointChartItemInfo, xOffset: number, fontSize: number) => [
        <tspan x={xOffset} dominantBaseline={"hanging"}>{`x: ${item.values.x}`}</tspan>,
        <tspan x={xOffset} dy={fontSize} dominantBaseline={"hanging"}>{`y: ${item.values.y}`}</tspan>,
    ],
    multiplePoints: (items: PointChartItemInfo[]) => {
        const values = computeValues(items.map(item => item.values.y));

        return `y: Min: ${values.min}, Max: ${values.max}, Avg: ${values.avg}, Sum: ${values.sum}${values.diff !== undefined ? `, diff: ${values.diff}` : ""}`;
    },
    singleInterval: (item: PillarChartItemInfo, xOffset: number, fontSize: number) => [
        <tspan x={xOffset} dominantBaseline={"hanging"}>{`x: span: ${item.values.x1} - ${item.values.x2}, length: ${
            item.values.x2 - item.values.x1
        }`}</tspan>,
        <tspan x={xOffset} dy={fontSize} dominantBaseline={"hanging"}>{`y: ${item.values.y}`}</tspan>,
    ],
    multipleIntervals: (items: PillarChartItemInfo[], xOffset: number, fontSize: number) => {
        const intervalsLengths = computeValues(items.map(item => item.values.x2 - item.values.x1));
        const intervalsTxt = `x: Min: ${intervalsLengths.min}, Max: ${intervalsLengths.max}, Avg: ${intervalsLengths.avg}, Sum: ${
            intervalsLengths.sum
        }${intervalsLengths.diff !== undefined ? `, diff: ${intervalsLengths.diff}` : ""}`;

        const values = computeValues(items.map(item => item.values.y));
        const valuesTxt = `y: Min: ${values.min}, Max: ${values.max}, Avg: ${values.avg}, Sum: ${values.sum}${values.diff !== undefined ? `, diff: ${values.diff}` : ""}`;

        return [
            <tspan x={xOffset} dominantBaseline={"hanging"}>
                {intervalsTxt}
            </tspan>,
            <tspan x={xOffset} dy={fontSize} dominantBaseline={"hanging"}>
                {valuesTxt}
            </tspan>,
        ];
    },
};
