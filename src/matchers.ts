/**
 * expect-llm — deterministic matchers (zero dependency, no model call).
 *
 * Each matcher is a framework-agnostic function of the shape Vitest and Jest
 * both accept via `expect.extend`: it receives the asserted value plus args,
 * reads `this.isNot`/`this.equals` from the matcher state, and returns
 * `{ pass, message }`. No network, no bundled schema library.
 */

/** The subset of the Vitest/Jest matcher state these matchers rely on. */
export interface MatcherState {
  isNot: boolean;
  equals?: (a: unknown, b: unknown) => boolean;
}

export interface MatcherResult {
  pass: boolean;
  message: () => string;
}

/** A schema accepted by `toMatchSchema`: a Zod schema or any Standard Schema. */
export interface SchemaLike {
  safeParse?: (data: unknown) => { success: boolean; error?: unknown };
  "~standard"?: {
    validate: (value: unknown) => { value: unknown } | { issues: unknown } | PromiseLike<unknown>;
  };
}

function fmt(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Strip a single surrounding markdown code fence, if present. */
function stripFences(text: string): string {
  const t = text.trim();
  const fenced = t.match(/^```[^\n`]*\n([\s\S]*?)\n?```$/);
  if (fenced?.[1] !== undefined) return fenced[1];
  const inline = t.match(/^`([^`]*)`$/);
  if (inline?.[1] !== undefined) return inline[1];
  return text;
}

function kindOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/** Assert the value is a parseable JSON string (optionally inside a code fence). */
export function toBeValidJSON(
  this: MatcherState,
  received: unknown,
  options?: { allowFences?: boolean },
): MatcherResult {
  const allowFences = options?.allowFences ?? false;
  let pass = false;
  let detail = "";
  if (typeof received !== "string") {
    detail = `received value is not a string (got ${kindOf(received)})`;
  } else {
    const text = allowFences ? stripFences(received) : received;
    try {
      JSON.parse(text);
      pass = true;
    } catch (e) {
      detail = (e as Error).message;
    }
  }
  return {
    pass,
    message: () =>
      this.isNot
        ? "expected value not to be valid JSON, but it parsed successfully"
        : `expected value to be valid JSON${allowFences ? " (fences allowed)" : ""}, but ${detail}`,
  };
}

/** Assert every item is a substring of the value (stringified). */
export function toContainAll(
  this: MatcherState,
  received: unknown,
  items: string[],
): MatcherResult {
  const text = typeof received === "string" ? received : fmt(received);
  const missing = items.filter((it) => !text.includes(it));
  return {
    pass: missing.length === 0,
    message: () =>
      this.isNot
        ? `expected value not to contain all of ${fmt(items)}, but it contained every one`
        : `expected value to contain all of ${fmt(items)}, but these were missing: ${fmt(missing)}`,
  };
}

/** Assert none of the items appear in the value (stringified). */
export function toContainNone(
  this: MatcherState,
  received: unknown,
  items: string[],
): MatcherResult {
  const text = typeof received === "string" ? received : fmt(received);
  const found = items.filter((it) => text.includes(it));
  return {
    pass: found.length === 0,
    message: () =>
      this.isNot
        ? `expected value to contain at least one of ${fmt(items)}, but it contained none`
        : `expected value to contain none of ${fmt(items)}, but these were present: ${fmt(found)}`,
  };
}

/** Assert at least one of the items appears in the value (stringified). */
export function toContainAny(
  this: MatcherState,
  received: unknown,
  items: string[],
): MatcherResult {
  const text = typeof received === "string" ? received : fmt(received);
  const found = items.filter((it) => text.includes(it));
  return {
    pass: found.length > 0,
    message: () =>
      this.isNot
        ? `expected value to contain none of ${fmt(items)}, but these were present: ${fmt(found)}`
        : `expected value to contain at least one of ${fmt(items)}, but none were present`,
  };
}

/** Assert the value equals one of the allowed values (deep equality). */
export function toBeOneOf(
  this: MatcherState,
  received: unknown,
  allowed: unknown[],
): MatcherResult {
  const eq = this.equals ?? ((a: unknown, b: unknown) => Object.is(a, b) || fmt(a) === fmt(b));
  return {
    pass: allowed.some((a) => eq(received, a)),
    message: () =>
      this.isNot
        ? `expected ${fmt(received)} not to be one of ${fmt(allowed)}`
        : `expected ${fmt(received)} to be one of ${fmt(allowed)}`,
  };
}

function structureMatch(
  recv: unknown,
  ref: unknown,
  path: string,
): { ok: true } | { ok: false; path: string; detail: string } {
  const rt = kindOf(ref);
  const vt = kindOf(recv);
  if (rt !== vt) return { ok: false, path: path || "(root)", detail: `expected ${rt}, got ${vt}` };
  if (rt === "object") {
    const refKeys = Object.keys(ref as object).sort();
    const recvKeys = Object.keys(recv as object).sort();
    if (refKeys.join(",") !== recvKeys.join(",")) {
      return {
        ok: false,
        path: path || "(root)",
        detail: `keys differ: expected [${refKeys.join(", ")}], got [${recvKeys.join(", ")}]`,
      };
    }
    for (const k of refKeys) {
      const r = structureMatch(
        (recv as Record<string, unknown>)[k],
        (ref as Record<string, unknown>)[k],
        path ? `${path}.${k}` : k,
      );
      if (!r.ok) return r;
    }
    return { ok: true };
  }
  if (rt === "array") {
    const refArr = ref as unknown[];
    const recvArr = recv as unknown[];
    if (refArr.length === 0) return { ok: true }; // no element structure to compare against
    for (let i = 0; i < recvArr.length; i++) {
      const r = structureMatch(recvArr[i], refArr[0], `${path}[${i}]`);
      if (!r.ok) return r;
    }
    return { ok: true };
  }
  return { ok: true }; // scalar kinds already matched
}

/** Assert the value has the same shape (keys and value types) as a reference, ignoring values. */
export function toMatchStructure(
  this: MatcherState,
  received: unknown,
  reference: unknown,
): MatcherResult {
  const res = structureMatch(received, reference, "");
  return {
    pass: res.ok,
    message: () =>
      this.isNot
        ? "expected value not to match the reference structure, but it did"
        : `expected value to match the reference structure, but at ${res.ok ? "" : res.path}: ${res.ok ? "" : res.detail}`,
  };
}

function formatIssues(schema: SchemaLike, value: unknown): { ok: boolean; issues: string } {
  const std = schema["~standard"];
  if (std && typeof std.validate === "function") {
    const res = std.validate(value) as
      | { value?: unknown; issues?: readonly { message: string; path?: readonly unknown[] }[] }
      | PromiseLike<unknown>;
    if (res && typeof (res as PromiseLike<unknown>).then === "function") {
      throw new Error(
        "expect-llm: async Standard Schema validation is not supported in toMatchSchema",
      );
    }
    const r = res as { issues?: readonly { message: string; path?: readonly unknown[] }[] };
    if (r.issues && r.issues.length > 0) {
      const lines = r.issues.map((i) => {
        const p = (i.path ?? [])
          .map((seg) =>
            typeof seg === "object" && seg !== null ? (seg as { key: unknown }).key : seg,
          )
          .join(".");
        return `${p || "(root)"}: ${i.message}`;
      });
      return { ok: false, issues: lines.join("; ") };
    }
    return { ok: true, issues: "" };
  }
  if (typeof schema.safeParse === "function") {
    const res = schema.safeParse(value);
    if (res.success) return { ok: true, issues: "" };
    const err = res.error as { issues?: { path?: (string | number)[]; message: string }[] };
    const lines = (err.issues ?? []).map(
      (i) => `${(i.path ?? []).join(".") || "(root)"}: ${i.message}`,
    );
    return { ok: false, issues: lines.join("; ") || "validation failed" };
  }
  throw new Error("expect-llm: toMatchSchema expects a Zod schema or a Standard Schema validator");
}

/**
 * Assert the value satisfies a Zod schema or any Standard Schema. A string
 * value is JSON-parsed first (code fences tolerated).
 */
export function toMatchSchema(
  this: MatcherState,
  received: unknown,
  schema: SchemaLike,
): MatcherResult {
  let value = received;
  if (typeof received === "string") {
    try {
      value = JSON.parse(stripFences(received));
    } catch {
      value = received; // leave as string; the schema will report the mismatch
    }
  }
  const { ok, issues } = formatIssues(schema, value);
  return {
    pass: ok,
    message: () =>
      this.isNot
        ? "expected value not to match the schema, but it did"
        : `expected value to match the schema, but: ${issues}`,
  };
}
