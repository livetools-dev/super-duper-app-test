// Screen 2, at "/speeds": a cutting-speed calculator that recalculates as the
// person types. Every field holds its value in metric; the unit toggle changes
// what the fields show, and the readouts and bars follow it through the app's
// own formatting.

import { useState } from "react";
import {
  Form,
  FormGrid,
  Measure,
  MeasureSet,
  NumberField,
  Prose,
  Readout,
  Row,
  Select,
  Stack,
  UnitToggle,
  useUnitSystem,
} from "@livetools/ui";
import type { SelectItem } from "@livetools/ui";
import { SEED_TOOLS, SUPPLIERS } from "../data/tools";
import { FASTEST_SPINDLE, MATERIALS, spindleSpeed, tableFeed, type Material } from "../data/speeds";
import { formatFigure, unitOf } from "../lib/format";

const TOOL_ITEMS: readonly SelectItem[] = SEED_TOOLS.map((t) => ({ value: t.id, label: `${t.number} ${t.description}` }));
const MATERIAL_ITEMS: readonly SelectItem[] = MATERIALS.map((m) => ({ value: m.value, label: m.label }));

const FIRST_TOOL = SEED_TOOLS[0];
const FIRST_MATERIAL = MATERIALS[0];

function present(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

export function Speeds() {
  const { system } = useUnitSystem();
  const [toolId, setToolId] = useState<string | null>(FIRST_TOOL.id);
  const [material, setMaterial] = useState<Material | null>(FIRST_MATERIAL.value);
  const [diameter, setDiameter] = useState<number | null>(FIRST_TOOL.diameter);
  const [teeth, setTeeth] = useState<number | null>(FIRST_TOOL.flutes);
  const [cuttingSpeed, setCuttingSpeed] = useState<number | null>(FIRST_MATERIAL.cuttingSpeed);
  const [feedPerTooth, setFeedPerTooth] = useState<number | null>(FIRST_MATERIAL.feedPerTooth);

  function chooseTool(id: string | null) {
    setToolId(id);
    const tool = SEED_TOOLS.find((t) => t.id === id);
    if (tool === undefined) return;
    setDiameter(tool.diameter);
    setTeeth(tool.flutes);
  }

  function chooseMaterial(value: string | null) {
    const data = MATERIALS.find((m) => m.value === value);
    setMaterial(data?.value ?? null);
    if (data !== undefined) setCuttingSpeed(data.cuttingSpeed);
  }

  const rpm = present(cuttingSpeed) && present(diameter) ? spindleSpeed(cuttingSpeed, diameter) : null;
  const feed = present(rpm) && present(teeth) && present(feedPerTooth) ? tableFeed(rpm, teeth, feedPerTooth) : null;

  const materialData = MATERIALS.find((m) => m.value === material);
  const recommended = SUPPLIERS.map((supplier) => ({
    supplier,
    speed: materialData?.recommended[supplier] ?? null,
  }));
  const highest = Math.max(...recommended.map((r) => r.speed ?? 0));

  return (
    <Stack>
      <Prose>
        <h1>Speeds</h1>
        <p>Pick a tool and a material, and the spindle speed and table feed work themselves out as you type.</p>
      </Prose>
      <Row>
        <UnitToggle />
      </Row>
      <Form onSubmit={() => {}}>
        <FormGrid>
          <Select label="Tool" name="tool" items={TOOL_ITEMS} placeholder="Choose a tool" value={toolId} onValueChange={chooseTool} />
          <Select
            label="Material"
            name="material"
            items={MATERIAL_ITEMS}
            placeholder="Choose a material"
            value={material}
            onValueChange={chooseMaterial}
          />
          <NumberField
            label="Diameter"
            name="diameter"
            measure="length"
            stepper
            min={0.1}
            value={diameter}
            onValueChange={(v) => setDiameter(v)}
          />
          <NumberField
            label="Teeth"
            name="teeth"
            unit="teeth"
            decimals={0}
            min={1}
            value={teeth}
            onValueChange={(v) => setTeeth(v)}
          />
          <NumberField
            label="Cutting speed"
            name="cuttingSpeed"
            measure="speed"
            min={1}
            value={cuttingSpeed}
            onValueChange={(v) => setCuttingSpeed(v)}
          />
          <NumberField
            label="Feed per tooth"
            name="feedPerTooth"
            measure="feedPerTooth"
            min={0.001}
            value={feedPerTooth}
            onValueChange={(v) => setFeedPerTooth(v)}
          />
        </FormGrid>
      </Form>
      <Row>
        {rpm !== null && rpm > FASTEST_SPINDLE ? (
          <Readout
            label="Spindle speed"
            value={formatFigure(rpm, "rotation", system)}
            unit={unitOf("rotation", system)}
            formula="n = vc × 1000 / (π × Dc)"
            status="warning"
            problem="Above the fastest spindle in the shop."
          />
        ) : (
          <Readout
            label="Spindle speed"
            value={rpm === null ? null : formatFigure(rpm, "rotation", system)}
            unit={unitOf("rotation", system)}
            formula="n = vc × 1000 / (π × Dc)"
          />
        )}
        <Readout
          label="Table feed"
          value={feed === null ? null : formatFigure(feed, "feed", system)}
          unit={unitOf("feed", system)}
          formula="vf = n × z × fz"
        />
      </Row>
      <Prose>
        <h2>Recommended cutting speed{materialData === undefined ? "" : `, ${materialData.label.toLowerCase()}`}</h2>
      </Prose>
      <MeasureSet scale="Bars scaled against the highest recommended cutting speed for this material.">
        {recommended.map(({ supplier, speed }) =>
          speed === null ? (
            <Measure key={supplier} label={supplier} value={null} />
          ) : speed === highest ? (
            <Measure
              key={supplier}
              label={supplier}
              value={formatFigure(speed, "speed", system)}
              unit={unitOf("speed", system)}
              fraction={speed / highest}
              best="Highest recommended"
            />
          ) : (
            <Measure
              key={supplier}
              label={supplier}
              value={formatFigure(speed, "speed", system)}
              unit={unitOf("speed", system)}
              fraction={speed / highest}
            />
          ),
        )}
      </MeasureSet>
    </Stack>
  );
}
