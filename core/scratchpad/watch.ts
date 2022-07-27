import { MinimizerVisitor, Parser } from "../../parser/mod.ts";
import { path } from "./deps.ts";

const filename = path.join(
  new URL(".", import.meta.url).pathname,
  "scratchpad",
);
const watcher = Deno.watchFs(filename);

const run = () => {
  const parser = new Parser(Deno.readTextFileSync(filename));
  try {
    const ast = parser.parse();
    const minimizerVisitor = new MinimizerVisitor();
    const minimizedAst = minimizerVisitor.visit(ast);

    console.log(JSON.stringify(minimizedAst, null, 2));
  } catch (err) {
    console.log(err);
  }
};

run();

for await (const _ of watcher) {
  console.clear();
  run();
}
