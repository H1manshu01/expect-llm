---
title: "Assert LLM output in the test runner you already use"
published: false
description: "Testing LLM output usually means a brittle hand-rolled JSON.parse + try/catch, or adopting a whole eval platform. expect-llm is the middle option: zero-dependency Vitest/Jest matchers for valid JSON, schema shape, required content, and an opt-in bring-your-own judge."
tags: testing, typescript, ai, opensource
cover_image: https://raw.githubusercontent.com/H1manshu01/expect-llm/main/assets/cover.png
series: "Streaming structured output"
---

You have an LLM call in your product, and a test that exercises it. Now you have
to assert on the output. If it is like most LLM output, it comes back looking
something like this:

````text
```json
{"total": 42, "currency": "USD"}
```
````

JSON, probably valid, maybe wrapped in a markdown fence, with fields you need and
phrases you would rather not see. So you write the assertion by hand:

```ts
let parsed: unknown;
try {
  parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
} catch {
  throw new Error("not valid JSON"); // the real error is now gone
}
const result = Invoice.safeParse(parsed);
expect(result.success).toBe(true);   // and when it fails? "expected false to be true"
expect(raw.includes("total")).toBe(true);
expect(raw.includes("as an AI")).toBe(false);
```

Every line of that is a small papercut. The `try/catch` swallows the parser's
message. `expect(result.success).toBe(true)` throws away every per-field reason
Zod just computed. The `includes` checks can't tell you *which* string was
missing. And you will write it again, slightly differently, in the next test.

The usual escape hatch is to adopt an eval framework — promptfoo, DeepEval,
Braintrust, Evalite. Those are great tools for a real eval suite. But for
"assert this one response in my unit test," they are a CLI, a config file, maybe
an account, and a second mental model that lives outside the `vitest`/`jest` run
you already have.

There is a middle option.

## expect-llm

