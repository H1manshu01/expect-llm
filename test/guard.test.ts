import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

describe("deterministic matchers make no network call", () => {
  it("never touches fetch", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    expect('{"a":1}').toBeValidJSON();
    expect("total 42 USD").toContainAll(["total", "USD"]);
    expect("clean").toContainNone(["TODO"]);
    expect("escalate").toContainAny(["refund", "escalate"]);
    expect("refund").toBeOneOf(["refund", "escalate"]);
    expect({ a: 1 }).toMatchStructure({ a: 0 });
    expect({ id: 1 }).toMatchSchema(z.object({ id: z.number() }));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("packaging", () => {
  it("has zero runtime dependencies", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(pkg.dependencies ?? {}).toEqual({});
  });
  it("keeps zod/vitest/jest as optional peers only", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    for (const peer of ["zod", "vitest", "jest"]) {
      expect(pkg.peerDependencies?.[peer]).toBeTruthy();
      expect(pkg.peerDependenciesMeta?.[peer]?.optional).toBe(true);
    }
  });
});
