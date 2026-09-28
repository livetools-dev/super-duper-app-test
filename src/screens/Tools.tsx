// Screen 1, at "/": the crib's cutting tools. A filter over a table whose rows
// open a strip of specs, one dialog that adds or edits a tool, and a yes/no
// question before a delete. Every edit lives in memory until the page reloads.

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  Filter,
  Form,
  FormActions,
  FormGrid,
  Input,
  Num,
  NumberField,
  Prose,
  RowMenu,
  Select,
  Specs,
  Stack,
  Table,
  Toolbar,
  ToolbarSpacer,
  emptyFilterState,
  toast,
  useConfirm,
  useUnitSystem,
} from "@livetools/ui";
import type { FilterSchema, FilterState, RowMenuItem, SelectItem, TableColumn, TableRow } from "@livetools/ui";
import {
  REORDER_POINT,
  SEED_TOOLS,
  SUPPLIERS,
  TOOL_TYPES,
  statusOf,
  typeLabel,
  type Supplier,
  type Tool,
  type ToolStatus,
  type ToolType,
} from "../data/tools";
import { formatQuantity } from "../lib/format";

const SCHEMA: FilterSchema = {
  quick: [
    { id: "all", label: "All" },
    { id: "low", label: "Low stock" },
    { id: "out", label: "Checked out" },
  ],
  facets: [
    { key: "type", label: "Type", type: "checkbox", values: TOOL_TYPES },
    { key: "supplier", label: "Supplier", type: "checkbox", values: SUPPLIERS },
    { key: "diameter", label: "Diameter", type: "range", measure: "length" },
  ],
};

const COLUMNS: readonly TableColumn[] = [
  { id: "number", label: "Tool number", kind: "code", rowHeader: true },
  { id: "description", label: "Description" },
  { id: "type", label: "Type" },
  { id: "diameter", label: "Diameter", kind: "number" },
  { id: "supplier", label: "Supplier" },
  { id: "stock", label: "Stock", kind: "number" },
  { id: "status", label: "Status" },
  { id: "actions", label: "Actions" },
];

const TYPE_ITEMS: readonly SelectItem[] = TOOL_TYPES;
const SUPPLIER_ITEMS: readonly SelectItem[] = SUPPLIERS.map((s) => ({ value: s, label: s }));

const STATUS_BADGE = {
  "in-stock": { variant: "success", icon: "success", words: "In stock" },
  "low-stock": { variant: "warning", icon: "warning", words: "Low stock" },
  "checked-out": { variant: "info", icon: "box", words: "Checked out" },
} as const satisfies Record<ToolStatus, { variant: string; icon: string; words: string }>;

/** Whether a tool passes the filter. `skip` leaves one facet out, for that facet's own counts. */
function matches(tool: Tool, state: FilterState, skip?: string): boolean {
  if (state.quick === "low" && statusOf(tool) !== "low-stock") return false;
  if (state.quick === "out" && !tool.checkedOut) return false;
  const q = state.q.toLowerCase();
  if (q !== "" && !`${tool.number} ${tool.description} ${tool.supplier}`.toLowerCase().includes(q)) return false;
  const types = state.facets.type ?? [];
  if (skip !== "type" && types.length > 0 && !types.includes(tool.type)) return false;
  const suppliers = state.facets.supplier ?? [];
  if (skip !== "supplier" && suppliers.length > 0 && !suppliers.includes(tool.supplier)) return false;
  const range = state.range.diameter;
  if (skip !== "diameter" && range !== undefined) {
    if (range.min !== null && tool.diameter < range.min) return false;
    if (range.max !== null && tool.diameter > range.max) return false;
  }
  return true;
}

function validateNumber(value: string): string | null {
  const text = value.trim();
  if (text === "") return null;
  return /^T-\d+$/.test(text) ? null : "Write the tool number as a T, a dash, then digits, such as T-1042.";
}

