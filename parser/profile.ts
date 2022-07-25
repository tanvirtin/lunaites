import { Profiler } from "../core/mod.ts";
import { Parser } from "./mod.ts";

const dirname = new URL(".", import.meta.url).pathname;
const source = Deno.readTextFileSync(
  `${dirname}/testdata/scratchpad/example_1`,
);
const epoch = 10e3;

for (let i = 0; i < epoch; ++i) {
  const parser = new Parser(source);

  parser.parse();
}

Profiler.dump();
