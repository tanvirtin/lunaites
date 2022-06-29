import { Parser } from "../../mod.ts";
import { assertStrictEquals, describe, it } from "../../deps.ts";

describe("Parser", () => {
  describe("parse", () => {
    it("should pass", () => {
      assertStrictEquals(true, true);
    });
  });
});

const parser = new Parser("local a,b,c = 3,4,5");
const ast = parser.parse();

console.log(JSON.stringify(ast, null, 2));
