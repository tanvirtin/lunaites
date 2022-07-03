import { Parser, SerializerVisitor } from "./mod.ts";
import { assertObjectMatch, describe, it } from "./deps.ts";

function createParser(source: string) {
  return new Parser(source);
}

describe("Parser", () => {
  let parser: Parser;

  describe("parseLocalStatement", () => {
    const testTable = {
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
    };

    Object.entries(testTable).forEach(([source, result]) => {
      it(`when identifier is "${source}"`, () => {
        parser = createParser(source);
        const ast = parser.parse();
        const localStatement = ast.block.statements[0];
        const serializerVisitor = new SerializerVisitor();

        assertObjectMatch(
          serializerVisitor.visit(localStatement) as Record<
            string,
            unknown
          >,
          result,
        );
      });
    });
  });
});
