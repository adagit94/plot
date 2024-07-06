import * as React from "react";
import { useCallback, useState } from "react";
import { ItemInfo } from "./useValueInfo";

type SelectionRect = {
    active: boolean;
    origin?: { x: number; y: number };
    rect?: JSX.Element;
};

type UseSelectionRectParams<T> = {
    itemsRef: React.MutableRefObject<T[]>
    replaceItems: (items: T[]) => void
};

export const useSelectionRect = <T extends ItemInfo>({ itemsRef, replaceItems }: UseSelectionRectParams<T>) => {
    const [selectionRect, setSelectionRect] = useState<SelectionRect>({ active: false });

    const onSelectionRectResize: React.MouseEventHandler<SVGSVGElement> = useCallback(
        e => {
            if (!selectionRect.active || !selectionRect.origin) return;

            e.preventDefault();

            const selectionRectHigherX = Math.max(selectionRect.origin.x, e.nativeEvent.offsetX);
            const selectionRectLowerX = Math.min(selectionRect.origin.x, e.nativeEvent.offsetX);
            const selectionRectHigherY = Math.max(selectionRect.origin.y, e.nativeEvent.offsetY);
            const selectionRectLowerY = Math.min(selectionRect.origin.y, e.nativeEvent.offsetY);

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
        [replaceItems, selectionRect.active, selectionRect.origin, itemsRef]
    );

    const activateSelectionRect: React.MouseEventHandler<SVGSVGElement> = useCallback(e => {
        if (e.button !== 0) return

        setSelectionRect({
            active: true,
            origin: {
                x: e.nativeEvent.offsetX,
                y: e.nativeEvent.offsetY,
            },
        });
    }, []);

    const deactivateSelectionRect: React.MouseEventHandler<SVGSVGElement> = useCallback((e) => {
        if (e.button !== 0) return

        setSelectionRect({ active: false });
    }, []);

    return {
        activateSelectionRect,
        deactivateSelectionRect,
        onSelectionRectResize,
        selectionRect: selectionRect.rect,
    };
};
