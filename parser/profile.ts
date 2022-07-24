import { Profiler } from "../core/mod.ts";
import { Parser } from "./mod.ts";

const dirname = new URL(".", import.meta.url).pathname;
const source = Deno.readTextFileSync(
  `${dirname}/testdata/scratchpad/example_1`,
);
const epoch = 10e3;
const t0 = performance.now();

for (let i = 0; i < epoch; ++i) {
  const parser = new Parser(source);

  parser.parse();
}

const t1 = performance.now();

console.log(`Parser took ${t1 - t0}ms`);
console.log(Profiler.dump());
