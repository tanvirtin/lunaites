import { assertEquals } from "./deps.ts";
import { MinimizerVisitor, Parser } from "./mod.ts";

const source = `
  local a = 3;
  local b = 4;

  break;

  return 4 + 5;
`;

Deno.test(
  `
Source test:
------------
${source}
------------
`,
  () => {
    const parser = new Parser(source);
    const ast = parser.parse();
    const minimizerVisitor = new MinimizerVisitor();
    const minimizedAst = minimizerVisitor.visit(ast);

    assertEquals(minimizedAst, {});
  },
);
