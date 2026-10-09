import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("toBeValidJSON", () => {
  it("passes for a valid JSON string", () => {
    expect('{"a":1}').toBeValidJSON();
    expect("[1,2,3]").toBeValidJSON();
  });
  it("fails for broken JSON and non-strings", () => {
    expect('{"a":').not.toBeValidJSON();
    expect({ a: 1 }).not.toBeValidJSON(); // not a string
  });
  it("strips code fences when allowed", () => {
    const fenced = '```json\n{"a":1}\n```';
    expect(fenced).not.toBeValidJSON(); // fence makes it invalid
    expect(fenced).toBeValidJSON({ allowFences: true });
  });
});

describe("toContainAll / toContainNone / toContainAny", () => {
  it("toContainAll", () => {
    expect("total: 42 USD").toContainAll(["total", "USD"]);
    expect("total: 42").not.toContainAll(["total", "USD"]);
  });
  it("toContainNone", () => {
    expect("a clean answer").toContainNone(["TODO", "as an AI"]);
    expect("as an AI, I cannot").not.toContainNone(["as an AI"]);
  });
  it("toContainAny", () => {
    expect("please escalate this").toContainAny(["refund", "escalate"]);
    expect("no match here").not.toContainAny(["refund", "escalate"]);
  });
  it("stringifies non-string values", () => {
    expect({ city: "London" }).toContainAll(["London"]);
  });
});

describe("toBeOneOf", () => {
  it("matches a closed set", () => {
    expect("refund").toBeOneOf(["refund", "escalate"]);
    expect("delete").not.toBeOneOf(["refund", "escalate"]);
  });
  it("deep-equals objects", () => {
    expect({ a: 1 }).toBeOneOf([{ a: 1 }, { a: 2 }]);
  });
});

describe("toMatchStructure", () => {
  const ref = { id: 1, name: "x", tags: ["a"], meta: { active: true } };
  it("matches same shape, ignoring values and array length", () => {
    expect({ id: 9, name: "y", tags: ["p", "q"], meta: { active: false } }).toMatchStructure(ref);
  });
  it("fails on differing keys", () => {
    expect({ id: 9, name: "y", tags: ["p"] }).not.toMatchStructure(ref);
  });
  it("fails on differing types", () => {
    expect({ id: "9", name: "y", tags: ["p"], meta: { active: true } }).not.toMatchStructure(ref);
  });
  it("distinguishes null from other types", () => {
    expect({ a: null }).toMatchStructure({ a: null });
    expect({ a: 1 }).not.toMatchStructure({ a: null });
  });
});

describe("toMatchSchema (zod)", () => {
  const User = z.object({ id: z.number(), name: z.string() });
  it("passes a matching object", () => {
    expect({ id: 1, name: "Ada" }).toMatchSchema(User);
  });
  it("fails a mismatched object", () => {
    expect({ id: "x" }).not.toMatchSchema(User);
  });
  it("parses a JSON string first (fences tolerated)", () => {
    expect('{"id":1,"name":"Ada"}').toMatchSchema(User);
    expect('```json\n{"id":1,"name":"Ada"}\n```').toMatchSchema(User);
  });
});

describe("toMatchSchema (Standard Schema)", () => {
  const numberSchema = {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: (v: unknown) =>
        typeof v === "number" ? { value: v } : { issues: [{ message: "must be a number" }] },
    },
  };
  it("passes and fails via the Standard Schema path", () => {
    expect(5).toMatchSchema(numberSchema);
    expect("not-a-number").not.toMatchSchema(numberSchema);
  });
});
