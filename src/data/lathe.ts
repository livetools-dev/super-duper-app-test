// The prospect's machine and a typical small part, as the screen starts. Every
// length is in mm and every speed in m/min or rpm: the metric base the fields
// hold whatever they show.

export type Shape = "round" | "hex" | "irregular";
export type Quantity = "one-off" | "batch" | "production";

export type Job = {
  /** The chuck on the machine now, across its body. */
  chuckDiameter: number;
  /** The spindle bore. */
  spindleBore: number;
  /** The fastest the chuck on the machine is allowed to turn. */
  chuckMaxRpm: number;
  /** The diameter the jaws or collet close on. */
  partDiameter: number;
  /** How much of the part is free to grip. */
  gripLength: number;
  /** The cutting speed the insert wants on this material. */
  cuttingSpeed: number;
  shape: Shape;
  quantity: Quantity;
};

/** 21 inch hydraulic chuck, 160 mm bore, a 25 mm part in steel. */
export const START_JOB: Job = {
  chuckDiameter: 533.4,
  spindleBore: 160,
  chuckMaxRpm: 1500,
  partDiameter: 25,
  gripLength: 20,
  cuttingSpeed: 180,
  shape: "round",
  quantity: "batch",
};

export const SHAPES: readonly { value: Shape; label: string }[] = [
  { value: "round", label: "Round" },
  { value: "hex", label: "Hex" },
  { value: "irregular", label: "Irregular" },
];

export const QUANTITIES: readonly { value: Quantity; label: string }[] = [
  { value: "one-off", label: "One-offs" },
  { value: "batch", label: "Batches" },
  { value: "production", label: "Production" },
];

/** Common three-jaw chuck sizes, in mm across the body. */
export const SMALL_CHUCK_SIZES: readonly number[] = [165, 210, 254, 315, 400];

/** Collet systems commonly reach about this diameter; past it, a large-capacity system. */
export const COLLET_COMMON_MAX = 65;
/** Past this, collets stop being a sensible answer. */
export const COLLET_LARGE_MAX = 100;
