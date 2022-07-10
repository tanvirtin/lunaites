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
  BooleanLiteral,
} = ast.NodeType;

const source = `
  local foo
  local bar
  local x, y, z
  local j, k, l = 1, 2, 3
  local m, n, o = true, "hello", foo
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

    assertEquals(minimizedAst, {
      body: [
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
