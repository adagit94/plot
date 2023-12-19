import * as React from "react";
import { comparePrimitiveArrays, getBoundingRects } from "../../utils";

type Item = {
    txt: string;
    connections?: number[]; // array of indices on opposite side
};

type Sides = [Item[], Item[]];

type ConnectedSidesProps = {
    width: number;
    height: number;
    spacing: number;
    fontSize: number;
    pointR: number;
    sides: Sides;
};

export const ConnectedSides = React.memo(({ width, height, spacing, fontSize, pointR, sides }: ConnectedSidesProps) => {
    const [activePoint, setActivePoint] = React.useState<{ side: number; point: number; connections: number[] | undefined }>();
    const [textsWidths, setTextsWidths] = React.useState<number[]>([]);

    const containerRef = React.useRef<SVGElement>();

    const pointsXOffsets = React.useMemo(
        () => [(maxTextWidth: number) => maxTextWidth + spacing + pointR, (maxTextWidth: number) => width - maxTextWidth - spacing - pointR],
        [pointR, spacing, width]
    );

    const txtsXOffsets = React.useMemo(
        () => [(maxTextWidth: number, txtWidth: number) => maxTextWidth - txtWidth, (maxTextWidth: number) => width - maxTextWidth],
        [width]
    );

    const els = React.useMemo(() => {
        let points: JSX.Element[] = [];
        let coords: [{ x: number; y: number }[], { x: number; y: number }[]] = [[], []];
        let itemIndex = 0;

        for (let i = 0; i < sides.length; i++) {
            const side = sides[i];
            const availableSpace = height - pointR * 2 * sides.length;
            const offsetStep = availableSpace / (side.length + 1);
            const maxTxtWidth =
                textsWidths.length > 0
                    ? Math.max(...(i === 0 ? textsWidths.slice(0, side.length) : textsWidths.slice(sides[0].length, textsWidths.length)))
                    : 0;

            for (let j = 0, offset = offsetStep; j < side.length; j++, offset += offsetStep) {
                const item = side[j];
                const itemCoords = (coords[i][j] = { x: pointsXOffsets[i](maxTxtWidth), y: offset });
                const { txt, connections } = item;
                const isActive = activePoint && activePoint.side === i && activePoint.point === j;

                const point = (
                    <circle
                        key={`p${i}${j}`}
                        className={`connected-sides__point connected-sides__point--side-${i}${isActive ? ` connected-sides__point--active` : ""}`}
                        cx={itemCoords.x}
                        cy={itemCoords.y}
                        r={pointR}
                        shapeRendering={"geometricPrecision"}
                        onMouseEnter={() => setActivePoint({ side: i, point: j, connections })}
                        onMouseLeave={() => setActivePoint(undefined)}
                    />
                );

                const text = (
                    <text
                        key={`t${i}${j}`}
                        className="connected-sides__txt"
                        x={txtsXOffsets[i](maxTxtWidth, textsWidths[itemIndex] ?? 0)}
                        y={offset}
                        fontSize={fontSize}
                        dominantBaseline={"middle"}
                    >
                        {txt}
                    </text>
                );

                points.push(point, text);
                itemIndex++;
            }
        }

        let lines: JSX.Element[] = []
        
        for (let i = 0; i < sides.length; i++) {
            const items = sides[i];
            const currentSideCoords = coords[i];
            const oppositeSideCoords = coords[sides.length - 1 - i];

            for (let j = 0; j < items.length; j++) {
                const { connections } = items[j];

                if (connections === undefined) continue;

                const { x: xFrom, y: yFrom } = currentSideCoords[j];
                const isActive = activePoint && activePoint.side === i && activePoint.point === j;

                for (let k = 0; k < connections.length; k++) {
                    const destIndex = connections[k];
                    const destCoords = oppositeSideCoords[destIndex];

                    if (destCoords === undefined) continue;

                    const { x: xTo, y: yTo } = destCoords;

                    lines[isActive ? "push" : "unshift"](
                        <line
                            key={`l${i}${j}${k}`}
                            className={`connected-sides__line connected-sides__line--side-${i}${isActive ? " connected-sides__line--active" : ""}`}
                            x1={xFrom}
                            y1={yFrom}
                            x2={xTo}
                            y2={yTo}
                            shapeRendering={"geometricPrecision"}
                        />
                    );
                }
            }
        }

        return [...lines, ...points];
    }, [sides, height, pointR, pointsXOffsets, activePoint, txtsXOffsets, textsWidths, fontSize]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const widths = getBoundingRects(container.querySelectorAll("text")).map(({ width }) => width);

        if (!comparePrimitiveArrays(widths, textsWidths)) {
            setTextsWidths(widths);
        }
    });

    return (
        <svg
            className="connected-sides"
            style={{ display: textsWidths.length > 0 ? "block" : "none" }}
            ref={containerRef as React.LegacyRef<SVGSVGElement>}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {els}
        </svg>
    );
});
