export type ChartVariant = "point" | "pillar"

export type ChartProps = {
    width: number;
    height: number;
    xSteps: number;
    ySteps: number;
    divideLength: number;
    fontSize: number;
    spacing: number
    xLimit?: number;
    yLimit?: number;
    xPrecision?: number;
    yPrecision?: number;
};