import { Parser } from "../../mod.ts";
import { describe, it } from "../../deps.ts";

describe("Scanner", () => {
  let parser: Parser;

  describe("parse", () => {
    it("should parse an expression", () => {
      parser = new Parser("(not 3)");

      parser.parse();
    });
  });
});

const parser = new Parser("(3 + 3) * 4");

console.log(parser.parse());
