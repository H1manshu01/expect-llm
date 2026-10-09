import { describe, expect, it } from "vitest";
import type { Judge } from "../src/index.js";

describe("toSatisfy", () => {
  it("passes when the judge passes (sync judge)", async () => {
    const judge: Judge = () => ({ pass: true, reason: "polite" });
    await expect("I'm sorry, I can't help with that.").toSatisfy("is a polite refusal", judge);
  });

  it("fails when the judge rejects (async judge)", async () => {
    const judge: Judge = async () => ({ pass: false, reason: "too blunt" });
    await expect("no.").not.toSatisfy("is a polite refusal", judge);
  });

  it("passes the output and rubric to the judge", async () => {
    let seen: { output: string; rubric: string } | undefined;
    const judge: Judge = (output, rubric) => {
      seen = { output, rubric };
      return { pass: true };
    };
    await expect("the answer").toSatisfy("some rubric", judge);
    expect(seen).toEqual({ output: "the answer", rubric: "some rubric" });
  });

  it("throws when no judge function is given", async () => {
    // @ts-expect-error intentionally missing the judge
    await expect(expect("x").toSatisfy("rubric", undefined)).rejects.toThrow(/judge function/);
  });
});
