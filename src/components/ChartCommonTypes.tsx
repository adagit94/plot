export enum ChartFlag {
    Point,
    Pillar,
}

export type Milestones = number[] | "values" | "divides"

export type AxesValues = [number, number][]

export type ChartProps = {
    width: number;
    height: number;
    xSteps: number;
    ySteps: number;
    divideLength: number;
    spacing: number;
    fontSize: number;
    valueInfoFontSize: number;
    zoomXStep: number
    zoomYStep: number
    xPrecision?: number;
    yPrecision?: number;
    valueInfoXPrecision?: number;
    valueInfoYPrecision?: number;
    xMilestones?: Milestones
    yMilestones?: Milestones
    xMaxValue?: number
    yMaxValue?: number
};
