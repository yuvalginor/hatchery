// The Android back gesture closes one thing at a time, the topmost first. The app lists what can be open, in order,
// with setBackLayers: for example a menu inside a sheet, a popup, a sheet, then a drill-down view.
// handleBack returns false when nothing was open, and the Android glue then leaves the app (src/native/index.ts).
// This file is in the web bundle on purpose: a browser never calls it, and it holds no native code.
export type Layer = { open: () => boolean; close: () => void };

export function back(layers: Layer[]): boolean {
  const top = layers.find((layer) => layer.open());
  top?.close();
  return top !== undefined;
}

let layers: () => Layer[] = () => [];

// Call it once the screen exists. The function is asked again on every press, so layers can come and go.
export function setBackLayers(list: () => Layer[]): void {
  layers = list;
}

export const handleBack = (): boolean => back(layers());
