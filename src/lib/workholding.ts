// The three ways to hold a small part on a big lathe, each judged against the
// job: extended jaws on the chuck already fitted, a smaller chuck, and a
// collet chuck. Every figure comes in metric and is written out in the unit
// system on screen.

import type { UnitSystem } from "@livetools/ui";
import { COLLET_COMMON_MAX, COLLET_LARGE_MAX, SMALL_CHUCK_SIZES, type Job } from "../data/lathe";
import { formatQuantity } from "./format";

export type Fit = "good" | "possible" | "poor";

export type Option = {
  id: string;
  title: string;
  fit: Fit;
  /** One line on what the option is. */
  summary: string;
  /** What it takes, as label and value pairs. */
  needs: readonly { label: string; value: string }[];
  /** Why it got its rating, in the order they matter. */
  reasons: readonly string[];
};

/** Spindle speed for a cutting speed on a diameter: n = vc × 1000 / (π × D). */
export function spindleSpeed(cuttingSpeed: number, diameter: number): number {
  return (cuttingSpeed * 1000) / (Math.PI * diameter);
}

/** Cutting speed a spindle speed gives on a diameter: vc = π × D × n / 1000. */
export function cuttingSpeedAt(rpm: number, diameter: number): number {
  return (Math.PI * diameter * rpm) / 1000;
}

function worse(fit: Fit): Fit {
  return fit === "good" ? "possible" : "poor";
}

function rpm(value: number): string {
  return `${Math.round(value).toLocaleString("en-NZ")} rpm`;
}

/** The smallest common chuck that still grips this part comfortably inside its range. */
export function suggestedChuck(partDiameter: number): number | null {
  return SMALL_CHUCK_SIZES.find((size) => partDiameter <= size * 0.4) ?? null;
}

export function judge(job: Job, system: UnitSystem): readonly Option[] {
  const needed = spindleSpeed(job.cuttingSpeed, job.partDiameter);
  const speedLimited = needed > job.chuckMaxRpm;
  const reached = cuttingSpeedAt(Math.min(needed, job.chuckMaxRpm), job.partDiameter);
  const ratio = job.chuckDiameter / job.partDiameter;
  const length = (mm: number) => formatQuantity(mm, "length", system, system === "metric" ? 0 : 2);
  const speed = (m: number) => formatQuantity(m, "speed", system);

  // Extended or soft jaws on the chuck already fitted.
  let jawsFit: Fit = "good";
  const jawReasons: string[] = [
    "Keeps the chuck already on the machine, so there is no change-over between big and small work.",
    "Machinable soft jaws bored to the part do the job the welded pieces are doing now, but run true and are made to take the grip force.",
  ];
  if (speedLimited) {
    jawsFit = worse(jawsFit);
    jawReasons.unshift(
      `The big chuck tops out at ${rpm(job.chuckMaxRpm)}, which gives only ${speed(reached)} on this diameter instead of ${speed(job.cuttingSpeed)}.`,
    );
  }
  if (ratio > 10) {
    jawsFit = worse(jawsFit);
    jawReasons.push(
      `The part is about 1/${Math.round(ratio)} of the chuck's size, so the jaws reach a long way in; the further they reach, the more leverage on the jaw slides and the less grip and accuracy at the part.`,
    );
  }
  if (job.shape === "irregular") {
    jawReasons.push("Soft jaws can be bored or milled to an irregular shape, which a collet cannot do.");
  }

  // A smaller chuck, swapped on for small work.
  const chuck = suggestedChuck(job.partDiameter);
  let chuckFit: Fit = job.quantity === "one-off" ? "possible" : "good";
  const chuckReasons: string[] = [
    "Standard jaws grip small work close to the chuck face, and a smaller chuck is allowed to turn much faster.",
    "It goes on the spindle nose with an adaptor plate. A hydraulic chuck also needs a drawtube adaptor to the machine's cylinder; a manual chuck does not.",
  ];
  if (job.quantity === "one-off") {
    chuckReasons.push("Lifting the big chuck off takes a crane and time, which is hard to justify for one part between big jobs.");
  } else {
    chuckReasons.push("The change-over pays for itself over a run of parts.");
  }
  if (chuck === null) {
    chuckFit = "poor";
    chuckReasons.unshift("This part is too large for a smaller chuck to help; the big chuck is the right size for it.");
  }
  if (job.shape === "irregular") {
    chuckReasons.push("An irregular part suits a four-jaw independent chuck of the same size.");
  }
  if (job.shape === "hex") {
    chuckReasons.push("A three-jaw chuck grips hex on its flats; a six-jaw chuck spreads the load better on thin-walled parts.");
  }

  // A collet chuck on the spindle nose.
  let colletFit: Fit = job.quantity === "one-off" ? "possible" : "good";
  const colletReasons: string[] = [
    "Grips all the way round, so it holds small parts with the best run-out and the least marking of the three.",
    `The ${length(job.spindleBore)} bore leaves room for the collet chuck's drawtube, and for bar to feed through it.`,
  ];
  if (job.partDiameter > COLLET_LARGE_MAX) {
    colletFit = "poor";
    colletReasons.unshift(`At ${length(job.partDiameter)} the part is past what collets sensibly hold.`);
  } else if (job.partDiameter > COLLET_COMMON_MAX) {
    colletFit = worse(colletFit);
    colletReasons.unshift(
      `At ${length(job.partDiameter)} the part needs a large-capacity collet system; the common ones stop at about ${length(COLLET_COMMON_MAX)}.`,
    );
  }
  if (job.shape === "irregular") {
    colletFit = "poor";
    colletReasons.unshift("A collet only holds round, hex or square stock, not an irregular shape.");
  }
  if (job.quantity === "one-off") {
    colletReasons.push("Each collet grips a narrow band of sizes, so one-offs across many diameters need a lot of collets.");
  } else {
    colletReasons.push("Loading is quick and repeatable, which counts on a run of parts.");
  }
  if (job.gripLength < 10) {
    colletReasons.push(`Only ${length(job.gripLength)} to grip is short for a standard collet; it needs a collet made for short parts.`);
  }

  return [
    {
      id: "jaws",
      title: "Extended jaws on the big chuck",
      fit: jawsFit,
      summary: `Soft or extended jaws on the ${length(job.chuckDiameter)} chuck already fitted, bored to the part.`,
      needs: [
        { label: "Change-over", value: "Swap the top jaws only" },
        { label: "Spindle speed", value: speedLimited ? `Limited to ${rpm(job.chuckMaxRpm)}` : `${rpm(needed)} is within the chuck's limit` },
      ],
      reasons: jawReasons,
    },
    {
      id: "chuck",
      title: "A smaller chuck",
      fit: chuckFit,
      summary: "A smaller three-jaw chuck swapped on for small work.",
      needs: [
        { label: "Size to start from", value: chuck === null ? "Not needed" : `About ${length(chuck)}` },
        { label: "Mounting", value: "Adaptor plate, plus a drawtube adaptor if hydraulic" },
      ],
      reasons: chuckReasons,
    },
    {
      id: "collet",
      title: "A collet chuck",
      fit: colletFit,
      summary: "A collet chuck on the spindle nose, driven by the machine's cylinder.",
      needs: [
        { label: "Collet for this part", value: length(job.partDiameter) },
        { label: "Mounting", value: "Spindle nose adaptor and drawtube" },
      ],
      reasons: colletReasons,
    },
  ];
}
