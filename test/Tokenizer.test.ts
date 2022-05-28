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
      let token = tokenizer.tokenize();

      assertEquals(token?.value, "bar");

      token = tokenizer.tokenize();

      assertEquals(token?.value, "foo");
      assert(tokenizer.scanner.isOutOfBounds());
    });

    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      tokenizer = new Tokenizer("  \r  \n      foo  \r\n  \n\r    bar  baz ");

      let token = tokenizer.tokenize();
      assertEquals(token?.value, "foo");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "bar");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "baz");
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

    it("does not recognize identifiers that start with digits", () => {
      tokenizer = new Tokenizer("          3local      bar  3baz ");

      let token = tokenizer.tokenize();
      assertEquals(token?.value, "3");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "local");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "bar");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "3");

      token = tokenizer.tokenize();
      assertEquals(token?.value, "baz");
    });
  });
});
