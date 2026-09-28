// The crib's cutting tools: the seed every screen starts from. Example data,
// not measured from a real catalogue. Diameters are in millimetres, the
// metric base unit every NumberField holds.

export type ToolType = "end-mill" | "drill" | "insert" | "reamer";
export type Supplier = "Evolute" | "NS Tools" | "Palbit" | "PH Horn";

export type Tool = {
  id: string;
  number: string;
  description: string;
  type: ToolType;
  supplier: Supplier;
  diameter: number;
  flutes: number;
  stock: number;
  checkedOut: boolean;
  coating: string;
  shank: string;
  bin: string;
};

export type ToolStatus = "in-stock" | "low-stock" | "checked-out";

/** Below this many on the shelf, a tool is due for reordering. */
export const REORDER_POINT = 2;

export const TOOL_TYPES: readonly { value: ToolType; label: string }[] = [
  { value: "end-mill", label: "End mill" },
  { value: "drill", label: "Drill" },
  { value: "insert", label: "Insert" },
  { value: "reamer", label: "Reamer" },
];

export const SUPPLIERS: readonly Supplier[] = ["Evolute", "NS Tools", "Palbit", "PH Horn"];

export function typeLabel(type: ToolType): string {
  return TOOL_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function statusOf(tool: Tool): ToolStatus {
  if (tool.checkedOut) return "checked-out";
  if (tool.stock < REORDER_POINT) return "low-stock";
  return "in-stock";
}

export const SEED_TOOLS: readonly Tool[] = [
  { id: "t1042", number: "T-1042", description: "Square end mill, 3 flute", type: "end-mill", supplier: "Evolute", diameter: 10, flutes: 3, stock: 6, checkedOut: false, coating: "AlTiN", shank: "10 mm plain", bin: "A1-03" },
  { id: "t1043", number: "T-1043", description: "Square end mill, 4 flute", type: "end-mill", supplier: "NS Tools", diameter: 6, flutes: 4, stock: 1, checkedOut: false, coating: "TiSiN", shank: "6 mm plain", bin: "A1-04" },
  { id: "t1044", number: "T-1044", description: "Ball nose end mill", type: "end-mill", supplier: "NS Tools", diameter: 3, flutes: 2, stock: 4, checkedOut: true, coating: "DLC", shank: "4 mm plain", bin: "A1-05" },
  { id: "t1045", number: "T-1045", description: "Roughing end mill, 4 flute", type: "end-mill", supplier: "Palbit", diameter: 16, flutes: 4, stock: 3, checkedOut: false, coating: "TiAlN", shank: "16 mm Weldon", bin: "A2-01" },
  { id: "t1046", number: "T-1046", description: "Corner radius end mill", type: "end-mill", supplier: "Evolute", diameter: 12, flutes: 4, stock: 0, checkedOut: false, coating: "AlCrN", shank: "12 mm plain", bin: "A2-02" },
  { id: "t2011", number: "T-2011", description: "Carbide drill, 5xD", type: "drill", supplier: "Palbit", diameter: 8.5, flutes: 2, stock: 5, checkedOut: false, coating: "TiAlN", shank: "10 mm plain", bin: "B1-01" },
  { id: "t2012", number: "T-2012", description: "Carbide drill, 3xD, coolant through", type: "drill", supplier: "Evolute", diameter: 6.8, flutes: 2, stock: 2, checkedOut: true, coating: "AlTiN", shank: "8 mm plain", bin: "B1-02" },
  { id: "t2013", number: "T-2013", description: "Spot drill, 90 degree", type: "drill", supplier: "NS Tools", diameter: 10, flutes: 2, stock: 7, checkedOut: false, coating: "Uncoated", shank: "10 mm plain", bin: "B1-03" },
  { id: "t2014", number: "T-2014", description: "Micro drill", type: "drill", supplier: "PH Horn", diameter: 1.2, flutes: 2, stock: 1, checkedOut: false, coating: "TiN", shank: "3 mm plain", bin: "B1-04" },
  { id: "t3021", number: "T-3021", description: "Grooving insert, 3 mm", type: "insert", supplier: "PH Horn", diameter: 3, flutes: 1, stock: 12, checkedOut: false, coating: "TiAlN", shank: "Holder S224", bin: "C1-01" },
  { id: "t3022", number: "T-3022", description: "Parting insert, 2 mm", type: "insert", supplier: "PH Horn", diameter: 2, flutes: 1, stock: 8, checkedOut: false, coating: "AlCrN", shank: "Holder S100", bin: "C1-02" },
  { id: "t3023", number: "T-3023", description: "Face mill insert, square", type: "insert", supplier: "Palbit", diameter: 12.7, flutes: 4, stock: 1, checkedOut: false, coating: "CVD", shank: "Cutter 50 mm", bin: "C1-03" },
  { id: "t3024", number: "T-3024", description: "Turning insert, rhombic 80", type: "insert", supplier: "Palbit", diameter: 12.7, flutes: 2, stock: 20, checkedOut: true, coating: "CVD", shank: "Holder PCLNR", bin: "C1-04" },
  { id: "t4031", number: "T-4031", description: "Machine reamer, H7", type: "reamer", supplier: "Evolute", diameter: 8, flutes: 6, stock: 3, checkedOut: false, coating: "Uncoated", shank: "8 mm plain", bin: "D1-01" },
  { id: "t4032", number: "T-4032", description: "Machine reamer, H7", type: "reamer", supplier: "NS Tools", diameter: 12, flutes: 6, stock: 2, checkedOut: false, coating: "TiN", shank: "12 mm plain", bin: "D1-02" },
  { id: "t4033", number: "T-4033", description: "Spiral reamer, H7", type: "reamer", supplier: "PH Horn", diameter: 5, flutes: 4, stock: 0, checkedOut: false, coating: "TiAlN", shank: "6 mm plain", bin: "D1-03" },
];
