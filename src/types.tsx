export enum ChartFlag {
    Point,
    Pillar,
}

export type ChartProps = {
    width: number;
    height: number;
    xSteps: number;
    ySteps: number;
    divideLength: number;
    spacing: number;
    fontSize: number;
    xLimit?: number;
    yLimit?: number;
    xPrecision?: number;
    yPrecision?: number;
};
