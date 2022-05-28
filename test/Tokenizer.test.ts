import { Tokenizer } from "../src/Tokenizer.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("Tokenizer", () => {
  let tokenizer: Tokenizer;

  describe("next", () => {
    it("consumes all whitespaces", () => {
      tokenizer = new Tokenizer("          9      3");
      tokenizer.next();

      assertEquals(tokenizer.cursor.getChar(), "9");

      tokenizer.next();

      assertEquals(tokenizer.cursor.getChar(), "3");

      tokenizer.next();

      assertEquals(tokenizer.cursor.getChar(), undefined);

      assert(tokenizer.cursor.isOutOfBounds());
    });

    it("returns a token when an identifier is found", () => {
      tokenizer = new Tokenizer("          local      bar  baz ");

      let token = tokenizer.next();
      assertEquals(token?.value, "local");

      token = tokenizer.next();
      assertEquals(token?.value, "bar");

      token = tokenizer.next();
      assertEquals(token?.value, "baz");
    });

    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      tokenizer = new Tokenizer("  \r  \n      local  \r\n  \n\r    bar  baz ");

      let token = tokenizer.next();
      assertEquals(token?.value, "local");

      token = tokenizer.next();
      assertEquals(token?.value, "bar");

      token = tokenizer.next();
      assertEquals(token?.value, "baz");
    });
  });
});