[`expect-llm`](https://www.npmjs.com/package/expect-llm) is a set of
`expect(...)` matchers for the things LLM output actually gets wrong. Register
them once, then assert inline, in the runner you already run:

```ts
import { expect } from "vitest";
import { z } from "zod";
import { llmMatchers } from "expect-llm";

expect.extend(llmMatchers); // once, in a setup file

const Invoice = z.object({ total: z.number(), currency: z.string() });

expect(out).toBeValidJSON({ allowFences: true });
expect(out).toMatchSchema(Invoice);             // out may be an object OR a JSON string
expect(out).toContainAll(["total", "currency"]);
expect(out).toContainNone(["TODO", "as an AI"]);
expect(decision).toBeOneOf(["refund", "escalate", "deny"]);
```

The whole papercut block from the top collapses into that. And when something
fails, the message tells you what — the missing items, the mismatched field, the
parser's actual error — instead of `expected false to be true`.

It is **zero runtime dependencies**, ships ESM + CJS + types, runs on Node >= 18,
and is roughly 1.41 kB min+brotli. `.not` works on every matcher.

## The matchers

Eight matchers. Seven are deterministic; one is the opt-in judge.

- **`toBeValidJSON(options?)`** — the value is a parseable JSON string. Pass
  `{ allowFences: true }` to strip a surrounding markdown code fence first, which
  is exactly what models wrap JSON in.
- **`toContainAll` / `toContainNone` / `toContainAny`** — substring checks over
  the (stringified) value. `toContainNone(["as an AI", "TODO"])` is the banned-
  phrase guard you keep writing by hand; the failure names the phrase that leaked.
- **`toBeOneOf(allowed)`** — the value deep-equals one of a closed set. For a
  routing or classification decision: `toBeOneOf(["refund", "escalate", "deny"])`.
- **`toMatchStructure(reference)`** — same keys and value *types* as a reference,
  recursively, ignoring the values and array length. A shape snapshot that
  survives a prompt refactor changing the numbers.
- **`toMatchSchema(schema)`** — validate against a Zod schema or any
  [Standard Schema](https://standardschema.dev/). A string value is JSON-parsed
  first, fences tolerated — so you assert on the raw output.
- **`toSatisfy(rubric, judge)`** — the opt-in judge, below.

### Assert on raw output, fences and all

Because `toBeValidJSON` and `toMatchSchema` tolerate a code fence and parse a
string for you, you assert on exactly what the model returned — no pre-cleaning:

````ts
const out = "```json\n{\"total\":42,\"currency\":\"USD\"}\n```";

expect(out).toBeValidJSON({ allowFences: true }); // passes
expect(out).toMatchSchema(Invoice);               // parses, unfences, then validates
````

### Shape, not values

`toMatchStructure` is the one I reach for most. It checks the *shape* of a
response — keys and types — so a test does not break every time the model picks a
different number:

```ts
const reference = { id: 1, name: "x", tags: ["a"], meta: { active: true } };

expect({ id: 9, name: "y", tags: ["p", "q"], meta: { active: false } })
  .toMatchStructure(reference);     // passes: same keys, same types

expect({ id: "9", name: "y", tags: ["p"], meta: { active: true } })
  .not.toMatchStructure(reference); // fails: id is a string, not a number
```

## Deterministic by default; the judge is opt-in

Those seven matchers are pure, synchronous, and **make no network call** — a
guard test fails the build if any of them touches `fetch`. Use them for anything
objectively checkable, which is most of what breaks: valid JSON, schema shape,
required and forbidden content, a closed decision set, a stable structure.

For the subjective checks — "is this a polite refusal?" — there is `toSatisfy`,
and it is deliberately **bring your own model**. `expect-llm` ships no SDK, no
key handling, and no default provider. You pass the model call in:

```ts
import type { Judge } from "expect-llm";

const judge: Judge = async (output, rubric) => {
  const verdict = await myModel(`Does this satisfy "${rubric}"?\n\n${output}\n\nAnswer yes or no.`);
  return { pass: /yes/i.test(verdict), reason: verdict };
};

await expect(answer).toSatisfy("is a concise, polite refusal", judge);
```

Two things fall out of that design. One: the deterministic matchers never cost a
token, so your CI stays fast and reproducible and the model call happens only
where you opt in. Two: the judge is a plain function, so a stub judge lets you
test the *wiring* in CI without a network call, and the judge's `reason` shows up
in the failure message when the assertion fails.

## Vitest or Jest — same matchers

Register once in a setup file. The entry point is the only thing that differs:

```ts
// Vitest — vitest.setup.ts
import { expect } from "vitest";
import { llmMatchers } from "expect-llm";
expect.extend(llmMatchers);
```

```ts
// Jest — jest.setup.ts
import { llmMatchers } from "expect-llm/jest";
expect.extend(llmMatchers);
```

The Vitest entry augments Vitest's `expect` types; the Jest entry augments
`jest.Matchers`. Same matcher set, typed on both.

## It pairs with coerce-json and zod

`expect-llm` is the assertion end of a small line of zero-dependency LLM
dev-tools I maintain. In a structured-output flow it sits right after
[`coerce-json`](https://www.npmjs.com/package/coerce-json), which repairs and
coerces almost-valid model output to fit a schema. Coerce first, then assert the
result — `toMatchSchema` takes the same Zod schema:

```ts
import { coerce } from "coerce-json/zod";

const { value, ok } = coerce(rawModelOutput, Invoice);
expect(ok).toBe(true);
expect(value).toMatchSchema(Invoice);
expect(value).toContainAll(["total", "currency"]);
```

The full suite, each piece zero-dependency and useful on its own:

```
fetch -> SSE (sse-wire) -> parse partial JSON (trickle-json) -> coerce to schema (coerce-json) -> assert (expect-llm)
```

- **[sse-wire](https://www.npmjs.com/package/sse-wire)** — fetch-based SSE client for LLM streams.
- **[trickle-json](https://www.npmjs.com/package/trickle-json)** — incremental partial-JSON parser for those streams.
- **[coerce-json](https://www.npmjs.com/package/coerce-json)** — repair and coerce to your schema, logging every fix.
- **[expect-llm](https://www.npmjs.com/package/expect-llm)** — assert the result in Vitest or Jest. (this one)

## Try it

```sh
npm install -D expect-llm
```

- **npm:** https://www.npmjs.com/package/expect-llm
- **GitHub:** https://github.com/H1manshu01/expect-llm
- Zero runtime dependencies, ESM + CJS, full types, published with provenance.
  `vitest`, `jest`, and `zod` are optional peers — bring only the ones you use.

If a matcher's failure message is ever less helpful than the hand-rolled
assertion it replaced, open an issue — readable failures are the whole point. A
star is appreciated if it saves you a pile of `try/catch` boilerplate.
