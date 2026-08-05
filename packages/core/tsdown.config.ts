import { defineConfig } from "tsdown";

export default defineConfig({
  // https://github.com/TypeStrong/tsdown#configuration
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  platform: "node",
  target: "node20",
  outDir: "dist",
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  deps: {
    neverBundle: ["@signal_slack/notifykit-core", "commander", "zod"],
  },
});
