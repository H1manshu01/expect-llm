# Competitor scan (M0)

Why `expect-llm` exists: asserting LLM output inside a normal test suite is
solved today only at the two extremes. At one end you hand-roll the assertion —
`JSON.parse` in a `try/catch`, a pile of `includes()` checks, a wrapped
`schema.parse()` — and get unreadable failures. At the other end you adopt a full
eval framework or a hosted platform — a CLI, a config file, an account, a second
mental model outside your test run. Nothing in between offered **deterministic,
zero-dependency, in-runner matchers** that work in **both Vitest and Jest**, add
a schema-shape matcher, and keep the model call **opt-in and bring-your-own**.
That is the gap `expect-llm` fills.

Where a specific detail of a third-party project could have changed, claims are
dated "as of early 2026" and kept general rather than invented. Re-check current
behavior against each project before quoting it.

> **One honest note.** A dev.to post circulating in this space claimed OpenAI
> acquired promptfoo. The claim could not be second-sourced against any primary
> announcement at the time of writing, so it is treated here as an **unverified
> rumor** and plays no part in this comparison. Verify independently before
> repeating it.

---

## promptfoo

**What it does.** An open-source LLM eval and red-teaming framework. You declare
test cases and assertions in a YAML/JSON config (prompts, providers, and a set of
assertion types that include deterministic checks and model-graded ones) and run
them with its own CLI, which produces a results matrix and a web view. As of
early 2026 it is a widely used, actively maintained project.

**What it misses vs. `expect-llm`.**
- **Lives outside your test runner.** It is its own config file, CLI, and result
  format — a parallel system to the `vitest`/`jest` run you already have. For
  asserting one response inside an existing unit test, that is a lot of
  apparatus. `expect-llm` is just `expect(...)` matchers in the suite you run now.
- **Config-first, not code-first.** Its model is declarative test files, not
  inline assertions next to the code under test.
- **Not zero-dependency, not a library you import.** `expect-llm` is a small,
  zero-runtime-dependency import with no config and no service.

The two are complementary at different scales: promptfoo for a standalone graded
eval suite, `expect-llm` for assertions that live beside your code.

## DeepEval

**What it does.** An LLM evaluation framework built around pytest, with a library
of metrics (answer relevancy, faithfulness, hallucination, and more), many of
them LLM-as-judge, plus dataset and reporting tooling. As of early 2026 it is a
popular choice in the Python ecosystem.

**What it misses vs. `expect-llm`.**
- **Python, not your JS/TS runner.** It integrates with pytest. A TypeScript
  project testing in Vitest or Jest cannot use it in-process. `expect-llm` is
  TypeScript-native, in your runner.
- **Metric/judge-centric.** Its headline metrics are model-graded, so they carry
  a model dependency and non-determinism by default. `expect-llm` is deterministic
  by default and keeps the judge opt-in and bring-your-own.
- **Heavier footprint.** A framework with datasets and metrics, versus a
  zero-dependency matcher set.

## Braintrust

**What it does.** A commercial LLM eval and observability **platform** — an SDK
for logging and scoring plus a hosted UI for experiments, datasets, and
regression tracking. As of early 2026 it is a well-known product in the space.

**What it misses vs. `expect-llm`.**
- **A service and an account, not a local library.** Its value is the hosted
  platform — logging, dashboards, collaboration. `expect-llm` is an offline,
  zero-dependency import with no account, no network, and no data leaving the
  process.
- **Built for eval suites and monitoring, not unit-test assertions.** Different
  job: Braintrust tracks eval runs over time; `expect-llm` asserts a single
  response, now, in your test.
- **Not zero-dependency or free of external dependencies.**

For teams running large, tracked eval programs, a platform like Braintrust is the
right tool. For "assert this response in my test," it is far more than needed.

## Evalite / vitest-evals

**What it does.** An in-runner **eval harness** built on Vitest: you write evals
as tests, supply scorers (including model-graded scorers), and get an eval report
through Vitest. As of early 2026 it is the closest in spirit to `expect-llm` —
both live inside the test runner.

**What it misses vs. `expect-llm`.**
- **It is an eval harness, not a matcher set.** Its unit is a scored eval with a
  scorer function and a report, which is heavier than an inline `expect(...)`
  assertion when you just want to assert a property of one response.
- **Vitest only.** `expect-llm` ships a Jest entry with the identical matchers, so
  the same assertions run in both runners.
- **Scorer-centric and often model-graded.** `expect-llm` leads with deterministic
  matchers and a schema-shape matcher, and keeps the judge opt-in.

They can coexist: use Evalite for scored eval runs, `expect-llm` for the
deterministic assertions inside ordinary tests.

## jest-extended

**What it does.** A large collection of additional general-purpose Jest matchers
(`toBeArray`, `toContainAllKeys`, `toBeWithin`, and many more). Well established,
widely used, actively maintained as of early 2026. (It is the general-purpose
analogue of what `expect-llm` does for LLM output — in fact `toContainAll` here
echoes its naming.)

**What it misses vs. `expect-llm`.**
- **Nothing LLM-specific.** It has no matcher for "is this valid JSON output",
  "does this fit a Zod schema", "match this response's structure", or "ask a
  judge". Those are exactly `expect-llm`'s matchers.
- **No schema integration, no judge.** It is general assertion sugar, not an
  LLM-output assertion layer.
- **Jest only.** `expect-llm` works in Vitest and Jest.

They are complementary: install both and `expect-llm` adds the LLM-output axis on
top of jest-extended's general matchers.

## semantic-expect

**What it does.** Matchers that assert **semantic** similarity between strings
using text embeddings (for example, a "semantically close to" matcher), aimed at
testing that model output means roughly the same thing as an expected answer. As
of early 2026 it is a small, focused project.

**What it misses vs. `expect-llm`.**
- **Different axis, with a model dependency.** It measures embedding similarity,
  which needs an embedding model and is inherently non-deterministic and
  threshold-tuned. `expect-llm`'s core matchers are deterministic, offline, and
  make no network call. (A bring-your-own-embeddings cosine matcher is on
  `expect-llm`'s post-1.0 roadmap — it would keep the no-network, BYO-model
  posture by making you pass the embedding function in.)
- **Narrow surface.** Semantic closeness only — no valid-JSON, schema-shape,
  content, closed-set, or structure matchers.
- **Not purpose-built for the structured-output checks** (valid JSON, schema
  conformance, required/forbidden content) that dominate LLM integration tests.

---

## The gap, in one line

| Capability | expect-llm | promptfoo | DeepEval | Braintrust | Evalite / vitest-evals | jest-extended | semantic-expect |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| In your existing test runner | Vitest + Jest | own CLI | pytest | SDK + hosted | Vitest only | Jest only | Jest/Vitest |
| Deterministic checks (no model) | Yes | Partial | Partial | Partial | Partial | Yes (general) | No |
| LLM judge | opt-in, BYO | built-in | built-in | built-in | via scorers | — | — |
| Schema-shape matcher (Zod / Standard Schema) | Yes | — | — | — | — | — | — |
| Zero runtime dependencies | Yes | No | No | No | No | No | No |
| No account / service / config file | Yes | config | — | account | config | Yes | Yes |
| Purpose-built for LLM output | Yes | Yes | Yes | Yes | Yes | No | Partial |

`expect-llm` is the only row that is a deterministic, zero-dependency, in-runner
matcher set, working in both Vitest and Jest, with a schema-shape matcher and a
model call that is opt-in and bring-your-own.
