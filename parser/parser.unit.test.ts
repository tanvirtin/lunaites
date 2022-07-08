import { ast, MinimizerVisitor, Parser, SerializerVisitor } from "./mod.ts";
import { assertEquals, assertStrictEquals, describe, it } from "./deps.ts";

const {
  BinaryExpression,
  LocalStatement,
  Identifier,
  ReturnStatement,
  UnaryExpression,
  NumericLiteral,
  GroupingExpression,
  BreakStatement,
  StringLiteral,
  BooleanLiteral,
  NilLiteral,
  VarargLiteral,
  CommentLiteral,
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
        `when identifier is "${source}"`,
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
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const expressionNode = parser.parseExpression();
    const serializerVisitor = new SerializerVisitor();

    assertEquals(
      serializerVisitor.visit(expressionNode) as unknown,
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
