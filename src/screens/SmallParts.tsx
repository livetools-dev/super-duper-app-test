// Screen 1, at "/": holding small parts on a big lathe. The person enters the
// machine and the part, and the three options (extended jaws, a smaller chuck,
// a collet chuck) are judged against them as they type. Every field holds its
// value in metric; the unit toggle changes what is shown.

import { useState } from "react";
import {
  Badge,
  Empty,
  Fieldset,
  Form,
  FormGrid,
  NumberField,
  Prose,
  RadioGroup,
  Readout,
  Row,
  Num,
  Specs,
  Stack,
  Table,
  UnitToggle,
  useUnitSystem,
} from "@livetools/ui";
import { QUANTITIES, SHAPES, START_JOB, type Job, type Quantity, type Shape } from "../data/lathe";
import { formatFigure, unitOf } from "../lib/format";
import { cuttingSpeedAt, judge, spindleSpeed, type Fit } from "../lib/workholding";
import type { TableColumn, TableRow } from "@livetools/ui";

const COLUMNS: readonly TableColumn[] = [
  { id: "option", label: "Option", rowHeader: true },
  { id: "fit", label: "Fit" },
  { id: "speed", label: "Cutting speed on this part", kind: "number" },
  { id: "changeOver", label: "Change-over" },
  { id: "suits", label: "Suits" },
  { id: "catch", label: "Main catch" },
];

type Entered = { [K in keyof Job]: Job[K] extends number ? number | null : Job[K] };

function complete(entered: Entered): Job | null {
  const numbers = [
    entered.chuckDiameter,
    entered.spindleBore,
    entered.chuckMaxRpm,
    entered.partDiameter,
    entered.gripLength,
    entered.cuttingSpeed,
  ];
  if (numbers.some((n) => n === null || !Number.isFinite(n) || n <= 0)) return null;
  return entered as Job;
}

function FitBadge({ fit }: { fit: Fit }) {
  if (fit === "good") return <Badge variant="success" icon="success">Good fit</Badge>;
  if (fit === "possible") return <Badge variant="warning" icon="warning">Worth a look</Badge>;
  return <Badge variant="neutral" icon="slash">Poor fit</Badge>;
}

