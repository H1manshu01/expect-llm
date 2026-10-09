import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/jest.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  splitting: true,
  minify: false,
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
