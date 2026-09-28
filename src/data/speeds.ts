// Cutting data for the Speeds screen. Example figures, not taken from a
// catalogue: a default cutting speed and feed per tooth per material, and
// each supplier's recommended cutting speed for it. Speeds in m/min, feed
// per tooth in mm, the metric base units the fields hold.

import type { Supplier } from "./tools";

export type Material = "steel" | "stainless" | "cast-iron" | "aluminium";

export type MaterialData = {
  value: Material;
  label: string;
  cuttingSpeed: number;
  feedPerTooth: number;
  recommended: Readonly<Record<Supplier, number>>;
};

export const MATERIALS: readonly MaterialData[] = [
  { value: "steel", label: "Steel", cuttingSpeed: 120, feedPerTooth: 0.05, recommended: { Evolute: 140, "NS Tools": 125, Palbit: 150, "PH Horn": 130 } },
  { value: "stainless", label: "Stainless", cuttingSpeed: 80, feedPerTooth: 0.04, recommended: { Evolute: 90, "NS Tools": 85, Palbit: 95, "PH Horn": 100 } },
  { value: "cast-iron", label: "Cast iron", cuttingSpeed: 110, feedPerTooth: 0.06, recommended: { Evolute: 130, "NS Tools": 120, Palbit: 140, "PH Horn": 115 } },
  { value: "aluminium", label: "Aluminium", cuttingSpeed: 300, feedPerTooth: 0.08, recommended: { Evolute: 450, "NS Tools": 380, Palbit: 400, "PH Horn": 420 } },
];

/** The fastest spindle in the shop, in rpm. Above it, the spindle speed readout warns. */
export const FASTEST_SPINDLE = 12000;

/** Spindle speed in rpm from cutting speed (m/min) and diameter (mm). */
export function spindleSpeed(cuttingSpeed: number, diameter: number): number {
  return (cuttingSpeed * 1000) / (Math.PI * diameter);
}

/** Table feed in mm/min from spindle speed (rpm), teeth and feed per tooth (mm). */
export function tableFeed(rpm: number, teeth: number, feedPerTooth: number): number {
  return rpm * teeth * feedPerTooth;
}
