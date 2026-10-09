/**
 * expect-llm/jest — the same matchers, wired for Jest's `expect.extend` and
 * `jest.Matchers` type augmentation.
 *
 * ```ts
 * import { llmMatchers } from "expect-llm/jest";
 * expect.extend(llmMatchers);
 * ```
 */
import type { Judge } from "./judge.js";

export * from "./core.js";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJSON(options?: { allowFences?: boolean }): R;
      toContainAll(items: string[]): R;
      toContainNone(items: string[]): R;
      toContainAny(items: string[]): R;
      toBeOneOf(allowed: unknown[]): R;
      toMatchStructure(reference: unknown): R;
      toMatchSchema(schema: unknown): R;
      toSatisfy(rubric: string, judge: Judge): Promise<R>;
    }
  }
}
