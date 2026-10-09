# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-08

Initial public release — zero-dependency Vitest/Jest matchers for asserting LLM
output in the test runner you already use.

### Added
- **Two entry points, identical matchers.**
  - `expect-llm` — augments Vitest's `expect`. Register with
    `import { llmMatchers } from "expect-llm"; expect.extend(llmMatchers);`.
  - `expect-llm/jest` — augments `jest.Matchers`. Register with
    `import { llmMatchers } from "expect-llm/jest"; expect.extend(llmMatchers);`.
  - Both export `llmMatchers`, the named matchers, `toSatisfy`, and the types
    `MatcherState`, `MatcherResult`, `SchemaLike`, `Judge`, `JudgeResult`.
- **Deterministic matchers** (pure, synchronous, no network call):
  - `toBeValidJSON(options?)` — the value is a parseable JSON string; with
    `allowFences: true` a single surrounding markdown code fence is stripped first.
  - `toContainAll(items)` / `toContainNone(items)` / `toContainAny(items)` —
    substring checks over the stringified value, with the offending items named
    in the failure message.
  - `toBeOneOf(allowed)` — the value deep-equals one of the allowed values, using
    the runner's own deep equality where available.
  - `toMatchStructure(reference)` — the value has the same keys and value types as
    `reference`, recursively, ignoring values and array length; `null` is
    distinguished from other types.
  - `toMatchSchema(schema)` — validates against a Zod schema or any Standard
    Schema (`~standard`); a string value is JSON-parsed first (code fences
    tolerated). Synchronous — an async Standard Schema validation throws a clear
    error. The schema library is a user-supplied optional peer, never bundled.
- **Opt-in LLM judge:** `toSatisfy(rubric, judge)` — async, the only matcher that
  can involve a model, and it never calls one itself. You pass a
  `Judge = (output, rubric) => { pass, reason? } | Promise<...>`; the judge's
  `reason` is surfaced in the failure message.
- **Negation:** `.not` works for every matcher, with a correct negated failure
  message.

### Verified
- Unit tests for every matcher (positive and `.not`), both entry points, and the
  judge (sync judge, async judge, argument passing, missing-judge throw).
- Guard tests: deterministic matchers never touch `fetch`; zero runtime
  dependencies; `zod` / `vitest` / `jest` are optional peers only.
- ESM + CJS builds with type declarations; zero-dependency core under the
  `size-limit` budget (roughly 1.41 kB min+brotli).
- 26 tests pass.

[0.1.0]: https://github.com/H1manshu01/expect-llm/releases/tag/v0.1.0
