import { Tokenizer, TokenType } from "../../src/Tokenizer.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

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
      tokenizer = new Tokenizer("          3foo      bar  3baz ");

      tokenizer.tokenize();

      assertEquals(tokenizer.tokenize()?.value, "foo");
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

        assertEquals(token?.value, "true");
        assertEquals(token?.type, TokenType.BooleanLiteral);
      });

      it('when identifier is "false"', () => {
        tokenizer = new Tokenizer("false");

        const token = tokenizer.tokenize();

        assertEquals(token?.value, "false");
        assertEquals(token?.type, TokenType.BooleanLiteral);
      });
    });

    it("correctly tokenizes nil keyword", () => {
      tokenizer = new Tokenizer("nil");

      const token = tokenizer.tokenize();

      assertEquals(token?.value, "nil");
      assertEquals(token?.type, TokenType.NilLiteral);
    });

    describe("correctly tokenizes numeric literals", () => {
      const testTable = {
        "1": "1",
        ".9": ".9",
        "3.3": "3.3",
        "10.3": "10.3",
        "3.14159265359": "3.14159265359",
        "314159265359.": "314159265359.",
        "3.3e103e3": "3.3e103",
        "1e1": "1e1",
        "1E1": "1E1",
        "1e+9": "1e+9",
        "1e-1": "1e-1",
        "34.3e10": "34.3e10",
        "0xf": "0xf",
        "0xf.": "0xf.",
        "0xf.3": "0xf.3",
        "0xfp1": "0xfp1",
        "0xfp+1": "0xfp+1",
        "0xfp-1": "0xfp-1",
        "0xFP+9": "0xFP+9",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          tokenizer = new Tokenizer(source);

          const token = tokenizer.tokenize();

          assertEquals(token?.value, result);
          assertEquals(token?.type, TokenType.NumericLiteral);
        });
      });

      describe("with imaginary suffix feature on", () => {
        const testTable = {
          "3.333I": "3.333I",
          "3i": "3i",
          "0.9I": "0.9I",
          "0x.3fI": "0x.3fI",
          "0x.3I": "0x.3I",
          "0x3i": "0x3i",
        };

        Object.entries(testTable).forEach(([source, result]) => {
          it(`"${source}" is tokenized as numeric identifier`, () => {
            tokenizer = new Tokenizer(source);

            const token = tokenizer.tokenize();

            assertEquals(token?.value, result);
            assertEquals(token?.type, TokenType.NumericLiteral);
          });
        });
      });

      describe("with int64 suffix when feature is on", () => {
        const testTable = {
          "1uLL": "1uLL",
          "3ulL": "3ulL",
          "4uLl": "4uLl",
          "5ULL": "5ULL",
          "6UlL": "6UlL",
        };

        Object.entries(testTable).forEach(([source, result]) => {
          it(`"${source}" is tokenized as numeric identifier`, () => {
            tokenizer = new Tokenizer(source);

            const token = tokenizer.tokenize();

            assertEquals(token?.value, result);
            assertEquals(token?.type, TokenType.NumericLiteral);
          });
        });
      });

      describe("with imaginary suffix feature off", () => {
        const testTable = {
          "3.333I": "3.333",
          "3i": "3",
          "0.9I": "0.9",
          "0x.3fI": "0x.3f",
          "0x.3I": "0x.3",
          "0x3i": "0x3",
        };

        Object.entries(testTable).forEach(([source, result]) => {
          it(`"i" suffix is ignored when ${source}" numeric identifier`, () => {
            tokenizer = new Tokenizer(source, {
              imaginaryNumbers: false,
            });

            const token = tokenizer.tokenize();

            assertEquals(token?.value, result);
            assertEquals(token?.type, TokenType.NumericLiteral);
          });
        });
      });

      describe("with int64 suffix when feature is on", () => {
        const testTable = {
          "1uLL": "1uLL",
          "3ulL": "3ulL",
          "4uLl": "4uLl",
          "5ULL": "5ULL",
          "6UlL": "6UlL",
          "44lL": "44lL",
          "53Ll": "53Ll",
          "100ll": "100ll",
          "101LL": "101LL",
        };

        Object.entries(testTable).forEach(([source, result]) => {
          it(`"ull" or "ll" suffix is ignored when ${source}" numeric identifier`, () => {
            tokenizer = new Tokenizer(source);

            const token = tokenizer.tokenize();

            assertEquals(token?.value, result);
            assertEquals(token?.type, TokenType.NumericLiteral);
          });
        });
      });

      describe("with int64 suffix when feature is off", () => {
        const testTable = {
          "1uLL": "1",
          "3ulL": "3",
          "4uLl": "4",
          "5ULL": "5",
          "6UlL": "6",
          "44lL": "44",
          "53Ll": "53",
          "100ll": "100",
          "101LL": "101",
        };

        Object.entries(testTable).forEach(([source, result]) => {
          it(`"ull" or "ll" suffix is ignored when ${source}" numeric identifier`, () => {
            tokenizer = new Tokenizer(source, {
              integerSuffixes: false,
            });

            const token = tokenizer.tokenize();

            assertEquals(token?.value, result);
            assertEquals(token?.type, TokenType.NumericLiteral);
          });
        });
      });
    });

    describe("throws errors when unexpected characters appear while parsing numeric literals", () => {
      const testTable = {
        "1..1": "[1:3] malformed number near '1.'",
        "1.1.1": "[1:4] malformed number near '1.1'",
        "0x..": "[1:4] malformed number near '0x.'",
        "0x3..3": "[1:5] malformed number near '0x3.'",
        "0x3...3": "[1:5] malformed number near '0x3.'",
        // Exponents are represented by p for hexadecimals and a non digit appearing right after the exponent is not allowed
        "0x333pe": "[1:7] malformed number near '0x333p'",
        "0x333p+e": "[1:8] malformed number near '0x333p+'",
        "0xfp-.": "[1:6] malformed number near '0xfp-",
        "10.e-.": "[1:6] malformed number near '10.e-",
        // Exponents are represented by p for hexadecimals and a non digit appearing right after the exponent is not allowed
        "10.e-b": "[1:6] malformed number near '10.e-",
        "10.eb": "[1:5] malformed number near '10.e",
        // Integar suffix: must be ULL or LL.
        "1U": "[1:3] malformed number near '1U'",
        "1u": "[1:3] malformed number near '1u'",
        "1UL": "[1:4] malformed number near '1UL'",
        "1uL": "[1:4] malformed number near '1uL'",
        "1ul": "[1:4] malformed number near '1ul'",
        "1Ul": "[1:4] malformed number near '1Ul'",
        "1l": "[1:3] malformed number near '1l'",
        "1L": "[1:3] malformed number near '1L'",
        // Decimal numbers cannot have integer suffix.
        ".3ULL": "[1:6] malformed number near '.3ULL'",
        "1.3LL": "[1:6] malformed number near '1.3LL'",
        "1.LL": "[1:5] malformed number near '1.LL'",
        "0x4.LL": "[1:7] malformed number near '0x4.LL'",
        "0x.40LL": "[1:8] malformed number near '0x.40LL'"
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () =>
          assertThrows(
            () => (new Tokenizer(source)).tokenize(),
            SyntaxError,
            result,
          ));
      });
    });
  });
});
