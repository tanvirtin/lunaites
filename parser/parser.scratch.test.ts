import { assertEquals } from "./deps.ts";
import { ast, MinimizerVisitor, Parser } from "./mod.ts";

const {
  Chunk,
  NumericLiteral,
  LocalStatement,
  Identifier,
  BreakStatement,
  BinaryExpression,
  ReturnStatement,
  StringLiteral,
  DoStatement,
  BooleanLiteral,
} = ast.NodeType;

const source = `
  break;
  local foo
  local bar
  local x, y, z
  local j, k, l = 1, 2, 3
  local m, n, o = true, "hello", foo
  local a = 3;
  local b = 4;
  break;

  break;
  do
    local a = 3;
  end
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

    assertEquals(minimizedAst, {
      body: [
        BreakStatement,
        {
          type: LocalStatement,
          variables: [Identifier],
          init: [],
        },
        {
          type: LocalStatement,
          variables: [Identifier],
          init: [],
        },
        {
          type: LocalStatement,
          variables: [Identifier, Identifier, Identifier],
          init: [],
        },
        {
          type: LocalStatement,
          variables: [Identifier, Identifier, Identifier],
          init: [NumericLiteral, NumericLiteral, NumericLiteral],
        },
        {
          type: LocalStatement,
          variables: [Identifier, Identifier, Identifier],
          init: [BooleanLiteral, StringLiteral, Identifier],
        },
        {
          type: LocalStatement,
          variables: [Identifier],
          init: [NumericLiteral],
        },
        {
          type: LocalStatement,
          variables: [Identifier],
          init: [NumericLiteral],
        },
        BreakStatement,
        BreakStatement,
        {
          type: DoStatement,
          body: [
            {
              type: LocalStatement,
              variables: [Identifier],
              init: [NumericLiteral],
            },
          ],
        },
        BreakStatement,
        {
          expressions: [
            {
              left: NumericLiteral,
              right: NumericLiteral,
              type: BinaryExpression,
            },
          ],
          type: ReturnStatement,
        },
      ],
      type: Chunk,
    });
  },
);
