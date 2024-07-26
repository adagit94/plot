export type Renderer = (values: TFramerValues) => void

export type TFramerValues = {
    delta: number,
    frameDelta: number,
    lastTimestamp: number,
}

export type TFramerSettings = { renderer: Renderer, timescale?: number }

export const createFramer = ({ timescale, renderer }: TFramerSettings) => {
    let anim = true
    
    let values: TFramerValues = {
        delta: 0,
        frameDelta: 0,
        lastTimestamp: 0,
    }

    const render = () => {
        const now = Date.now() * (timescale ?? 1)
        const elapsedTime = values.lastTimestamp === 0 ? 0 : now - values.lastTimestamp

        values = {
            delta: values.delta + elapsedTime,
            frameDelta: elapsedTime,
            lastTimestamp: now,
        }
        
        renderer(values)

        if (anim) window.requestAnimationFrame(render)
    }

    const trigger = (animate = true) => {
        anim = animate
        
        values = {
            delta: 0,
            frameDelta: 0,
            lastTimestamp: 0,
        }

        window.requestAnimationFrame(render)

        if (!animate) return trigger
        
        return () => {
            anim = false

            return trigger
        }
    }

    return trigger
}
