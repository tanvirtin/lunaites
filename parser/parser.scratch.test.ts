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
  IfStatement,
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

  do
    local a = 3;
  end

  if 3 == 4 then
    local a = 3;
  elseif 4 == 5 then
    local b = 4;
  else
    local c = 5;
  end

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
        {
          type: IfStatement,
          ifCondition: {
            type: BinaryExpression,
            left: NumericLiteral,
            right: NumericLiteral,
          },
          ifBlock: [
            {
              init: [NumericLiteral],
              type: LocalStatement,
              variables: [Identifier],
            },
          ],
          elseifConditions: [
            {
              type: BinaryExpression,
              left: NumericLiteral,
              right: NumericLiteral,
            },
          ],
          elseifBlocks: [
            [
              {
                type: LocalStatement,
                init: [NumericLiteral],
                variables: [Identifier],
              },
            ],
          ],
          elseBlock: [
            {
              type: LocalStatement,
              init: [NumericLiteral],
              variables: [Identifier],
            },
          ],
        },
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
