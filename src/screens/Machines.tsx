// Screen 3, at "/machines": the machines on the floor, one card each, and a
// three-step wizard that adds one. Travels are held in millimetres and shown
// in the current unit system.

import { useState } from "react";
import {
  Card,
  FormGrid,
  Input,
  NumberField,
  Prose,
  Select,
  Specs,
  Stack,
  State,
  Tabs,
  Wizard,
  toast,
  useUnitSystem,
} from "@livetools/ui";
import type { SelectItem, SpecsItem, UnitSystem } from "@livetools/ui";
import { CONTROLS, SEED_MACHINES, type Control, type Machine } from "../data/machines";
import { formatQuantity } from "../lib/format";

const CONTROL_ITEMS: readonly SelectItem[] = CONTROLS.map((c) => ({ value: c, label: c }));

type Draft = {
  name: string;
  control: Control | null;
  travelX: number | null;
  travelY: number | null;
  travelZ: number | null;
  topSpindle: number | null;
};

const EMPTY_DRAFT: Draft = { name: "", control: null, travelX: null, travelY: null, travelZ: null, topSpindle: null };

/** A travel in whole millimetres, or inches to two places. */
function travel(value: number, system: UnitSystem): string {
  return formatQuantity(value, "length", system, system === "metric" ? 0 : 2);
}

function machineSpecs(machine: Machine, system: UnitSystem): readonly SpecsItem[] {
  return [
    { label: "Control", value: machine.control },
    { label: "X travel", value: travel(machine.travelX, system) },
    { label: "Y travel", value: travel(machine.travelY, system) },
    { label: "Z travel", value: travel(machine.travelZ, system) },
    { label: "Top spindle speed", value: formatQuantity(machine.topSpindle, "rotation", system) },
  ];
}

function MachineCard({ machine, system }: { machine: Machine; system: UnitSystem }) {
  const actions = <State state={machine.state}>{machine.condition}</State>;
  const body = <Specs bordered items={machineSpecs(machine, system)} />;
  return machine.staged === undefined ? (
    <Card as="li" title={machine.name} titleAs="h3" actions={actions}>
      {body}
    </Card>
  ) : (
    <Card as="li" title={machine.name} titleAs="h3" actions={actions} staged={machine.staged}>
      {body}
    </Card>
  );
}

export function Machines() {
  const { system } = useUnitSystem();
  const [machines, setMachines] = useState<readonly Machine[]>(SEED_MACHINES);
  const [tab, setTab] = useState("floor");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [wizardKey, setWizardKey] = useState(0);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const shown = (value: number | null, show: (v: number) => string) => (value === null ? "Not given" : show(value));

  function finish() {
    const { name, control, travelX, travelY, travelZ, topSpindle } = draft;
    if (control === null || travelX === null || travelY === null || travelZ === null || topSpindle === null) return;
    const machine: Machine = {
      id: `new-${wizardKey}`,
      name: name.trim(),
      control,
      travelX,
      travelY,
      travelZ,
      topSpindle,
      state: "idle",
      condition: "Idle, just added",
    };
    setMachines((all) => [...all, machine]);
    setDraft(EMPTY_DRAFT);
    setWizardKey((k) => k + 1);
    setTab("floor");
    toast(`${machine.name} added to the floor`);
  }

  const floor = (
    <Stack>
      <Prose>
        <h2>{machines.length} machines on the floor</h2>
      </Prose>
      <Stack as="ul">
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} system={system} />
        ))}
      </Stack>
    </Stack>
  );

  const add = (
    <Wizard
      key={wizardKey}
      onFinish={finish}
      finishLabel="Add the machine"
      steps={[
        {
          id: "identity",
          label: "Identity",
          children: (
            <FormGrid>
              <Input
                label="Name"
                name="name"
                required
                hint="As it is known on the floor."
                value={draft.name}
                onValueChange={(v) => set("name", v)}
              />
              <Select
                label="Control"
                name="control"
                required
                items={CONTROL_ITEMS}
                placeholder="Choose a control"
                value={draft.control}
                onValueChange={(v) => set("control", (v as Control | null) ?? null)}
              />
            </FormGrid>
          ),
        },
        {
          id: "envelope",
          label: "Envelope",
          children: (
            <FormGrid>
              <NumberField
                label="X travel"
                name="travelX"
                measure="length"
                required
                min={1}
                value={draft.travelX}
                onValueChange={(v) => set("travelX", v)}
              />
              <NumberField
                label="Y travel"
                name="travelY"
                measure="length"
                required
                min={1}
                value={draft.travelY}
                onValueChange={(v) => set("travelY", v)}
              />
              <NumberField
                label="Z travel"
                name="travelZ"
                measure="length"
                required
                min={1}
                value={draft.travelZ}
                onValueChange={(v) => set("travelZ", v)}
              />
              <NumberField
                label="Top spindle speed"
                name="topSpindle"
                measure="rotation"
                required
                min={1}
                value={draft.topSpindle}
                onValueChange={(v) => set("topSpindle", v)}
              />
            </FormGrid>
          ),
        },
        {
          id: "review",
          label: "Review",
          children: (
            <Specs
              bordered
              items={[
                { label: "Name", value: draft.name.trim() === "" ? "Not given" : draft.name.trim() },
                { label: "Control", value: draft.control ?? "Not given" },
                { label: "X travel", value: shown(draft.travelX, (v) => travel(v, system)) },
                { label: "Y travel", value: shown(draft.travelY, (v) => travel(v, system)) },
                { label: "Z travel", value: shown(draft.travelZ, (v) => travel(v, system)) },
                {
                  label: "Top spindle speed",
                  value: shown(draft.topSpindle, (v) => formatQuantity(v, "rotation", system)),
                },
              ]}
            />
          ),
        },
      ]}
    />
  );

  return (
    <Stack>
      <Prose>
        <h1>Machines</h1>
        <p>What is on the floor, what each one is doing, and how far each one reaches.</p>
      </Prose>
      <Tabs
        label="Machines"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "floor", label: "Floor", meta: `${machines.length} machines`, content: floor },
          { value: "add", label: "Add a machine", content: add },
        ]}
      />
    </Stack>
  );
}
