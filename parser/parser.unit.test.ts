import { NodeType, Parser, ReducerVisitor } from "./mod.ts";
import { assertObjectMatch, assertStrictEquals, describe, it } from "./deps.ts";

const {
  BinaryExpression,
  LocalStatement,
  Identifier,
  ReturnStatement,
  UnaryExpression,
  NumericLiteral,
  GroupingExpression,
  BreakStatement,
} = NodeType;

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

  test("parseLocalStatement", {
    "local a = 3": {
      type: "LocalStatement",
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
    const reducerVisitor = new ReducerVisitor();

    assertObjectMatch(
      reducerVisitor.visit(localStatement) as Record<
        string,
        unknown
      >,
      result as Record<
        string,
        unknown
      >,
    );
  });

  test("parseBreakStatement", {
    "break": BreakStatement,
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const breakStatement = ast.block.statements[0];
    const reducerVisitor = new ReducerVisitor();

    assertStrictEquals(
      reducerVisitor.visit(breakStatement) as Record<
        string,
        unknown
      >,
      result as Record<
        string,
        unknown
      >,
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
        },
      ],
    },
    "return -3;": {
      type: ReturnStatement,
      expressions: [
        {
          type: UnaryExpression,
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
    const reducerVisitor = new ReducerVisitor();

    assertObjectMatch(
      reducerVisitor.visit(returnStatement) as Record<
        string,
        unknown
      >,
      result as Record<
        string,
        unknown
      >,
    );
  });
});
