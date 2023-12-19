import * as React from "react";
import { getBoundingRects, comparePrimitiveArrays } from "../../utils";

type CircularChartPoint = { txt: string; value?: number; connections?: number[]; classNameId?: string };
type CircularChartProps = { size: number; fontSize: number; maxItemR: number; points: CircularChartPoint[]; angleOffset?: number };

export const CircularChart = React.memo(({ size, fontSize, maxItemR, points, angleOffset }: CircularChartProps) => {
    const [activePoint, setActivePoint] = React.useState<{ index: number; connections?: number[] }>();
    const [textsWidths, setTextsWidths] = React.useState<number[]>([]);

    const containerRef = React.useRef<SVGElement>();

    const r = size / 2 - maxItemR;
    const maxValue = React.useMemo(() => Math.max(...points.map(point => point.value ?? 0)), [points]);

    const getPointTxts = React.useCallback(
        (point: CircularChartPoint, index: number, x: number, y: number) => {
            const txtWidth = textsWidths[index * 2];
            const valueTxtWidth = textsWidths[index * 2 + 1];

            return (
                <>
                    <text
                        className="chart__point-txt"
                        fontSize={fontSize}
                        x={txtWidth !== undefined ? x - txtWidth / 2 : undefined}
                        y={valueTxtWidth > 0 ? y - fontSize / 8 : y}
                        dominantBaseline={valueTxtWidth ? "auto" : "middle"}
                    >
                        {point.txt}
                    </text>

                    <text
                        className="chart__point-txt"
                        visibility={valueTxtWidth === 0 ? "hidden" : "visible"}
                        fontSize={fontSize}
                        x={valueTxtWidth !== undefined ? x - valueTxtWidth / 2 : undefined}
                        y={y + fontSize / 8}
                        dominantBaseline={"hanging"}
                    >
                        {point.value ?? ""}
                    </text>
                </>
            );
        },
        [fontSize, textsWidths]
    );

    const els = React.useMemo(() => {
        let pointsEls: JSX.Element[] = [];
        let coords: { x: number; y: number }[] = [];

        const angleStep = (Math.PI * 2) / points.length;

        for (let i = 0, angle = -Math.PI / 2 + (angleOffset ?? 0); i < points.length; i++, angle += angleStep) {
            const p = points[i];
            const pR = p.value === undefined ? maxItemR : maxItemR * (p.value / maxValue);
            const x = size / 2 + Math.cos(angle) * r;
            const y = size / 2 + Math.sin(angle) * r;
            const isActive = activePoint && activePoint.index === i;

            pointsEls.push(
                <circle
                    key={`p${i}`}
                    className={`chart__point${isActive ? ` chart__point--active` : ""}${p.classNameId ? ` chart__point--${p.classNameId}` : ""}`}
                    cx={x}
                    cy={y}
                    r={pR}
                    shapeRendering={"geometricPrecision"}
                    onMouseEnter={() => setActivePoint({ index: i, connections: p.connections })}
                    onMouseLeave={() => setActivePoint(undefined)}
                />,
                getPointTxts(p, i, x, y)
            );
            coords.push({ x, y });
        }

        let linesEls: JSX.Element[] = [];

        for (let i = 0; i < points.length; i++) {
            const p = points[i];

            if (p.connections === undefined || p.connections.length === 0) continue;

            const isActive = activePoint && i === activePoint.index;
            const { x: xFrom, y: yFrom } = coords[i];

            for (let j = 0; j < p.connections.length; j++) {
                const connectionIndex = p.connections[j];
                const { x: xTo, y: yTo } = coords[connectionIndex];

                linesEls[isActive ? "push" : "unshift"](
                    <line
                        key={`l${i}${j}`}
                        className={`chart__line${isActive ? " chart__line--active" : ""}${p.classNameId ? ` chart__line--${p.classNameId}` : ""}`}
                        x1={xFrom}
                        y1={yFrom}
                        x2={xTo}
                        y2={yTo}
                        shapeRendering={"geometricPrecision"}
                    />
                );
            }
        }

        return [...linesEls, ...pointsEls];
    }, [activePoint, angleOffset, getPointTxts, maxItemR, maxValue, points, r, size]);

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
            className="chart circular-chart"
            style={{ display: textsWidths.length > 0 ? "block" : "none" }}
            ref={containerRef as React.LegacyRef<SVGSVGElement>}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {els}
        </svg>
    );
});
