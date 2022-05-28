import { Tokenizer, TokenType } from "../src/Tokenizer.ts";
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

    it("does not recognize identifiers that start with digits", () => {
      tokenizer = new Tokenizer("          3local      bar  3baz ");

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, "local");
      assertEquals(tokenizer.tokenize()?.value, "bar");

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, "baz");
    });

    describe("correctly recognizes keywords", () => {
      it('when identifier is "local"', () => {
        tokenizer = new Tokenizer("local");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "local");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "if"', () => {
        tokenizer = new Tokenizer("if");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "if");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "in"', () => {
        tokenizer = new Tokenizer("in");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "in");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "or"', () => {
        tokenizer = new Tokenizer("or");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "or");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "and"', () => {
        tokenizer = new Tokenizer("and");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "and");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "for"', () => {
        tokenizer = new Tokenizer("for");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "for");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "not"', () => {
        tokenizer = new Tokenizer("not");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "not");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "else"', () => {
        tokenizer = new Tokenizer("else");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "else");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "then"', () => {
        tokenizer = new Tokenizer("then");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "then");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "break"', () => {
        tokenizer = new Tokenizer("break");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "break");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "local"', () => {
        tokenizer = new Tokenizer("local");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "local");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "until"', () => {
        tokenizer = new Tokenizer("until");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "until");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "while"', () => {
        tokenizer = new Tokenizer("while");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "while");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "elseif"', () => {
        tokenizer = new Tokenizer("elseif");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "elseif");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "repeat"', () => {
        tokenizer = new Tokenizer("repeat");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "repeat");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "return"', () => {
        tokenizer = new Tokenizer("return");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "return");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "function"', () => {
        tokenizer = new Tokenizer("function");

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "function");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "goto"', () => {
        tokenizer = new Tokenizer("goto", {
          labels: true,
          contextualGoto: false
        });

        const token = tokenizer.tokenize()

        assertEquals(token?.value, "goto");
        assertEquals(token?.type, TokenType.Keyword);
      });
    })
  });
});
