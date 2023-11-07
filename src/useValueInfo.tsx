import * as React from "react";
import { useCallback, useMemo, useState, useRef } from "react";

type UseValueInfoParams = {
    xBaseline: number;
    divideOffset: number;
};

type ItemInfo = {
    index: number;
    yVal: number;
    coords: {
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    };
    txt: string;
};

type SelectionRect = {
    active: boolean;
    origin?: { x: number; y: number };
    rect?: JSX.Element;
};

export const useValueInfo = ({ xBaseline, divideOffset }: UseValueInfoParams) => {
    const [activeItems, setActiveItems] = useState<ItemInfo[]>([]);
    const itemsRef = useRef<ItemInfo[]>([]);

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

    const addItem = useCallback((itemInfo: ItemInfo) => setActiveItems(items => [...items, itemInfo]), []);
    const removeItem = useCallback((itemIndex: number) => setActiveItems(items => items.filter(item => item.index !== itemIndex)), []);
    const replaceItems = useCallback((itemsInfos: ItemInfo[]) => setActiveItems(itemsInfos), []);
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

            let itemsInRange: ItemInfo[] = [];

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
