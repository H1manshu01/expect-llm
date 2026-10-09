import { describe, expect, it } from "vitest";
import type { MatcherState } from "../src/index.js";
import * as jestEntry from "../src/jest.js";
import { llmMatchers } from "../src/jest.js";

const NAMES = [
  "toBeValidJSON",
  "toContainAll",
  "toContainNone",
  "toContainAny",
  "toBeOneOf",
  "toMatchStructure",
  "toMatchSchema",
  "toSatisfy",
] as const;

const state: MatcherState = { isNot: false };

describe("jest entry", () => {
  it("exports the same matchers and llmMatchers", () => {
    for (const name of NAMES) {
      expect(typeof (llmMatchers as Record<string, unknown>)[name]).toBe("function");
      expect(typeof (jestEntry as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("matchers satisfy the { pass, message } contract when called directly", () => {
    const ok = llmMatchers.toBeValidJSON.call(state, '{"a":1}');
    expect(ok.pass).toBe(true);
    expect(typeof ok.message()).toBe("string");

    const bad = llmMatchers.toBeValidJSON.call(state, "nope");
    expect(bad.pass).toBe(false);
    expect(bad.message()).toContain("valid JSON");

    expect(llmMatchers.toContainAll.call(state, "a b", ["a", "b"]).pass).toBe(true);
    expect(llmMatchers.toBeOneOf.call(state, "x", ["x", "y"]).pass).toBe(true);
  });
});
