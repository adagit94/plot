export enum FramerState {
  On,
  Off,
}

export type Renderer = (params: {
  values: TFramerValues;
  setState: (state: FramerState) => void;
}) => void;

export type TTrigger = () => void;

export type TFramerValues = {
  delta: number;
  frameDelta: number;
  lastTimestamp: number;
};

export type TFramerSettings = { renderer: Renderer; timescale?: number };

export const createFramer = ({ timescale, renderer }: TFramerSettings) => {
  let state = FramerState.Off;
  let values: TFramerValues = {
    delta: 0,
    frameDelta: 0,
    lastTimestamp: 0,
  };

  const getState = () => state;
  const setState = (framerState: FramerState) => {
    state = framerState;
  };

  const render = () => {
    const now = Date.now() * (timescale ?? 1);
    const elapsedTime = values.lastTimestamp === 0 ? 0 : now - values.lastTimestamp;

    values = {
      delta: values.delta + elapsedTime,
      frameDelta: elapsedTime,
      lastTimestamp: now,
    };

    if (state === FramerState.On) {
      renderer({ setState, values });
      window.requestAnimationFrame(render);
    }
  };

  const trigger: TTrigger = () => {
    state = FramerState.On;
    values = {
      delta: 0,
      frameDelta: 0,
      lastTimestamp: 0,
    };

    window.requestAnimationFrame(render);
  };

  return {
    trigger,
    getState,
    setState,
  };
};
