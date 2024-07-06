import * as React from "react";
import { useCallback, useMemo, useState, useRef } from "react";
import { useSelectionRect } from "./useSelectionRect";

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

export type ItemInfo = PointChartItemInfo | PillarChartItemInfo;

type UseValueInfoParams<T> = {
    xBaseline: number;
    divideOffset: number;
    spacing: number;
    fontSize: number;
    infoFontSize: number;
    infoCreators: {
        single: (item: T, xOffset: number, fontSize: number, xPrecision?: number, yPrecision?: number) => React.ReactNode;
        multiple: (items: T[], xPrecision: number | undefined, yPrecision: number | undefined, xOffset: number, fontSize: number) => React.ReactNode;
    };
    xPrecision?: number
    yPrecision?: number
};

export const useValueInfo = <T extends ItemInfo>({ xBaseline, divideOffset, spacing, fontSize, infoFontSize, infoCreators, xPrecision, yPrecision }: UseValueInfoParams<T>) => {
    const [activeItems, setActiveItems] = useState<T[]>([]);
    const itemsRef = useRef<T[]>([]);

    const valueInfo = useMemo(() => {
        if (activeItems.length === 0) return null;

        const xOffset = xBaseline + divideOffset + spacing;
        let txt: React.ReactNode;

        switch (activeItems.length) {
            case 1:
                txt = infoCreators.single(activeItems[0], xOffset, fontSize, xPrecision, yPrecision);
                break;

            default:
                txt = infoCreators.multiple(activeItems, xPrecision, yPrecision, xOffset, fontSize);
                break;
        }

        return (
            <text className="chart__value-info" style={{ "userSelect": "none" }} x={xOffset} y={0} fontSize={infoFontSize} dominantBaseline={"hanging"}>
                {txt}
            </text>
        );
    }, [divideOffset, xBaseline, activeItems, infoCreators, spacing, fontSize, infoFontSize, xPrecision, yPrecision]);

    const addItem = useCallback((itemInfo: T) => setActiveItems(items => [...items, itemInfo]), []);
    const removeItem = useCallback((itemIndex: number) => setActiveItems(items => items.filter(item => item.index !== itemIndex)), []);
    const replaceItems = useCallback((itemsInfos: T[]) => setActiveItems(itemsInfos), []);
    const clearItems = useCallback(() => setActiveItems([]), []);
    const setAllItems = useCallback(() => setActiveItems(itemsRef.current), []);
    const isItemActive = useCallback((index: number) => activeItems.some(item => item.index === index), [activeItems]);

    const selectionRectData  = useSelectionRect({ itemsRef, replaceItems });

    return {
        ...selectionRectData,
        activeItems,
        isItemActive,
        valueInfo,
        addValueInfoItem: addItem,
        removeValueInfoItem: removeItem,
        replaceValueInfoItems: replaceItems,
        clearValueInfoItems: clearItems,
        setAllValueInfoItems: setAllItems,
        valueInfoItemsRef: itemsRef,
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
    singlePoint: (item: PointChartItemInfo, xOffset: number, fontSize: number, xPrecision?: number, yPrecision?: number) => [
        <tspan key={0} x={xOffset} dominantBaseline={"hanging"}>{`x: ${item.values.x.toFixed(xPrecision)}`}</tspan>,
        <tspan key={1} x={xOffset} dy={fontSize} dominantBaseline={"hanging"}>{`y: ${item.values.y.toFixed(yPrecision)}`}</tspan>,
    ],
    multiplePoints: (items: PointChartItemInfo[], xPrecision: number | undefined, yPrecision: number | undefined) => {
        const values = computeValues(items.map(item => item.values.y));

        return `y: Min: ${values.min.toFixed(yPrecision)}, Max: ${values.max.toFixed(yPrecision)}, Avg: ${values.avg.toFixed(yPrecision)}, Sum: ${values.sum.toFixed(yPrecision)}${values.diff !== undefined ? `, diff: ${values.diff}` : ""}`;
    },
    singleInterval: (item: PillarChartItemInfo, xOffset: number, fontSize: number, xPrecision?: number, yPrecision?: number) => [
        <tspan key={0} x={xOffset} dominantBaseline={"hanging"}>{`x: span: ${item.values.x1.toFixed(xPrecision)} - ${item.values.x2.toFixed(xPrecision)}, length: ${(item.values.x2 - item.values.x1).toFixed(xPrecision)
            }`}</tspan>,
        <tspan key={1} x={xOffset} dy={fontSize} dominantBaseline={"hanging"}>{`y: ${item.values.y.toFixed(yPrecision)}`}</tspan>,
    ],
    multipleIntervals: (items: PillarChartItemInfo[], xPrecision: number | undefined, yPrecision: number | undefined, xOffset: number, fontSize: number) => {
        const intervalsLengths = computeValues(items.map(item => item.values.x2 - item.values.x1));
        const intervalsTxt = `x: Min: ${intervalsLengths.min.toFixed(xPrecision)}, Max: ${intervalsLengths.max.toFixed(xPrecision)}, Avg: ${intervalsLengths.avg.toFixed(xPrecision)}, Sum: ${intervalsLengths.sum.toFixed(xPrecision)
            }${intervalsLengths.diff !== undefined ? `, diff: ${intervalsLengths.diff.toFixed(xPrecision)}` : ""}`;

        const values = computeValues(items.map(item => item.values.y));
        const valuesTxt = `y: Min: ${values.min.toFixed(yPrecision)}, Max: ${values.max.toFixed(yPrecision)}, Avg: ${values.avg.toFixed(yPrecision)}, Sum: ${values.sum.toFixed(yPrecision)}${values.diff !== undefined ? `, diff: ${values.diff.toFixed(yPrecision)}` : ""}`;

        return [
            <tspan key={0} x={xOffset} dominantBaseline={"hanging"}>
                {intervalsTxt}
            </tspan>,
            <tspan key={1} x={xOffset} dy={fontSize} dominantBaseline={"hanging"}>
                {valuesTxt}
            </tspan>,
        ];
    },
};
