// The machines on the floor: the seed the Machines screen starts from.
// Example data. Travels are in millimetres, spindle speed in rpm.

import type { StateValue } from "@livetools/ui";

export type Control = "Fanuc" | "Siemens" | "Heidenhain" | "Haas";

export type Machine = {
  id: string;
  name: string;
  control: Control;
  travelX: number;
  travelY: number;
  travelZ: number;
  topSpindle: number;
  state: StateValue;
  condition: string;
  staged?: string;
};

export const CONTROLS: readonly Control[] = ["Fanuc", "Siemens", "Heidenhain", "Haas"];

export const SEED_MACHINES: readonly Machine[] = [
  { id: "m1", name: "Vertical mill 1", control: "Fanuc", travelX: 762, travelY: 406, travelZ: 508, topSpindle: 12000, state: "running", condition: "Running, job 4471" },
  { id: "m2", name: "Vertical mill 2", control: "Heidenhain", travelX: 1020, travelY: 510, travelZ: 510, topSpindle: 10000, state: "waiting", condition: "Waiting for material, job 4480", staged: "Spindle rebuild booked" },
  { id: "m3", name: "Five-axis cell", control: "Siemens", travelX: 650, travelY: 520, travelZ: 475, topSpindle: 18000, state: "warning", condition: "Coolant low, job 4466" },
  { id: "m4", name: "Toolroom mill", control: "Haas", travelX: 508, travelY: 356, travelZ: 356, topSpindle: 8100, state: "idle", condition: "Idle since 14:20" },
];