export function Tools() {
  const { system } = useUnitSystem();
  const confirm = useConfirm();
  const [tools, setTools] = useState<readonly Tool[]>(SEED_TOOLS);
  const [filter, setFilter] = useState<FilterState>(() => emptyFilterState(SCHEMA));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [formKey, setFormKey] = useState(0);
  const nextId = useRef(1);

  const shown = tools.filter((tool) => matches(tool, filter));

  const count = (key: string, value: string, state: FilterState) =>
    tools.filter(
      (tool) =>
        matches(tool, state, key) &&
        (key === "type" ? tool.type === value : key === "supplier" ? tool.supplier === value : true),
    ).length;

  function openDialog(tool: Tool | null) {
    setEditing(tool);
    setFormKey((k) => k + 1);
    setDialogOpen(true);
  }

  function toggleOut(tool: Tool) {
    setTools((all) => all.map((t) => (t.id === tool.id ? { ...t, checkedOut: !t.checkedOut } : t)));
    toast(tool.checkedOut ? `${tool.number} returned` : `${tool.number} checked out`);
  }

  async function remove(tool: Tool) {
    const ok = await confirm({
      title: `Delete ${tool.number}?`,
      body: `${tool.number}, ${tool.description.toLowerCase()}, comes off the crib's list.`,
      danger: true,
    });
    if (!ok) return;
    setTools((all) => all.filter((t) => t.id !== tool.id));
    toast(`${tool.number} deleted`);
  }

  function save(values: Record<string, unknown>) {
    const number = String(values.number).trim();
    const fields = {
      number,
      description: String(values.description).trim(),
      type: values.type as ToolType,
      supplier: values.supplier as Supplier,
      diameter: values.diameter as number,
      flutes: values.flutes as number,
      stock: values.stock as number,
    };
    if (editing === null) {
      const tool: Tool = {
        ...fields,
        id: `new-${nextId.current++}`,
        checkedOut: false,
        coating: "Not recorded",
        shank: "Not recorded",
        bin: "Not assigned",
      };
      setTools((all) => [...all, tool]);
      toast(`${number} added`);
    } else {
      setTools((all) => all.map((t) => (t.id === editing.id ? { ...t, ...fields } : t)));
      toast(`${number} saved`);
    }
    setDialogOpen(false);
  }

  function rowMenu(tool: Tool): readonly RowMenuItem[] {
    return [
      { kind: "action", label: tool.checkedOut ? "Return" : "Check out", onSelect: () => toggleOut(tool) },
      { kind: "action", label: "Edit", icon: "pencil", onSelect: () => openDialog(tool) },
      { kind: "separator" },
      { kind: "action", label: "Delete", danger: true, icon: "slash", onSelect: () => void remove(tool) },
    ];
  }

  const rows: readonly TableRow[] = shown.map((tool) => {
    const badge = STATUS_BADGE[statusOf(tool)];
    return {
      id: tool.id,
      cells: {
        number: tool.number,
        description: tool.description,
        type: typeLabel(tool.type),
        diameter: <Num>{formatQuantity(tool.diameter, "length", system)}</Num>,
        supplier: tool.supplier,
        stock: <Num>{tool.stock}</Num>,
        status: (
          <Badge variant={badge.variant} icon={badge.icon}>
            {badge.words}
          </Badge>
        ),
        actions: <RowMenu label={`Actions for ${tool.number}`} items={rowMenu(tool)} />,
      },
    };
  });

  const detail = (row: TableRow) => {
    const tool = tools.find((t) => t.id === row.id);
    if (tool === undefined) return null;
    return (
      <Specs
        items={[
          { label: "Flutes", value: <Num>{tool.flutes}</Num> },
          { label: "Coating", value: tool.coating },
          { label: "Shank", value: tool.shank },
          { label: "Bin location", value: tool.bin },
        ]}
      />
    );
  };

  const validateUnique = (value: string) => {
    const text = value.trim();
    const format = validateNumber(text);
    if (format !== null) return format;
    const taken = tools.some((t) => t.number === text && t.id !== editing?.id);
    return taken ? `${text} is already in the crib. Pick another number.` : null;
  };

  return (
    <Stack>
      <Prose>
        <h1>Tools</h1>
        <p>The cutting tools the crib holds, where each one is and how many are on the shelf.</p>
      </Prose>
      <Filter
        schema={SCHEMA}
        value={filter}
        onChange={setFilter}
        count={count}
        results={{ shown: shown.length, total: tools.length }}
        searchLabel="Search tools"
        searchPlaceholder="Search by number, description or supplier"
      />
      <Toolbar>
        <span>
          Showing {shown.length} of {tools.length} tools
        </span>
        <ToolbarSpacer />
        <Button icon="add" onClick={() => openDialog(null)}>
          Add tool
        </Button>
      </Toolbar>
      <Table
        label="Cutting tools"
        columns={COLUMNS}
        rows={rows}
        detail={detail}
        empty={{ title: "No tools match these filters", body: "Clear a filter or pick another quick filter." }}
      />
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing === null ? "Add a tool" : `Edit ${editing.number}`}
      >
        <Form key={formKey} onSubmit={save}>
          <Stack>
            <FormGrid>
              <Input
                label="Tool number"
                name="number"
                required
                defaultValue={editing?.number ?? ""}
                hint="A T, a dash, then digits."
                validate={validateUnique}
              />
              <Input label="Description" name="description" required defaultValue={editing?.description ?? ""} />
              <Select
                label="Type"
                name="type"
                required
                items={TYPE_ITEMS}
                placeholder="Choose a type"
                defaultValue={editing?.type ?? null}
              />
              <Select
                label="Supplier"
                name="supplier"
                required
                items={SUPPLIER_ITEMS}
                placeholder="Choose a supplier"
                defaultValue={editing?.supplier ?? null}
              />
              <NumberField
                label="Diameter"
                name="diameter"
                measure="length"
                stepper
                required
                min={0.1}
                defaultValue={editing?.diameter ?? null}
              />
              <NumberField
                label="Flutes"
                name="flutes"
                unit="teeth"
                decimals={0}
                stepper
                required
                min={1}
                defaultValue={editing?.flutes ?? null}
              />
              <NumberField
                label="Stock"
                name="stock"
                decimals={0}
                min={0}
                stepper
                required
                warnBelow={REORDER_POINT}
                warnMessage="Below the reorder point."
                defaultValue={editing?.stock ?? null}
              />
            </FormGrid>
            <FormActions>
              <Button type="submit">Save</Button>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </FormActions>
          </Stack>
        </Form>
      </Dialog>
    </Stack>
  );
}