export function SmallParts() {
  const { system } = useUnitSystem();
  const [entered, setEntered] = useState<Entered>(START_JOB);

  function set<K extends keyof Entered>(key: K, value: Entered[K]) {
    setEntered((prev) => ({ ...prev, [key]: value }));
  }

  const job = complete(entered);
  const needed = job === null ? null : spindleSpeed(job.cuttingSpeed, job.partDiameter);
  const reached = job === null || needed === null ? null : cuttingSpeedAt(Math.min(needed, job.chuckMaxRpm), job.partDiameter);
  const options = job === null ? [] : judge(job, system);
  const best = options.filter((o) => o.fit === "good").map((o) => o.title.toLowerCase());

  const rows: readonly TableRow[] = options.map((o) => ({
    id: o.id,
    label: o.title,
    cells: {
      option: o.title,
      fit: <FitBadge fit={o.fit} />,
      speed: (
        <Num>
          {formatFigure(o.reached, "speed", system)} {unitOf("speed", system)}
          {o.speedLimited ? " (held down)" : ""}
        </Num>
      ),
      changeOver: o.changeOver,
      suits: o.suits,
      catch: o.catch,
    },
  }));

  const detail = (row: TableRow) => {
    const o = options.find((x) => x.id === row.id);
    if (o === undefined) return null;
    return (
      <Stack gap="sm">
        <Row>
          <Prose>
            <h3>For</h3>
            <ul>
              {o.pros.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Prose>
          <Prose>
            <h3>Against</h3>
            {o.cons.length === 0 ? (
              <p>Nothing major for this part.</p>
            ) : (
              <ul>
                {o.cons.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </Prose>
        </Row>
        <Specs items={o.needs.map((n) => ({ key: n.label, label: n.label, value: n.value }))} />
      </Stack>
    );
  };

  return (
    <Stack>
      <Prose>
        <h1>Small parts on a big lathe</h1>
        <p>
          Enter the machine and the part. The three usual answers, extended jaws on the chuck already fitted, a smaller
          chuck, or a collet chuck, are judged against them as you type.
        </p>
      </Prose>
      <Row>
        <UnitToggle />
      </Row>
      <Form onSubmit={() => {}}>
        <Stack>
          <Fieldset legend="The machine">
            <FormGrid>
              <NumberField
                label="Chuck size"
                name="chuckDiameter"
                measure="length"
                decimals={1}
                hint="Across the chuck body."
                min={50}
                value={entered.chuckDiameter}
                onValueChange={(v) => set("chuckDiameter", v)}
              />
              <NumberField
                label="Spindle bore"
                name="spindleBore"
                measure="length"
                decimals={1}
                min={1}
                value={entered.spindleBore}
                onValueChange={(v) => set("spindleBore", v)}
              />
              <NumberField
                label="Chuck's top speed"
                name="chuckMaxRpm"
                measure="rotation"
                hint="Off the chuck's plate or its manual."
                min={1}
                step={50}
                stepper
                value={entered.chuckMaxRpm}
                onValueChange={(v) => set("chuckMaxRpm", v)}
              />
            </FormGrid>
          </Fieldset>
          <Fieldset legend="The part">
            <Stack>
              <FormGrid>
                <NumberField
                  label="Diameter gripped"
                  name="partDiameter"
                  measure="length"
                  min={1}
                  stepper
                  value={entered.partDiameter}
                  onValueChange={(v) => set("partDiameter", v)}
                />
                <NumberField
                  label="Length free to grip"
                  name="gripLength"
                  measure="length"
                  min={1}
                  value={entered.gripLength}
                  onValueChange={(v) => set("gripLength", v)}
                />
                <NumberField
                  label="Cutting speed"
                  name="cuttingSpeed"
                  measure="speed"
                  hint="What the insert wants on this material."
                  min={1}
                  step={10}
                  value={entered.cuttingSpeed}
                  onValueChange={(v) => set("cuttingSpeed", v)}
                />
              </FormGrid>
              <FormGrid>
                <RadioGroup
                  label="Shape"
                  name="shape"
                  layout="buttons"
                  items={SHAPES}
                  value={entered.shape}
                  onValueChange={(v) => set("shape", v as Shape)}
                />
                <RadioGroup
                  label="How many"
                  name="quantity"
                  layout="buttons"
                  items={QUANTITIES}
                  value={entered.quantity}
                  onValueChange={(v) => set("quantity", v as Quantity)}
                />
              </FormGrid>
            </Stack>
          </Fieldset>
        </Stack>
      </Form>
      <Row>
        {job !== null && needed !== null && needed > job.chuckMaxRpm ? (
          <Readout
            label="Spindle speed needed"
            value={formatFigure(needed, "rotation", system)}
            unit={unitOf("rotation", system)}
            formula="n = vc × 1000 / (π × D)"
            status="warning"
            problem="Faster than the big chuck is allowed to turn."
          />
        ) : (
          <Readout
            label="Spindle speed needed"
            value={needed === null ? null : formatFigure(needed, "rotation", system)}
            unit={unitOf("rotation", system)}
            formula="n = vc × 1000 / (π × D)"
          />
        )}
        <Readout
          label="Cutting speed on the big chuck"
          value={reached === null ? null : formatFigure(reached, "speed", system)}
          unit={unitOf("speed", system)}
          formula="vc = π × D × n / 1000, n capped at the chuck's top speed"
        />
        <Readout
          label="Chuck size to part size"
          value={job === null ? null : Math.round(job.chuckDiameter / job.partDiameter).toLocaleString("en-NZ")}
          unit="to 1"
        />
      </Row>
      <Prose>
        <h2>The options, best first</h2>
        {best.length > 0 ? (
          <p>
            For this part: <strong>{best.join(" or ")}</strong>. Open a row for the full for and against.
          </p>
        ) : null}
      </Prose>
      {job === null ? (
        <Empty title="No options yet">
          <Prose>
            <p>Fill in every figure above, each greater than nought, and the options show here.</p>
          </Prose>
        </Empty>
      ) : (
        <Table label="Ways to hold the part" columns={COLUMNS} rows={rows} detail={detail} empty={{ title: "No options" }} />
      )}
      <Prose>
        <p>A guide for the first conversation with the shop, not a recommendation for a particular product.</p>
      </Prose>
    </Stack>
  );
}
