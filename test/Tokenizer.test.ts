import { Tokenizer } from "../src/Tokenizer.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("Tokenizer", () => {
  let tokenizer: Tokenizer;

  describe("tokenize", () => {
    it("consumes all whitespaces", () => {
      tokenizer = new Tokenizer("          9      3");
      tokenizer.tokenize();

      assertEquals(tokenizer.scanner.getChar(), "9");

      tokenizer.tokenize();

      assertEquals(tokenizer.scanner.getChar(), "3");

      tokenizer.tokenize();

      assertEquals(tokenizer.scanner.getChar(), undefined);

      assert(tokenizer.scanner.isOutOfBounds());
    });

    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      tokenizer = new Tokenizer("  \r  \n      local  \r\n  \n\r    bar  baz ");

      let token = tokenizer.tokenize();
      assertEquals(token?.value, "local");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "bar");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "baz");
    });

    it("should track line numbers being added", () => {
      tokenizer = new Tokenizer("  \r  \n      local  \r\n  \n\r    bar  baz ");

      tokenizer.tokenize();
      tokenizer.tokenize();
      tokenizer.tokenize();

      assertEquals(tokenizer.scanner.line, 4);
    });

    it("should track line start positions", () => {
      tokenizer = new Tokenizer("  \r  \n      local  \r\n  \n\r    bar  baz ");

      tokenizer.tokenize();
      assertEquals(tokenizer.scanner.lineStart, 6);

      tokenizer.tokenize();
      assertEquals(tokenizer.scanner.lineStart, 25);
    });

    it("returns a token when an identifier is found", () => {
      tokenizer = new Tokenizer("          local      bar  baz ");

      let token = tokenizer.tokenize();
      assertEquals(token?.value, "local");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "bar");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "baz");
    });
  });
});
