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
      tokenizer = new Tokenizer("          bar      foo");

      assertEquals(tokenizer.tokenize()?.value, "bar");
      assertEquals(tokenizer.tokenize()?.value, "foo");
      assert(tokenizer.scanner.isOutOfBounds());
    });

    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      tokenizer = new Tokenizer("  \r  \n      foo  \r\n  \n\r    bar  baz ");

      assertEquals(tokenizer.tokenize()?.value, "foo");
      assertEquals(tokenizer.tokenize()?.value, "bar");
      assertEquals(tokenizer.tokenize()?.value, "baz");
    });

    it("returns a token when an identifier is found", () => {
      tokenizer = new Tokenizer("          local      bar  baz ");

      assertEquals(tokenizer.tokenize()?.value, "local");
      assertEquals(tokenizer.tokenize()?.value, "bar");
      assertEquals(tokenizer.tokenize()?.value, "baz");
    });

    it("does not recognize identifiers that start with digits", () => {
      tokenizer = new Tokenizer("          3local      bar  3baz ");

      tokenizer.tokenize()

      assertEquals(tokenizer.tokenize()?.value, "local");
      assertEquals(tokenizer.tokenize()?.value, "bar");

      tokenizer.tokenize()

      assertEquals(tokenizer.tokenize()?.value, "baz");

    });

    it("returns a keyword identifier token", () => {
      tokenizer = new Tokenizer("local 3 return ");

      assertEquals(tokenizer.tokenize()?.value, "local");

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, "return");
    });

    it("returns a boolean identifier token", () => {
      tokenizer = new Tokenizer("local 3 true ");

      tokenizer.tokenize();
      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, true);
    });

    it("returns a nil identifier token", () => {
      tokenizer = new Tokenizer("nil 3 nil ");

      assertEquals(tokenizer.tokenize()?.value, null);

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, null);
    });
  });
});
