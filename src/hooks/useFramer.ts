import { useMemo, useState } from "react";
import { createFramer, TFramerValues } from "../framer";

// type UseFramerSettings = TFramerSettings;

// {}: UseFramerSettings
export default function useFramer() {
  const [values, setValues] = useState<TFramerValues>();

  const trigger = useMemo(() => createFramer({ renderer: setValues }), []);

  return { trigger, values };
}
