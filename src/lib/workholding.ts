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
  /** The cutting speed this option reaches on the part, in m/min. */
  reached: number;
  /** True when the chuck's top speed holds the cutting speed down. */
  speedLimited: boolean;
  changeOver: string;
  suits: string;
  /** The one thing most against it, short. */
  catch: string;
  /** What it takes, as label and value pairs. */
  needs: readonly { label: string; value: string }[];
  pros: readonly string[];
  cons: readonly string[];
};

const FIT_ORDER: Readonly<Record<Fit, number>> = { good: 0, possible: 1, poor: 2 };

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

/** The smallest common chuck that still grips this part comfortably inside its range. */
export function suggestedChuck(partDiameter: number): number | null {
  return SMALL_CHUCK_SIZES.find((size) => partDiameter <= size * 0.4) ?? null;
}

/** The options, best fit first. */
export function judge(job: Job, system: UnitSystem): readonly Option[] {
  const needed = spindleSpeed(job.cuttingSpeed, job.partDiameter);
  const speedLimited = needed > job.chuckMaxRpm;
  const reachedOnBig = cuttingSpeedAt(Math.min(needed, job.chuckMaxRpm), job.partDiameter);
  const ratio = job.chuckDiameter / job.partDiameter;
  const length = (mm: number) => formatQuantity(mm, "length", system, system === "metric" ? 0 : 2);

  // Extended or soft jaws on the chuck already fitted.
  let jawsFit: Fit = "good";
  const jawCons: string[] = [];
  if (speedLimited) {
    jawsFit = worse(jawsFit);
    jawCons.push("Held to the big chuck's top speed, so the part runs slow.");
  }
  if (ratio > 10) {
    jawsFit = worse(jawsFit);
    jawCons.push("Jaws reach a long way in: less grip and accuracy at the part.");
  }
  const jawPros = ["No chuck change: swap top jaws only.", "Soft jaws run true, unlike welded pieces."];
  if (job.shape === "irregular") jawPros.push("Can be bored or milled to an odd shape.");

  // A smaller chuck, swapped on for small work.
  const chuck = suggestedChuck(job.partDiameter);
  let chuckFit: Fit = job.quantity === "one-off" ? "possible" : "good";
  const chuckPros = ["Standard jaws grip close to the face.", "Turns much faster than the big chuck."];
  const chuckCons = ["Needs an adaptor plate, and a drawtube adaptor if hydraulic.", "Lifting the big chuck off takes a crane and time."];
  if (chuck === null) {
    chuckFit = "poor";
    chuckCons.unshift("Part is too large for a smaller chuck to help.");
  }
  if (job.shape === "irregular") chuckPros.push("A four-jaw independent chuck handles odd shapes.");
  if (job.shape === "hex") chuckPros.push("A six-jaw chuck spreads the load on thin hex.");

  // A collet chuck on the spindle nose.
  let colletFit: Fit = job.quantity === "one-off" ? "possible" : "good";
  const colletPros = ["Grips all round: best run-out, least marking.", "Quick, repeatable loading.", `The ${length(job.spindleBore)} bore lets bar feed through.`];
  const colletCons: string[] = ["Needs a collet for every size.", "Lifting the big chuck off takes a crane and time."];
  if (job.partDiameter > COLLET_LARGE_MAX) {
    colletFit = "poor";
    colletCons.unshift("Part is too large for collets.");
  } else if (job.partDiameter > COLLET_COMMON_MAX) {
    colletFit = worse(colletFit);
    colletCons.unshift(`Over ${length(COLLET_COMMON_MAX)}: needs a large-capacity collet system.`);
  }
  if (job.shape === "irregular") {
    colletFit = "poor";
    colletCons.unshift("Won't hold an irregular shape.");
  }
  if (job.gripLength < 10) colletCons.push("Short grip length needs a special collet.");

  const options: Option[] = [
    {
      id: "jaws",
      title: "Extended jaws",
      fit: jawsFit,
      reached: reachedOnBig,
      speedLimited,
      changeOver: "Top jaws only",
      suits: "One-offs and odd shapes",
      catch: jawCons[0] ?? "Nothing major for this part.",
      needs: [{ label: "Jaws", value: `Soft or extended top jaws for the ${length(job.chuckDiameter)} chuck` }],
      pros: jawPros,
      cons: jawCons,
    },
    {
      id: "chuck",
      title: "Smaller chuck",
      fit: chuckFit,
      reached: job.cuttingSpeed,
      speedLimited: false,
      changeOver: "Whole chuck",
      suits: "Batches, any shape",
      catch: chuckCons[0],
      needs: [
        { label: "Size to start from", value: chuck === null ? "Not needed" : `About ${length(chuck)}` },
        { label: "Mounting", value: "Adaptor plate, plus a drawtube adaptor if hydraulic" },
      ],
      pros: chuckPros,
      cons: chuckCons,
    },
    {
      id: "collet",
      title: "Collet chuck",
      fit: colletFit,
      reached: job.cuttingSpeed,
      speedLimited: false,
      changeOver: "Whole chuck",
      suits: "Round or hex, runs of parts",
      catch: colletCons[0],
      needs: [
        { label: "Collet", value: length(job.partDiameter) },
        { label: "Mounting", value: "Spindle nose adaptor and drawtube" },
      ],
      pros: colletPros,
      cons: colletCons,
    },
  ];
  return options.sort((a, b) => FIT_ORDER[a.fit] - FIT_ORDER[b.fit]);
}
