/**
 * expect-llm — zero-dependency Vitest/Jest matchers for LLM output.
 *
 * ```ts
 * import { expect } from "vitest";
 * import { llmMatchers } from "expect-llm";
 *
 * expect.extend(llmMatchers);
 *
 * expect(out).toBeValidJSON();
 * expect(out).toMatchSchema(MySchema);        // zod or any Standard Schema
 * expect(out).toContainAll(["total", "USD"]);
 * expect(status).toBeOneOf(["refund", "escalate"]);
 * await expect(answer).toSatisfy("is a polite refusal", judge); // bring your own model
 * ```
 *
 * This entry augments Vitest's `expect`. For Jest, import from `expect-llm/jest`.
 */
import "vitest";
import type { Judge } from "./judge.js";

export * from "./core.js";

interface LlmAssertions {
  toBeValidJSON(options?: { allowFences?: boolean }): void;
  toContainAll(items: string[]): void;
  toContainNone(items: string[]): void;
  toContainAny(items: string[]): void;
  toBeOneOf(allowed: unknown[]): void;
  toMatchStructure(reference: unknown): void;
  toMatchSchema(schema: unknown): void;
  toSatisfy(rubric: string, judge: Judge): Promise<void>;
}

declare module "vitest" {
  interface Assertion<T = any> extends LlmAssertions {}
  interface AsymmetricMatchersContaining extends LlmAssertions {}
}
