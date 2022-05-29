import { Tokenizer, TokenType } from "../../src/Tokenizer.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("Tokenizer", () => {
  let tokenizer: Tokenizer;

  describe("tokenize", () => {
    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      tokenizer = new Tokenizer("  \r  \n      foo  \r\n  \n\r    bar  baz ");

      assertEquals(tokenizer.tokenize()?.value, "foo");
      assertEquals(tokenizer.tokenize()?.value, "bar");
      assertEquals(tokenizer.tokenize()?.value, "baz");
      assertEquals(tokenizer.tokenize()?.value, "<eof>");
    });

    it("correctly tokenizes end of file", () => {
      tokenizer = new Tokenizer("  \r  \n      foo  \r\n  \n\r    bar  baz ");

      tokenizer.tokenize();
      tokenizer.tokenize();
      tokenizer.tokenize();
      const token = tokenizer.tokenize();

      assertEquals(token?.value, "<eof>");
      assertEquals(token?.type, TokenType.EOF);
    });

    it("does not recognize identifiers that start with digits", () => {
      tokenizer = new Tokenizer("          3local      bar  3baz ");

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, "local");
      assertEquals(tokenizer.tokenize()?.value, "bar");

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, "baz");
    });

    describe("correctly tokenizes ambigious identifiers", () => {
      it('when identifier is "foo"', () => {
        tokenizer = new Tokenizer("foo");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "foo");
        assertEquals(token?.type, TokenType.Identifier);
      });

      it('when identifier is "bar"', () => {
        tokenizer = new Tokenizer("bar");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "bar");
        assertEquals(token?.type, TokenType.Identifier);
      });

      it('when identifier is "p"', () => {
        tokenizer = new Tokenizer("p");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "p");
        assertEquals(token?.type, TokenType.Identifier);
      });

      it('when identifier is "hello_world"', () => {
        tokenizer = new Tokenizer("hello_world");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "hello_world");
        assertEquals(token?.type, TokenType.Identifier);
      });

      it('when identifier is "helloWorld"', () => {
        tokenizer = new Tokenizer("helloWorld");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "helloWorld");
        assertEquals(token?.type, TokenType.Identifier);
      });
    });

    describe("correctly tokenizes keywords", () => {
      it('when identifier is "local"', () => {
        tokenizer = new Tokenizer("local");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "local");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "if"', () => {
        tokenizer = new Tokenizer("if");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "if");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "in"', () => {
        tokenizer = new Tokenizer("in");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "in");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "or"', () => {
        tokenizer = new Tokenizer("or");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "or");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "and"', () => {
        tokenizer = new Tokenizer("and");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "and");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "for"', () => {
        tokenizer = new Tokenizer("for");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "for");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "not"', () => {
        tokenizer = new Tokenizer("not");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "not");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "else"', () => {
        tokenizer = new Tokenizer("else");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "else");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "then"', () => {
        tokenizer = new Tokenizer("then");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "then");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "break"', () => {
        tokenizer = new Tokenizer("break");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "break");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "local"', () => {
        tokenizer = new Tokenizer("local");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "local");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "until"', () => {
        tokenizer = new Tokenizer("until");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "until");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "while"', () => {
        tokenizer = new Tokenizer("while");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "while");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "elseif"', () => {
        tokenizer = new Tokenizer("elseif");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "elseif");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "repeat"', () => {
        tokenizer = new Tokenizer("repeat");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "repeat");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "return"', () => {
        tokenizer = new Tokenizer("return");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "return");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "function"', () => {
        tokenizer = new Tokenizer("function");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "function");
        assertEquals(token?.type, TokenType.Keyword);
      });

      it('when identifier is "goto"', () => {
        tokenizer = new Tokenizer("goto", {
          labels: true,
          contextualGoto: false,
        });

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "goto");
        assertEquals(token?.type, TokenType.Keyword);
      });
    });

    describe("correctly tokenizes booleans", () => {
      it('when identifier is "true"', () => {
        tokenizer = new Tokenizer("true");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, true);
        assertEquals(token?.type, TokenType.BooleanLiteral);
      });

      it('when identifier is "false"', () => {
        tokenizer = new Tokenizer("false");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, false);
        assertEquals(token?.type, TokenType.BooleanLiteral);
      });
    });

    it("correctly tokenizes nil keyword", () => {
      tokenizer = new Tokenizer("nil");

      const token = tokenizer.tokenize();

      assertEquals(token?.value, null);
      assertEquals(token?.type, TokenType.NilLiteral);
    });

    describe("correctly tokenizes numeric literals", () => {
      it('when identifier is "1"', () => {
        tokenizer = new Tokenizer("1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 1);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is ".9"', () => {
        tokenizer = new Tokenizer(".9");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 0.9);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "3.3"', () => {
        tokenizer = new Tokenizer("3.3");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 3.3);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "10.3"', () => {
        tokenizer = new Tokenizer("10.3");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 10.3);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "3.14159265359"', () => {
        tokenizer = new Tokenizer("3.14159265359");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 3.14159265359);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "314159265359."', () => {
        tokenizer = new Tokenizer("314159265359.");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 314159265359);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "1e1"', () => {
        tokenizer = new Tokenizer("1e1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 10);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "1E1"', () => {
        tokenizer = new Tokenizer("1E1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 10);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "1e+9"', () => {
        tokenizer = new Tokenizer("1e+9");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 1000000000);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "1e-1"', () => {
        tokenizer = new Tokenizer("1e-1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 0.1);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xf"', () => {
        tokenizer = new Tokenizer("0xf");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 15);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xf."', () => {
        tokenizer = new Tokenizer("0xf.");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 15);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xf.3"', () => {
        tokenizer = new Tokenizer("0xf.3");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 15.1875);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xfp1"', () => {
        tokenizer = new Tokenizer("0xfp1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 30);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xfp+1"', () => {
        tokenizer = new Tokenizer("0xfp+1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 30);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xfp-1"', () => {
        tokenizer = new Tokenizer("0xfp-1");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 7.5);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });

      it('when identifier is "0xFP+9"', () => {
        tokenizer = new Tokenizer("0xFP+9");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, 7680);
        assertEquals(token?.type, TokenType.NumericLiteral);
      });
    });
  });
});