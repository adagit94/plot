import * as React from "react";
import { useCallback, useMemo, useState, useRef } from "react";

type UseValueInfoParams = {
    xBaseline: number;
    divideOffset: number;
};

type ActiveItemInfo = {
    index: number;
    yVal: number;
    txt: string;
};

export const useValueInfo = ({ xBaseline, divideOffset }: UseValueInfoParams) => {
    const [activeItems, setActiveItems] = useState<ActiveItemInfo[]>([]);
    const itemsRef = useRef<ActiveItemInfo[]>([]);

    const getValues = useCallback(() => {
        const values = activeItems.map(item => item.yVal);

        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((acc, v) => acc + v) / values.length;
        const diff = values.length === 2 ? max - min : undefined;

        return {
            min,
            max,
            avg,
            diff,
        };
    }, [activeItems]);

    const getValuesStr = useCallback(() => {
        const values = getValues();

        return `Min: ${values.min}, Max: ${values.max}, Avg: ${values.avg}${values.diff !== undefined ? `, diff: ${values.diff}` : ""}`;
    }, [getValues]);

    const valueInfo = useMemo(() => {
        if (activeItems.length === 0) return null;

        let txt: string;

        switch (activeItems.length) {
            case 1:
                txt = activeItems[0].txt;
                break;

            default:
                txt = getValuesStr();
                break;
        }

        return (
            <text className="chart__value-info" x={xBaseline + divideOffset} y={0} dominantBaseline={"hanging"}>
                {txt}
            </text>
        );
    }, [divideOffset, xBaseline, getValuesStr, activeItems]);

    const addValueInfoItem = useCallback((itemInfo: ActiveItemInfo) => setActiveItems(items => [...items, itemInfo]), []);
    const removeValueInfoItem = useCallback((itemIndex: number) => setActiveItems(items => items.filter(item => item.index !== itemIndex)), []);
    const replaceValueInfoItems = useCallback((itemsInfos: ActiveItemInfo[]) => setActiveItems(itemsInfos), []);
    const clearValueInfoItems = useCallback(() => setActiveItems([]), []);
    const setAllValueInfoItems = useCallback(() => setActiveItems(itemsRef.current), []);

    const isItemActive = useCallback((index: number) => activeItems.some(item => item.index === index), [activeItems]);

    return {
        addValueInfoItem,
        removeValueInfoItem,
        replaceValueInfoItems,
        clearValueInfoItems,
        setAllValueInfoItems,
        isItemActive,
        valueInfo,
        valueInfoItemsRef: itemsRef,
    };
};
