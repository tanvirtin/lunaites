import { Parser, SerializerVisitor } from "./mod.ts";
import { assertObjectMatch, describe, it } from "./deps.ts";

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
      "type": "LocalStatement",
      "variables": [
        {
          "type": "Identifier",
          "name": "a",
        },
      ],
      "init": [
        {
          "type": "NumericLiteral",
          "value": "3",
        },
      ],
    },
    "local a, b, c = 3": {
      "type": "LocalStatement",
      "variables": [
        {
          "type": "Identifier",
          "name": "a",
        },
        {
          "type": "Identifier",
          "name": "b",
        },
        {
          "type": "Identifier",
          "name": "c",
        },
      ],
      "init": [
        {
          "type": "NumericLiteral",
          "value": "3",
        },
      ],
    },
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const localStatement = ast.block.statements[0];
    const serializerVisitor = new SerializerVisitor();

    assertObjectMatch(
      serializerVisitor.visit(localStatement) as Record<
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
    "break": {
      "type": "BreakStatement",
    },
  }, (source: string, result: unknown) => {
    parser = createParser(source);
    const ast = parser.parse();
    const breakStatement = ast.block.statements[0];
    const serializerVisitor = new SerializerVisitor();

    assertObjectMatch(
      serializerVisitor.visit(breakStatement) as Record<
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
