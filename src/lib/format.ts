// How the screens write a figure in the current unit system: table cells,
// readout values, specs. The NumberFields convert for themselves; this is the
// same conversion for figures that are only shown, so a figure in a table
// changes with the unit toggle exactly as a field does. Values come in in the
// metric base unit, always.

import type { UnitSystem } from "@livetools/ui";

export type Quantity = "length" | "speed" | "feedPerTooth" | "feed" | "rotation";

type Spec = { unit: string; decimals: number; factor: number };

const MM_PER_INCH = 25.4;
const SFM_PER_M_MIN = 3.28084;

const UNITS: Readonly<Record<Quantity, Readonly<Record<UnitSystem, Spec>>>> = {
  length: {
    metric: { unit: "mm", decimals: 2, factor: 1 },
    imperial: { unit: "in", decimals: 4, factor: 1 / MM_PER_INCH },
  },
  speed: {
    metric: { unit: "m/min", decimals: 0, factor: 1 },
    imperial: { unit: "SFM", decimals: 0, factor: SFM_PER_M_MIN },
  },
  feedPerTooth: {
    metric: { unit: "mm/tooth", decimals: 4, factor: 1 },
    imperial: { unit: "in/tooth", decimals: 5, factor: 1 / MM_PER_INCH },
  },
  feed: {
    metric: { unit: "mm/min", decimals: 0, factor: 1 },
    imperial: { unit: "in/min", decimals: 1, factor: 1 / MM_PER_INCH },
  },
  rotation: {
    metric: { unit: "rpm", decimals: 0, factor: 1 },
    imperial: { unit: "rpm", decimals: 0, factor: 1 },
  },
};

/** The unit label a quantity shows in, in this unit system. The same labels the NumberFields show. */
export function unitOf(quantity: Quantity, system: UnitSystem): string {
  return UNITS[quantity][system].unit;
}

/** The figure alone, converted and rounded, with thousands grouped: "12,000". */
export function formatFigure(value: number, quantity: Quantity, system: UnitSystem, decimals?: number): string {
  const spec = UNITS[quantity][system];
  const places = decimals ?? spec.decimals;
  return (value * spec.factor).toLocaleString("en-NZ", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

/** The figure and its unit, joined by a no-break space so they never part at a line end: "10.00 mm". */
export function formatQuantity(value: number, quantity: Quantity, system: UnitSystem, decimals?: number): string {
  return `${formatFigure(value, quantity, system, decimals)} ${unitOf(quantity, system)}`;
}
