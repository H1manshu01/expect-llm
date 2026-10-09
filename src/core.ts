/**
 * Shared surface for both runner entry points (no type augmentation here, so
 * neither the Vitest nor the Jest `declare module` leaks into the other).
 */
import { toSatisfy } from "./judge.js";
import {
  toBeOneOf,
  toBeValidJSON,
  toContainAll,
  toContainAny,
  toContainNone,
  toMatchSchema,
  toMatchStructure,
} from "./matchers.js";

export * from "./matchers.js";
export { toSatisfy } from "./judge.js";
export type { Judge, JudgeResult } from "./judge.js";

/** All matchers, ready for `expect.extend(llmMatchers)`. */
export const llmMatchers = {
  toBeValidJSON,
  toContainAll,
  toContainNone,
  toContainAny,
  toBeOneOf,
  toMatchStructure,
  toMatchSchema,
  toSatisfy,
};
