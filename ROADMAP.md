# Roadmap

`expect-llm` ships `M0-M5` as **v0.1** — the deterministic matchers, both runner
entry points, the opt-in judge, tests, and docs are all in place. It is the
assertion end of the author's LLM dev-tools line (siblings:
[`sse-wire`](https://github.com/H1manshu01/sse-wire),
[`trickle-json`](https://github.com/H1manshu01/trickle-json),
[`coerce-json`](https://github.com/H1manshu01/coerce-json)) and pairs naturally
with `coerce-json` and `zod`.

## M0 — Validate & name (done)
- [x] Competitor scan: promptfoo, DeepEval, Braintrust, Evalite / vitest-evals,
      jest-extended, semantic-expect (see [COMPETITORS.md](./COMPETITORS.md))
- [x] Confirmed the gap: deterministic, zero-dependency, in-runner matchers for
      LLM output that work in **both** Vitest and Jest, with an opt-in judge
- [x] Named and scoped as the "assert the result" step of the pipeline

## M1 — Deterministic matchers (done)
- [x] `toBeValidJSON(options?)` with optional markdown-fence stripping
- [x] `toContainAll` / `toContainNone` / `toContainAny` over the stringified value
- [x] `toBeOneOf` with runner-aware deep equality for a closed set
- [x] `toMatchStructure` — keys + value types, recursive, array-length and
      value agnostic, `null` distinguished from other types
- [x] Framework-agnostic `{ pass, message }` shape; `.not` on every matcher;
      readable positive and negated failure messages

## M2 — Schema matcher (done)
- [x] `toMatchSchema` against a Zod schema (via its own `safeParse`) **or** any
      Standard Schema (`~standard`) — the schema library is user-supplied and
      never bundled or imported
- [x] String values JSON-parsed first (code fences tolerated), so you can assert
      directly on raw model output
- [x] Per-field issue list in the failure message
- [x] Synchronous by contract: an async Standard Schema validation throws a clear
      error rather than silently passing

## M3 — Opt-in LLM judge (done)
- [x] `toSatisfy(rubric, judge)` — async, the only matcher that can involve a
      model, and it never calls one itself
- [x] `Judge = (output, rubric) => { pass, reason? } | Promise<...>` — bring your
      own model/SDK; no API key handling or default provider ships
- [x] The judge's `reason` surfaced in the failure message
- [x] A missing or non-function judge throws a clear, actionable error

## M4 — Tests & guards (done)
- [x] Unit tests for every matcher, positive and `.not` (`test/matchers.test.ts`)
- [x] Judge tests: sync judge, async judge, argument passing, missing-judge throw
      (`test/judge.test.ts`)
- [x] Jest entry parity test — same matcher set, same `{ pass, message }` contract
      (`test/jest-entry.test.ts`)
- [x] Guard tests: deterministic matchers never touch `fetch`; zero runtime
      dependencies; `zod`/`vitest`/`jest` optional peers only (`test/guard.test.ts`)
- [x] 26 tests pass

## M5 — Docs / CI / release (done)
- [x] README with quick start, the matchers table, Vitest and Jest setup, the
      "deterministic by default, judge opt-in" section, the comparison table, the
      guardrails, and the `coerce-json` + `zod` pairing
- [x] `COMPETITORS.md`, `CHANGELOG.md`, launch post draft
- [x] ESM + CJS + `.d.ts` build (tsup); `size-limit` gate on the core
- [ ] npm publish with `--provenance` — needs an `NPM_TOKEN` secret and a
      `v0.1.0` tag (owner action)

## Post-1.0 ideas
- **More matchers.**
  - `toBeValidYAML` — a parseable YAML string, fence-tolerant like `toBeValidJSON`.
  - `toHaveToolCall(name, args?)` — assert a tool/function call appears in an
    assistant message, by name and optionally matching arguments.
  - `toBeWithinTokens(max, { model? })` — assert an output fits a token budget,
    with a bring-your-own tokenizer so no tokenizer is bundled.
- **Cosine-similarity matcher.** A `toBeSemanticallyCloseTo(reference, threshold)`
  with **bring-your-own embeddings** — you pass the embedding function, the
  matcher does the cosine math. Keeps the zero-dependency, no-network, BYO-model
  posture of `toSatisfy`.
- **Snapshot serializer.** A serializer that snapshots `toMatchStructure`'s shape
  view, so a structured response's *shape* can be snapshotted with the runner's
  native snapshot tooling.
- **Asymmetric-matcher support.** First-class use inside `expect.objectContaining`
  and friends (`expect({ body: expect.toBeValidJSON() })`), typed on both runners.

## Known trade-offs (document, don't hide)
- **`toMatchStructure` is key/type based.** It compares the set of keys and the
  JS type of each value, not values, formats, or constraints. It is for a stable
  *shape* snapshot, not for validation — reach for `toMatchSchema` when you need
  a schema's actual rules enforced.
- **Judge quality is your model's.** `toSatisfy` is exactly as reliable, as fast,
  and as deterministic as the `Judge` you pass. The package guarantees the
  wiring and the failure message; it cannot guarantee a model's verdict. Use the
  deterministic matchers wherever a check is objectively decidable, and reserve
  the judge for the genuinely subjective cases.
- **`toMatchSchema` is synchronous.** It does not support async schema validation;
  an async Standard Schema `validate` throws rather than silently passing. Async,
  model-involving checks are the job of `toSatisfy`.
