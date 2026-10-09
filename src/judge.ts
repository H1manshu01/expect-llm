/**
 * expect-llm — the optional LLM-judge matcher.
 *
 * `toSatisfy` is the only matcher that can call a model, and it never does so
 * itself: you pass a `Judge` function that runs whatever model/SDK you like and
 * returns a verdict. The package bundles no SDK and makes no network call.
 */
import type { MatcherResult, MatcherState } from "./matchers.js";

export interface JudgeResult {
  pass: boolean;
  reason?: string;
}

/** Runs the judgement. Receives the output and the rubric; returns a verdict. */
export type Judge = (output: string, rubric: string) => JudgeResult | Promise<JudgeResult>;

function fmt(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Assert the output satisfies a natural-language `rubric`, as decided by a
 * `judge` you supply. Async — `await expect(output).toSatisfy(rubric, judge)`.
 */
export async function toSatisfy(
  this: MatcherState,
  received: unknown,
  rubric: string,
  judge: Judge,
): Promise<MatcherResult> {
  if (typeof judge !== "function") {
    throw new Error(
      "expect-llm: toSatisfy(rubric, judge) requires a judge function (output, rubric) => { pass, reason }",
    );
  }
  const output = fmt(received);
  const verdict = await judge(output, rubric);
  const pass = Boolean(verdict?.pass);
  const reason = verdict?.reason ? `: ${verdict.reason}` : "";
  return {
    pass,
    message: () =>
      this.isNot
        ? `expected output not to satisfy "${rubric}", but the judge passed it${reason}`
        : `expected output to satisfy "${rubric}", but the judge rejected it${reason}`,
  };
}
