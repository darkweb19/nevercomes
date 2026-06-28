import { describe, it, expect } from "vitest";
import { parseOptions } from "@/lib/catalog/options";

describe("parseOptions", () => {
  it("returns [] for non-array / empty / nullish input", () => {
    expect(parseOptions([])).toEqual([]);
    expect(parseOptions(null)).toEqual([]);
    expect(parseOptions("nope")).toEqual([]);
    expect(parseOptions({})).toEqual([]);
  });

  it("parses well-formed single + multi groups", () => {
    const raw = [
      {
        name: "Size",
        kind: "single",
        choices: [{ label: "M", note: "Standard" }, { label: "L" }],
      },
      {
        name: "Add-ons",
        kind: "multi",
        choices: [{ label: "Soft egg", note: "+$0.00" }],
      },
    ];
    expect(parseOptions(raw)).toEqual([
      {
        name: "Size",
        kind: "single",
        choices: [{ label: "M", note: "Standard" }, { label: "L", note: undefined }],
      },
      {
        name: "Add-ons",
        kind: "multi",
        choices: [{ label: "Soft egg", note: "+$0.00" }],
      },
    ]);
  });

  it("drops malformed groups and choices", () => {
    const raw = [
      { name: "NoKind", choices: [{ label: "x" }] }, // missing kind
      { name: "BadKind", kind: "triple", choices: [{ label: "x" }] }, // bad kind
      { name: "Empty", kind: "single", choices: [{ noLabel: true }] }, // no valid choices
      { name: "Good", kind: "single", choices: [{ label: "ok" }, "junk"] },
    ];
    expect(parseOptions(raw)).toEqual([
      { name: "Good", kind: "single", choices: [{ label: "ok", note: undefined }] },
    ]);
  });
});
