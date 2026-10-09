// Cross-runtime smoke test against the BUILT output (dist/).
// Runs under both Node and Bun with NO test runner and NO DOM: it must not use
// `expect`/`expect.extend`. Instead it imports the framework-agnostic matcher
// functions from dist/ and calls them directly with a synthetic matcher state,
// asserting the returned { pass, message }. No network.
import assert from "node:assert/strict";
import * as index from "../dist/index.js";
import * as jest from "../dist/jest.js";

const NAMED = [
  "toBeValidJSON",
  "toContainAll",
  "toContainNone",
  "toContainAny",
  "toBeOneOf",
  "toMatchStructure",
  "toMatchSchema",
  "toSatisfy",
];

// Synthetic matcher state: matchers are `function(this, received, ...args)`.
const state = { isNot: false };

// Both entrypoints export `llmMatchers` and all 8 named matchers as functions.
for (const [name, mod] of [
  ["index", index],
  ["jest", jest],
]) {
  assert.equal(typeof mod.llmMatchers, "object", `${name}: llmMatchers is an object`);
  for (const key of NAMED) {
    assert.equal(typeof mod[key], "function", `${name}: ${key} is a function`);
    assert.equal(
      typeof mod.llmMatchers[key],
      "function",
      `${name}: llmMatchers.${key} is a function`,
    );
  }
}

const { toBeValidJSON, toContainAll, toBeOneOf, toMatchStructure, toMatchSchema, toSatisfy } =
  index;

// toBeValidJSON: valid object, invalid string, and fenced JSON when allowed.
const okJson = toBeValidJSON.call(state, '{"a":1}');
assert.equal(okJson.pass, true);
assert.equal(typeof okJson.message(), "string");

const badJson = toBeValidJSON.call(state, "nope");
assert.equal(badJson.pass, false);
assert.equal(typeof badJson.message(), "string");

const fencedJson = toBeValidJSON.call(state, '```json\n{"a":1}\n```', { allowFences: true });
assert.equal(fencedJson.pass, true);

// toContainAll: all present passes, a missing one fails.
assert.equal(toContainAll.call(state, "total 42 USD", ["total", "USD"]).pass, true);
assert.equal(toContainAll.call(state, "total 42 USD", ["total", "EUR"]).pass, false);

// toBeOneOf: member passes, non-member fails.
assert.equal(toBeOneOf.call(state, "refund", ["refund", "escalate"]).pass, true);
assert.equal(toBeOneOf.call(state, "ignore", ["refund", "escalate"]).pass, false);

// toMatchStructure: same shape passes, differing keys fail.
assert.equal(toMatchStructure.call(state, { a: 1, b: "x" }, { a: 0, b: "y" }).pass, true);
assert.equal(toMatchStructure.call(state, { a: 1, c: "x" }, { a: 0, b: "y" }).pass, false);

// toMatchSchema with a tiny inline Standard Schema object (no zod import).
const schema = {
  "~standard": {
    version: 1,
    vendor: "smoke",
    validate: (v) =>
      typeof v === "number" ? { value: v } : { issues: [{ message: "not a number" }] },
  },
};
assert.equal(toMatchSchema.call(state, 5, schema).pass, true);
assert.equal(toMatchSchema.call(state, "x", schema).pass, false);

// toSatisfy is async and takes (received, rubric, judge).
const satisfied = await toSatisfy.call(state, "hi", "greets", async () => ({ pass: true }));
assert.equal(satisfied.pass, true);

console.log(`smoke ok (${typeof Bun !== "undefined" ? "bun" : "node"})`);
