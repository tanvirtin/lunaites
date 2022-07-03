import { Parser } from "./mod.ts";
import { assertStrictEquals, describe, it } from "./deps.ts";

describe("Parser", () => {
  describe("parse", () => {
    it("should pass", () => {
      assertStrictEquals(true, true);
    });
  });
});

const parser = new Parser(`local a = 3`);

try {
  const ast = parser.parse();
  console.log(ast);
} catch (err) {
  console.log(err.scanner);
}
