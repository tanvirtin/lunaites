import { ast, MinimizerVisitor, Parser, SerializerVisitor } from "./mod.ts";
import { assertEquals, assertStrictEquals, describe, it } from "./deps.ts";

const {
  BinaryExpression,
  LocalStatement,
  Identifier,
  ReturnStatement,
  UnaryExpression,
  FunctionExpression,
  FunctionStatement,
  NumericLiteral,
  GroupingExpression,
  BreakStatement,
  ForNumericStatement,
  StringLiteral,
  BooleanLiteral,
  NilLiteral,
  VarargLiteral,
  CommentLiteral,
  IfStatement,
  DoStatement,
  Chunk,
} = ast.NodeType;

function createParser(source: string) {
  return new Parser(source);
}

function test(
  methonName: string,
  testTable: Record<string, unknown>,
  computation: (source: string, result: unknown) => void,
) {
  describe(methonName, () => {
    Object.entries(testTable).forEach(([source, result]) => {
      it(
        `when source is "${source}"`,
        computation.bind(null, source, result),
      );
    });
  });
}

describe("Parser", () => {
  let parser: Parser;

  test("parseExpression", {
    "0": {
      type: NumericLiteral,
      value: "0",
    },
    "foo": {
      type: Identifier,
      name: "foo",
    },
    "'Hello, world!'": {
      type: StringLiteral,
      value: "'Hello, world!'",
    },
    '"Hello, world!"': {
      type: StringLiteral,
      value: '"Hello, world!"',
    },
    "true": {
      type: BooleanLiteral,
      value: "true",
    },
    "false": {
      type: BooleanLiteral,
      value: "false",
    },
    "nil": {
      type: NilLiteral,
      value: "nil",
    },
    "...": {
      type: VarargLiteral,
      value: "...",
    },
    "--\n": {
      type: CommentLiteral,
      value: "--",
    },
    // or has a lower precedence over and
    "true and false or true": {
      type: BinaryExpression,
      operator: "or",
      left: {
        type: BinaryExpression,
        operator: "and",
        left: {
          type: BooleanLiteral,
          value: "true",
        },
        right: {
          type: BooleanLiteral,
          value: "false",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "true",
      },
    },
    // and has a lower precedence over comparison
    "true and false > 1": {
      type: BinaryExpression,
      operator: "and",
      left: {
        type: BooleanLiteral,
        value: "true",
      },
      right: {
        type: BinaryExpression,
        operator: ">",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: NumericLiteral,
          value: "1",
        },
      },
    },
    // or has a lower precedence over comparison
    "true or true > 4": {
      type: BinaryExpression,
      operator: "or",
      left: {
        type: BooleanLiteral,
        value: "true",
      },
      right: {
        type: BinaryExpression,
        operator: ">",
        left: {
          type: BooleanLiteral,
          value: "true",
        },
        right: {
          type: NumericLiteral,
          value: "4",
        },
      },
    },
    // < has the same precedence as ==
    // But == appears before
    "false == 2 < 1": {
      type: BinaryExpression,
      operator: "<",
      left: {
        type: BinaryExpression,
        operator: "==",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    // < has the same precedence as ==
    // But == appears after, so it has lower precedence.
    "1 < 2 == false": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: BinaryExpression,
        operator: "<",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "false",
      },
    },
    // > has the same precedence as ==
    // But > appears after, so it has lower precedence.
    "false == 1 > 2": {
      type: BinaryExpression,
      operator: ">",
      left: {
        type: BinaryExpression,
        operator: "==",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: NumericLiteral,
          value: "1",
        },
      },
      right: {
        type: NumericLiteral,
        value: "2",
      },
    },
    // <= has the same precedence as ==
    // But <= appears after so it has lower precedence
    "false == 2 <= 1": {
      type: BinaryExpression,
      operator: "<=",
      left: {
        type: BinaryExpression,
        operator: "==",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    // <= has the same precedence as ==
    // But == appears after so it has lower precedence
    "false <= true == 1": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: BinaryExpression,
        operator: "<=",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: BooleanLiteral,
          value: "true",
        },
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    // >= has the same precedence as ==
    // But >= appears after so it has lower precedence
    "false == 1 >= 2": {
      type: BinaryExpression,
      operator: ">=",
      left: {
        type: BinaryExpression,
        operator: "==",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: NumericLiteral,
          value: "1",
        },
      },
      right: {
        type: NumericLiteral,
        value: "2",
      },
    },
    // >= has the same precedence as ==
    // But == appears after so it has lower precedence
    "false >= 1 == 2": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: BinaryExpression,
        operator: ">=",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: NumericLiteral,
          value: "1",
        },
      },
      right: {
        type: NumericLiteral,
        value: "2",
      },
    },
    // ~= has the same precedence as ==
    // But == appears after so it has lower precedence
    "false ~= true == false": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: BinaryExpression,
        operator: "~=",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: BooleanLiteral,
          value: "true",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "false",
      },
    },
    // ~= has the same precedence as ==
    // But ~= appears after so it has lower precedence
    "false == true ~= false": {
      type: BinaryExpression,
      operator: "~=",
      left: {
        type: BinaryExpression,
        operator: "==",
        left: {
          type: BooleanLiteral,
          value: "false",
        },
        right: {
          type: BooleanLiteral,
          value: "true",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "false",
      },
    },
    // == has lower precedence than |
    "1 | 2 == false": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: BinaryExpression,
        operator: "|",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "false",
      },
    },
    // | has lower precedence than ~
    "1 | 2 ~ 3": {
      type: BinaryExpression,
      operator: "|",
      left: {
        type: NumericLiteral,
        value: "1",
      },
      right: {
        type: BinaryExpression,
        operator: "~",
        left: {
          type: NumericLiteral,
          value: "2",
        },
        right: {
          type: NumericLiteral,
          value: "3",
        },
      },
    },
    // ~ has lower precedence than &
    "1 & 2 ~ 3": {
      type: BinaryExpression,
      operator: "~",
      left: {
        type: BinaryExpression,
        operator: "&",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // & has lower precedence than >>
    "1 >> 2 & 3": {
      type: BinaryExpression,
      operator: "&",
      left: {
        type: BinaryExpression,
        operator: ">>",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // >> has the same precedence as <<
    // But << appears after so it has lower precedence
    "1 >> 2 << 3": {
      type: BinaryExpression,
      operator: "<<",
      left: {
        type: BinaryExpression,
        operator: ">>",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // >> has the same precedence as <<
    // But >> appears after so it has lower precedence
    "1 << 2 >> 3": {
      type: BinaryExpression,
      operator: ">>",
      left: {
        type: BinaryExpression,
        operator: "<<",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // == has a lower precedence than ..
    "'3' .. '4' == 34": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: BinaryExpression,
        operator: "..",
        left: {
          type: StringLiteral,
          value: "'3'",
        },
        right: {
          type: StringLiteral,
          value: "'4'",
        },
      },
      right: {
        type: NumericLiteral,
        value: "34",
      },
    },
    // + has the same precedence as -
    // But - appears after so it has lower precedence
    "9 + 33 - 1": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: BinaryExpression,
        operator: "+",
        left: {
          type: NumericLiteral,
          value: "9",
        },
        right: {
          type: NumericLiteral,
          value: "33",
        },
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    // - has the same precedence as +
    // But + appears after so it has lower precedence
    "1 - 2 + 3": {
      type: BinaryExpression,
      operator: "+",
      left: {
        type: BinaryExpression,
        operator: "-",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // * has the same precedence as /
    // But / appears after so it has lower precedence
    "1 * 2 / 3": {
      type: BinaryExpression,
      operator: "/",
      left: {
        type: BinaryExpression,
        operator: "*",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // * has the same precedence as /
    // But / appears after so it has lower precedence
    "1 / 2 * 9": {
      type: BinaryExpression,
      operator: "*",
      left: {
        type: BinaryExpression,
        operator: "/",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
      right: {
        type: NumericLiteral,
        value: "9",
      },
    },
    // // has the same precedence as /
    // But // appears after so it has lower precedence
    "1 / 3 // 9": {
      type: BinaryExpression,
      operator: "//",
      left: {
        type: BinaryExpression,
        operator: "/",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "3",
        },
      },
      right: {
        type: NumericLiteral,
        value: "9",
      },
    },
    // + has a lower predence than *
    "2 + 3 * 4": {
      type: BinaryExpression,
      operator: "+",
      left: {
        type: NumericLiteral,
        value: "2",
      },
      right: {
        type: BinaryExpression,
        operator: "*",
        left: {
          type: NumericLiteral,
          value: "3",
        },
        right: {
          type: NumericLiteral,
          value: "4",
        },
      },
    },
    // - has a lower predence than *
    "20 - 3 * 4": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: NumericLiteral,
        value: "20",
      },
      right: {
        type: BinaryExpression,
        operator: "*",
        left: {
          type: NumericLiteral,
          value: "3",
        },
        right: {
          type: NumericLiteral,
          value: "4",
        },
      },
    },
    // + has a lower predence than /
    "2 + 6 / 3": {
      type: BinaryExpression,
      operator: "+",
      left: {
        type: NumericLiteral,
        value: "2",
      },
      right: {
        type: BinaryExpression,
        operator: "/",
        left: {
          type: NumericLiteral,
          value: "6",
        },
        right: {
          type: NumericLiteral,
          value: "3",
        },
      },
    },
    // - has a lower predence than /
    "2 - 6 / 3": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: NumericLiteral,
        value: "2",
      },
      right: {
        type: BinaryExpression,
        operator: "/",
        left: {
          type: NumericLiteral,
          value: "6",
        },
        right: {
          type: NumericLiteral,
          value: "3",
        },
      },
    },
    // Case sensitivity.
    "1 - 1": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: NumericLiteral,
        value: "1",
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    "1 -1": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: NumericLiteral,
        value: "1",
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    "1- 1": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: NumericLiteral,
        value: "1",
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    "1-1": {
      type: BinaryExpression,
      operator: "-",
      left: {
        type: NumericLiteral,
        value: "1",
      },
      right: {
        type: NumericLiteral,
        value: "1",
      },
    },
    // + has a lower precedence than # unary expression.
    "#'hello' + 3": {
      type: BinaryExpression,
      operator: "+",
      left: {
        type: UnaryExpression,
        operator: "#",
        argument: {
          type: StringLiteral,
          value: "'hello'",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // + has a lower precedence than # unary expression.
    "#foo + 3": {
      type: BinaryExpression,
      operator: "+",
      left: {
        type: UnaryExpression,
        operator: "#",
        argument: {
          type: Identifier,
          name: "foo",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // and has a lower precedence than ~ unary expression.
    "~3 and true": {
      type: BinaryExpression,
      operator: "and",
      left: {
        type: UnaryExpression,
        operator: "~",
        argument: {
          type: NumericLiteral,
          value: "3",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "true",
      },
    },
    // * has a lower precedence than - unary expression.
    "-3 * 3": {
      type: BinaryExpression,
      operator: "*",
      left: {
        type: UnaryExpression,
        operator: "-",
        argument: {
          type: NumericLiteral,
          value: "3",
        },
      },
      right: {
        type: NumericLiteral,
        value: "3",
      },
    },
    // == has a lower precedence than not unary expression.
    "not false == true": {
      type: BinaryExpression,
      operator: "==",
      left: {
        type: UnaryExpression,
        operator: "not",
        argument: {
          type: BooleanLiteral,
          value: "false",
        },
      },
      right: {
        type: BooleanLiteral,
        value: "true",
      },
    },
    // not unary expression has a lower precedence ^.
    "not 1 ^ 2": {
      type: UnaryExpression,
      operator: "not",
      argument: {
        type: BinaryExpression,
        operator: "^",
        left: {
          type: NumericLiteral,
          value: "1",
        },
        right: {
          type: NumericLiteral,
          value: "2",
        },
      },
    },
    // not unary expression has the same precedence as # unary expression
    // But not appears before #
    "not #'Hello, world!'": {
      type: UnaryExpression,
      operator: "not",
      argument: {
        type: UnaryExpression,
        operator: "#",
        argument: {
          type: StringLiteral,
          value: "'Hello, world!'",
        },
      },
    },
    // Grouping expression has the highest precedence at all times.
    // The body of the expression will follow it's own precedence.
    "2 * (2 + 2)": {
      type: BinaryExpression,
      operator: "*",
      left: {
        type: NumericLiteral,
        value: "2",
      },
      right: {
        type: GroupingExpression,
        expression: {
          type: BinaryExpression,
          operator: "+",
          left: {
            type: NumericLiteral,
            value: "2",
          },
          right: {
            type: NumericLiteral,
            value: "2",
          },
        },
      },
    },
    "2 * ((2 + 2))": {
      type: BinaryExpression,
      operator: "*",
      left: {
        type: NumericLiteral,
        value: "2",
      },
      right: {
        type: GroupingExpression,
        expression: {
          type: GroupingExpression,
          expression: {
            type: BinaryExpression,
            operator: "+",
            left: {
              type: NumericLiteral,
              value: "2",
            },
            right: {
              type: NumericLiteral,
              value: "2",
            },
          },
        },
      },
    },
    "(2 * (6 - (2 + 2)))": {
      type: GroupingExpression,
      expression: {
        type: BinaryExpression,
        operator: "*",
        left: {
          type: NumericLiteral,
          value: "2",
        },
        right: {
          type: GroupingExpression,
          expression: {
            type: BinaryExpression,
            operator: "-",
            left: {
              type: NumericLiteral,
              value: "6",
            },
            right: {
              type: GroupingExpression,
              expression: {
                type: BinaryExpression,
                operator: "+",
                left: {
                  type: NumericLiteral,
                  value: "2",
                },
                right: {
                  type: NumericLiteral,
                  value: "2",
                },
              },
            },
          },
        },
      },
    },
    "-(3 * 3)": {
      type: UnaryExpression,
      operator: "-",
      argument: {
        type: GroupingExpression,
        expression: {
          type: BinaryExpression,
          operator: "*",
          left: {
            type: NumericLiteral,
            value: "3",
          },
          right: {
            type: NumericLiteral,
            value: "3",
          },
        },
      },
    },
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const expressionNode = parser.parseExpression();
    const serializerVisitor = new SerializerVisitor();

    assertEquals(
      serializerVisitor.visit(expressionNode) as unknown,
      result as unknown,
    );
  });

  test("parseStatement", {
    ";": {
      type: Chunk,
      body: [],
    },
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const minimizerVisitor = new MinimizerVisitor();

    assertEquals(
      minimizerVisitor.visit(ast) as unknown,
      result as unknown,
    );
  });

  test("parseLocalStatement", {
    "local a = 3": {
      type: LocalStatement,
      variables: [Identifier],
      init: [NumericLiteral],
    },
    "local a, b, c = 3": {
      type: LocalStatement,
      variables: [Identifier, Identifier, Identifier],
      init: [NumericLiteral],
    },
    "local a, b, c = 1, 2, 3": {
      type: LocalStatement,
      variables: [Identifier, Identifier, Identifier],
      init: [NumericLiteral, NumericLiteral, NumericLiteral],
    },
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const localStatement = ast.block.statements[0];
    const minimizerVisitor = new MinimizerVisitor();

    assertEquals(
      minimizerVisitor.visit(localStatement) as unknown,
      result as unknown,
    );
  });

  test("parseBreakStatement", {
    "break": BreakStatement,
    "break;": BreakStatement,
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const breakStatement = ast.block.statements[0];
    const minimizerVisitor = new MinimizerVisitor();

    assertStrictEquals(
      minimizerVisitor.visit(breakStatement) as unknown,
      result as unknown,
    );
  });

  test("parseReturnStatement", {
    "return": {
      type: ReturnStatement,
      expressions: [],
    },
    "return;": {
      type: ReturnStatement,
      expressions: [],
    },
    "return 3 + 3;": {
      type: ReturnStatement,
      expressions: [
        {
          type: BinaryExpression,
          left: NumericLiteral,
          right: NumericLiteral,
        },
      ],
    },
    "return -3;": {
      type: ReturnStatement,
      expressions: [
        {
          type: UnaryExpression,
          argument: NumericLiteral,
        },
      ],
    },
    "return (-3 + 3);": {
      type: ReturnStatement,
      expressions: [
        {
          type: GroupingExpression,
          expression: {
            type: BinaryExpression,
            left: {
              type: UnaryExpression,
              argument: NumericLiteral,
            },
            right: NumericLiteral,
          },
        },
      ],
    },
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const returnStatement = ast.block.statements[0];
    const minimizerVisitor = new MinimizerVisitor();

    assertEquals(
      minimizerVisitor.visit(returnStatement) as unknown,
      result as unknown,
    );
  });
});

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

  function foo(x, y, z, ...)
    local a = x + y;
  end

  function()
  end

  local function bar()
  end

  local xzy = function(a, b, c)
    ;
  end

  for i = 1, i < 4 do
  end

  for i = 1, i < 4, i < 3 do
  end

  return 4 + 5;
`;

Deno.test(
  `
Scratch source test:
-------------------
${source}
-------------------
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
          type: FunctionStatement,
          isLocal: false,
          identifier: Identifier,
          arguments: [Identifier, Identifier, Identifier, VarargLiteral],
          block: [
            {
              type: LocalStatement,
              variables: [Identifier],
              init: [
                {
                  type: BinaryExpression,
                  left: Identifier,
                  right: Identifier,
                },
              ],
            },
          ],
        },
        {
          type: FunctionStatement,
          isLocal: false,
          identifier: undefined,
          arguments: [],
          block: [],
        },
        {
          type: FunctionStatement,
          isLocal: true,
          identifier: Identifier,
          arguments: [],
          block: [],
        },
        {
          type: LocalStatement,
          variables: [Identifier],
          init: [{
            type: FunctionExpression,
            arguments: [Identifier, Identifier, Identifier],
            block: [],
          }],
        },
        {
          type: ForNumericStatement,
          variable: Identifier,
          start: NumericLiteral,
          end: {
            type: BinaryExpression,
            left: Identifier,
            right: NumericLiteral,
          },
          step: undefined,
          block: [],
        },
        {
          type: ForNumericStatement,
          variable: Identifier,
          start: NumericLiteral,
          end: {
            type: BinaryExpression,
            left: Identifier,
            right: NumericLiteral,
          },
          step: {
            type: BinaryExpression,
            left: Identifier,
            right: NumericLiteral,
          },
          block: [],
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
