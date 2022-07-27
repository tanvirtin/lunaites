import { MinimizerVisitor, Parser } from "../../parser/mod.ts";
import { path } from "./deps.ts";

function prettyPrintJSON(stringifiedJSON: string) {
  const arr = [],
    _string = "color:green",
    _number = "color:darkorange",
    _boolean = "color:blue",
    _null = "color:magenta",
    _key = "color:red";

  arr.unshift(stringifiedJSON.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match: string) {
      let style = _number;

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          style = _key;
        } else {
          style = _string;
        }
      } else if (/true|false/.test(match)) {
        style = _boolean;
      } else if (/null/.test(match)) {
        style = _null;
      }

      arr.push(style);
      arr.push("");

      return "%c" + match + "%c";
    },
  ));

  console.log.apply(console, arr);
}

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

    prettyPrintJSON(JSON.stringify(minimizedAst, null, 2));
  } catch (err) {
    console.log(err);
  }
};

run();

for await (const _ of watcher) {
  console.clear();
  run();
}
