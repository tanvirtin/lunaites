import { Tokenizer, TokenType } from "../../mod.ts";
import {
  assertEquals,
  assertObjectMatch,
  assertThrows,
  describe,
  it,
} from "../../deps.ts";

describe("Tokenizer", () => {
  let tokenizer: Tokenizer;

  describe("tokenize", () => {
    describe("correctly ignores whitespace", () => {
      const testTable = {
        "  \r  \n      foo  \r\n  \n\r    bar  baz ": [
          {
            type: TokenType.Identifier,
            value: "foo",
          },
          {
            type: TokenType.Identifier,
            value: "bar",
          },
          {
            type: TokenType.Identifier,
            value: "baz",
          },
          {
            type: TokenType.EOF,
            value: "<eof>",
          },
        ],
        "foo  \r\n  \n\r": [
          {
            type: TokenType.Identifier,
            value: "foo",
          },
          {
            type: TokenType.EOF,
            value: "<eof>",
          },
        ],
        "foo  \r\n  \n\r\n\r\n": [
          {
            type: TokenType.Identifier,
            value: "foo",
          },
          {
            type: TokenType.EOF,
            value: "<eof>",
          },
        ],
      };

      Object.entries(testTable).forEach(([source, results]) => {
        it(`when source is "${source}"`, () => {
          tokenizer = new Tokenizer(source);

          results.forEach((result) => {
            assertObjectMatch(tokenizer.tokenize(), result);
          });
        });
      });
    });

    it("correctly tokenizes end of file", () => {
      tokenizer = new Tokenizer("  \r  \n      foo  \r\n  \n\r    bar  baz ");

      tokenizer.tokenize();
      tokenizer.tokenize();
      tokenizer.tokenize();

      assertObjectMatch(tokenizer.tokenize(), {
        value: "<eof>",
      });
      assertObjectMatch(tokenizer.tokenize(), {
        value: "<eof>",
      });
    });

    it("does not recognize identifiers that start with digits", () => {
      tokenizer = new Tokenizer("          3foo      bar  3baz ");

      tokenizer.tokenize();

      assertObjectMatch(tokenizer.tokenize(), {
        value: "foo",
      });
      assertObjectMatch(tokenizer.tokenize(), {
        value: "bar",
      });

      tokenizer.tokenize();

      assertObjectMatch(tokenizer.tokenize(), {
        value: "baz",
      });
    });

    it("correctly tokenizes nil keyword", () => {
      tokenizer = new Tokenizer("nil");

      assertObjectMatch(tokenizer.tokenize(), {
        type: TokenType.NilLiteral,
        value: "nil",
      });
    });

    describe("correctly tokenizes ambigious identifiers", () => {
      const testTable = {
        "foo": "foo",
        "bar": "bar",
        "p": "p",
        "hello_world": "hello_world",
        "helloWorld": "helloWorld",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          tokenizer = new Tokenizer(source);

          assertObjectMatch(tokenizer.tokenize(), {
            type: TokenType.Identifier,
            value: result,
          });
        });
      });
    });

    describe("correctly tokenizes keywords", () => {
      const testTable = {
        "if": "if",
        "in": "in",
        "or": "or",
        "and": "and",
        "for": "for",
        "not": "not",
        "goto": "goto",
        "else": "else",
        "then": "then",
        "local": "local",
        "break": "break",
        "until": "until",
        "while": "while",
        "elseif": "elseif",
        "repeat": "repeat",
        "return": "return",
        "function": "function",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          tokenizer = new Tokenizer(source, {
            contextualGoto: false,
          });

          assertObjectMatch(tokenizer.tokenize(), {
            type: TokenType.Keyword,
            value: result,
          });
        });
      });
    });

    describe("correctly tokenizes booleans", () => {
      const testTable = {
        "true": "true",
        "false": "false",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          tokenizer = new Tokenizer(source);

          assertObjectMatch(tokenizer.tokenize(), {
            type: TokenType.BooleanLiteral,
            value: result,
          });
        });
      });
    });

    describe("correctly tokenizes string literals", () => {
      const testTable = {
        "''": "''",
        '""': '""',
        "'foo'": "'foo'",
        '"baz"': '"baz"',
        '"bar"': '"bar"',
        '"\nhello world"': '"\nhello world"',
        "'\\''": "'\\''",
        '"\\""': '"\\""',
        "[[ hello world ]]": "[[ hello world ]]",
        "[=[one [[two]] one]=]": "[=[one [[two]] one]=]",
        "[===[one [[two]] one]===]": "[===[one [[two]] one]===]",
        "[=[one [ [==[ one]=]": "[=[one [ [==[ one]=]",
        '[[This is an "escaped" word, the characters ]].]]':
          '[[This is an "escaped" word, the characters ]]',
        "[[]]": "[[]]",
        "[==[]==]": "[==[]==]",
        "[[**Hello**, &_world_&.]] &_*Won#der#ful* day_&, **-don't- you** #th*in*k?#":
          "[[**Hello**, &_world_&.]]",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          tokenizer = new Tokenizer(source);

          assertObjectMatch(tokenizer.tokenize(), {
            type: TokenType.StringLiteral,
            value: result,
          });
        });
      });

      it("should handle lnum when string contains new lines", () => {
        const source = '"hello \n world"';
        tokenizer = new Tokenizer(source);

        tokenizer.tokenize();

        assertEquals(tokenizer.scanner.lnum, 2);
      });
    });

    describe("throws errors when unexpected characters appear while parsing string literals", () => {
      const testTable = {
        '"': "[1:2] unfinished string near '\"'",
        "'": "[1:2] unfinished string near '''",
        "'\\": "[1:4] unfinished string near ''\\'",
        "[[": "[1:3] unfinished long string near '[['",
        "[[]": "[1:4] unfinished long string near '[[]'",
        "[==============================sup":
          "[1:32] unfinished long string near '[=============================='",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          assertThrows(
            () => (new Tokenizer(source)).tokenize(),
            SyntaxError,
            result,
          );
        });
      });
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

          assertObjectMatch(tokenizer.tokenize(), {
            type: TokenType.NumericLiteral,
            value: result,
          });
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

            assertObjectMatch(tokenizer.tokenize(), {
              type: TokenType.NumericLiteral,
              value: result,
            });
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

            assertObjectMatch(tokenizer.tokenize(), {
              type: TokenType.NumericLiteral,
              value: result,
            });
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

            assertObjectMatch(tokenizer.tokenize(), {
              type: TokenType.NumericLiteral,
              value: result,
            });
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

            assertObjectMatch(tokenizer.tokenize(), {
              type: TokenType.NumericLiteral,
              value: result,
            });
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

            assertObjectMatch(tokenizer.tokenize(), {
              type: TokenType.NumericLiteral,
              value: result,
            });
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
        "0x.40LL": "[1:8] malformed number near '0x.40LL'",
        // Imaginary number suffix cannot be followed by integer suffix
        "3.33iULL": "[1:9] malformed number near '3.33iULL'",
        "3.33iLL": "[1:8] malformed number near '3.33iLL'",
        "333iULL": "[1:8] malformed number near '333iULL'",
        "333iLL": "[1:7] malformed number near '333iLL'",
        "0x4iULL": "[1:8] malformed number near '0x4iULL'",
        "0x4iLL": "[1:7] malformed number near '0x4iLL'",
        "0x.4iULL": "[1:9] malformed number near '0x.4iULL'",
        "0x.4iLL": "[1:8] malformed number near '0x.4iLL'",
        "0x4.3iULL": "[1:10] malformed number near '0x4.3iULL'",
        "0x4.2iLL": "[1:9] malformed number near '0x4.2iLL'",
        // Numbers with exponent cannot be followed by integer suffix.
        "333e3ULL": "[1:9] malformed number near '333e3ULL'",
        "0x4p3ULL": "[1:9] malformed number near '0x4p3ULL'",
      };

      Object.entries(testTable).forEach(([source, result]) => {
        it(`when identifier is "${source}"`, () => {
          assertThrows(
            () => (new Tokenizer(source)).tokenize(),
            SyntaxError,
            result,
          );
        });
      });
    });
  });

  describe("correctly tokenizes single comments", () => {
    const testTable = {
      "-- comment": [
        {
          type: TokenType.Comment,
          value: "-- comment",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--comment": [
        {
          type: TokenType.Comment,
          value: "--comment",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "-- comment\n-- comment": [
        {
          type: TokenType.Comment,
          value: "-- comment",
        },
        {
          type: TokenType.Comment,
          value: "-- comment",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "-- comment\nreturn": [
        {
          type: TokenType.Comment,
          value: "-- comment",
        },
        {
          type: TokenType.Keyword,
          value: "return",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "return --comment \n": [
        {
          type: TokenType.Keyword,
          value: "return",
        },
        {
          type: TokenType.Comment,
          value: "--comment ",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--=[comment]=] return": [
        {
          type: TokenType.Comment,
          value: "--=[comment]=] return",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "if true -- comment\nthen end": [
        {
          type: TokenType.Keyword,
          value: "if",
        },
        {
          type: TokenType.BooleanLiteral,
          value: "true",
        },
        {
          type: TokenType.Comment,
          value: "-- comment",
        },
        {
          type: TokenType.Keyword,
          value: "then",
        },
        {
          type: TokenType.Keyword,
          value: "end",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "-- [[ hello world ]]\n local a": [
        {
          type: TokenType.Comment,
          value: "-- [[ hello world ]]",
        },
        {
          type: TokenType.Keyword,
          value: "local",
        },
        {
          type: TokenType.Identifier,
          value: "a",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
    };

    Object.entries(testTable).forEach(([source, results]) => {
      it(`when source is "${source}"`, () => {
        tokenizer = new Tokenizer(source);

        results.forEach((result) =>
          assertObjectMatch(tokenizer.tokenize(), result)
        );
      });
    });
  });

  describe("correctly tokenizes long comments", () => {
    const testTable = {
      "--[[ hello world ]]": [
        {
          type: TokenType.Comment,
          value: "--[[ hello world ]]",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[]]--[[]]": [
        {
          type: TokenType.Comment,
          value: "--[[]]",
        },
        {
          type: TokenType.Comment,
          value: "--[[]]",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[ hello world \n ]]": [
        {
          type: TokenType.Comment,
          value: "--[[ hello world \n ]]",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[ hello world \n ]] --": [
        {
          type: TokenType.Comment,
          value: "--[[ hello world \n ]]",
        },
        {
          type: TokenType.Comment,
          value: "--",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[ hello world \n ]] -- ": [
        {
          type: TokenType.Comment,
          value: "--[[ hello world \n ]]",
        },
        {
          type: TokenType.Comment,
          value: "-- ",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[ hello world \n ]] -- \n foo": [
        {
          type: TokenType.Comment,
          value: "--[[ hello world \n ]]",
        },
        {
          type: TokenType.Comment,
          value: "-- ",
        },
        {
          type: TokenType.Identifier,
          value: "foo",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "if true--[[comment]]then end": [
        {
          type: TokenType.Keyword,
          value: "if",
        },
        {
          type: TokenType.BooleanLiteral,
          value: "true",
        },
        {
          type: TokenType.Comment,
          value: "--[[comment]]",
        },
        {
          type: TokenType.Keyword,
          value: "then",
        },
        {
          type: TokenType.Keyword,
          value: "end",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[comment\nline two]]": [
        {
          type: TokenType.Comment,
          value: "--[[comment\nline two]]",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[\ncomment\nline two\n]]": [
        {
          type: TokenType.Comment,
          value: "--[[\ncomment\nline two\n]]",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
      "--[[\ncomment\nline two\n]]--[[\n\n\ncomment\n\n\n]]": [
        {
          type: TokenType.Comment,
          value: "--[[\ncomment\nline two\n]]",
        },
        {
          type: TokenType.Comment,
          value: "--[[\n\n\ncomment\n\n\n]]",
        },
        {
          type: TokenType.EOF,
          value: "<eof>",
        },
      ],
    };

    Object.entries(testTable).forEach(([source, results]) => {
      it(`when source is "${source}"`, () => {
        tokenizer = new Tokenizer(source);

        results.forEach((result) =>
          assertObjectMatch(tokenizer.tokenize(), result)
        );
      });
    });
  });

  describe("correctly tokenizes vararg literal", () => {
    const testTable = {
      "...": "...",
      "... .": "...",
      "... ..": "...",
    };

    Object.entries(testTable).forEach(([source, result]) => {
      it(`when identifier is "${source}"`, () => {
        tokenizer = new Tokenizer(source);

        assertObjectMatch(tokenizer.tokenize(), {
          type: TokenType.VarargLiteral,
          value: result,
        });
      });
    });
  });

  describe("punctuators", () => {
    it("should correctly tokenize single char punctuator", () => {
      const source = "*^%,{}]();#-+|&:/~><=";
      tokenizer = new Tokenizer(source);

      for (const value of source) {
        assertObjectMatch(tokenizer.tokenize(), {
          type: TokenType.Punctuator,
          value,
        });
      }
    });

    const testTable = {
      "::": "::",
      "//": "//",
      "~=": "~=",
      "<<": "<<",
      ">>": ">>",
      "==": "==",
      "..": "..",
    };

    Object.entries(testTable).forEach(([source, result]) => {
      it(`should tokenize punctuators with double chars when identifier is "${source}"`, () => {
        tokenizer = new Tokenizer(source);

        assertObjectMatch(tokenizer.tokenize(), {
          type: TokenType.Punctuator,
          value: result,
        });
      });
    });
  });
});
