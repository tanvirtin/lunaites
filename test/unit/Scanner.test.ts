import { Scanner } from "../../src/Scanner.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("Scanner", () => {
  let scanner: Scanner;

  describe("scan", () => {
    it("increments the current scanner index by 1", () => {
      assertEquals((new Scanner("hello world")).index, 0);
    });

    it("increments the current scanner index by a specific number", () => {
      scanner = new Scanner("hello world");

      assertEquals(scanner.index, 0);

      scanner.scan(200);

      assertEquals(scanner.index, 200);
      assert(scanner.isOutOfBounds());
    });
  });

  describe("scanWhile", () => {
    it("should scan until a given scanner evaluates to false", () => {
      const scanner = new Scanner("........................h");

      scanner.scanWhile(scanner.isDotNotation);

      assertEquals(scanner.getChar(), "h");
    });

    it("should scan until a given function evaluates to false", () => {
      const scanner = new Scanner("........................h");

      scanner.scanWhile(() => true);

      assert(scanner.isOutOfBounds());
      assertEquals(scanner.getChar(), undefined);
    });
  });

  describe("scanUntil", () => {
    it("should scan until a given function evaluates to true", () => {
      const scanner = new Scanner("........................h");

      scanner.scanUntil(scanner.isOutOfBounds);

      assert(scanner.isOutOfBounds());
      assertEquals(scanner.getChar(), undefined);
    });
  });

  describe("isBackslash", () => {
    it("should return true if the char being pointed at is a backslash", () => {
      assert((new Scanner("\\'")).isBackslash());
    });

    it("should return false if the char being pointed at is not a backslash", () => {
      assert(!(new Scanner("\e")).isBackslash());
      assert(!(new Scanner("/")).isBackslash());
    });
  });

  describe("isCharCode", () => {
    it("should return true if the char being pointed at is a the given char code", () => {
      assert((new Scanner("E")).isCharCode(69, 0));
      assert((new Scanner("e")).isCharCode(101, 0));
    });

    it("should return false if the char being pointed at is not a given char code", () => {
      assert(!(new Scanner("E")).isCharCode(68, 0));
      assert(!(new Scanner("e")).isCharCode(100, 0));
    });
  });

  describe("isHexadecimal", () => {
    it("should return true if the char being pointed at is a hexadecimal", () => {
      assert((new Scanner("0x3b24")).isHexadecimal(0));
      assert((new Scanner("0X3b24")).isHexadecimal(0));
      assert((new Scanner("0XF96")).isHexadecimal(0));
      assert((new Scanner("0x21")).isHexadecimal(0));
      assert((new Scanner("0x3AA")).isHexadecimal(0));
      assert((new Scanner("0X29b")).isHexadecimal(0));
      assert((new Scanner("0X4bD")).isHexadecimal(0));
    });

    it("should return false if the char being pointed at is not a hexadecimal", () => {
      assert(!(new Scanner("03b24")).isHexadecimal(0));
      assert(!(new Scanner("0")).isHexadecimal(0));
      assert(!(new Scanner("01")).isHexadecimal(0));
      assert(!(new Scanner(" 0X29b")).isHexadecimal(0));
      assert(!(new Scanner(" 0x29b")).isHexadecimal(0));
      assert(!(new Scanner("0 x29b")).isHexadecimal(0));
      assert(!(new Scanner("0 X29c")).isHexadecimal(0));
      assert(!(new Scanner("")).isHexadecimal(0));
    });
  });

  describe("isQuote", () => {
    it("should return true if the char being pointed at is a quote", () => {
      assert((new Scanner("'")).isQuote(0));
    });

    it("should return false if the char being pointed at is not a quote", () => {
      assert(!(new Scanner('"')).isQuote(0));
      assert(!(new Scanner("`")).isQuote(0));
    });
  });

  describe("isDoubleQuote", () => {
    it("should return true if the char being pointed at is a doubleQuote", () => {
      assert((new Scanner('"')).isDoubleQuote(0));
    });

    it("should return false if the char being pointed at is not a doubleQuote", () => {
      assert(!(new Scanner("'")).isDoubleQuote(0));
      assert(!(new Scanner("`")).isDoubleQuote(0));
    });
  });

  describe("isDotNotation", () => {
    it("should return true if the char being pointed at is a whitespace", () => {
      assert((new Scanner(".")).isDotNotation(0));
      assert((new Scanner("..")).isDotNotation(0));
      assert((new Scanner(". ")).isDotNotation(0));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      assert(!(new Scanner("\n .")).isDotNotation(0));
      assert(!(new Scanner(" .")).isDotNotation(0));
    });
  });

  describe("isWhitespace", () => {
    it("should return true if the char being pointed at is a whitespace", () => {
      assert((new Scanner(" ")).isWhitespace(0));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      assert(!(new Scanner("\n")).isWhitespace(0));
    });
  });

  describe("isLineFeed", () => {
    it("should return true if the char being pointed at is line feed", () => {
      assert((new Scanner("\n")).isLineFeed(0));
    });

    it("should return false if the char being pointed at is line feed", () => {
      assert(!(new Scanner("\r")).isLineFeed(0));
    });
  });

  describe("isCarriageReturn", () => {
    it("should return true if the char being pointed at is carriage return", () => {
      assert((new Scanner("\r")).isCarriageReturn(0));
    });

    it("should return false if the char being pointed at is carriage return", () => {
      assert(!(new Scanner("\n")).isCarriageReturn(0));
    });
  });

  describe("isLineTerminator", () => {
    it("should return true if the char being pointed at is line feed or carriage return", () => {
      scanner = new Scanner("\r\n\n\r");

      assert(scanner.isLineTerminator(0));
      assert(scanner.isLineTerminator(1));
      assert(scanner.isLineTerminator(2));
      assert(scanner.isLineTerminator(3));
    });

    it("should return false if the char being pointed at is line feed or carriage return", () => {
      scanner = new Scanner(" a s c");

      assert(!scanner.isLineTerminator(0));
      assert(!scanner.isLineTerminator(1));
      assert(!scanner.isLineTerminator(2));
      assert(!scanner.isLineTerminator(3));
    });
  });

  describe("isNewLine", () => {
    it("should return true if the char being pointed at is a combination of line feed and carriage return", () => {
      scanner = new Scanner("\r\n\n\r");

      assert(scanner.isNewLine());

      scanner.scan();
      scanner.scan();

      assert(scanner.isNewLine());
    });

    it("should return false if the char being pointed at is not a combination of line feed and carriage return", () => {
      scanner = new Scanner("\n \r");

      assert(!scanner.isNewLine(0));
      assert(!scanner.isNewLine(1));
      assert(!scanner.isNewLine(2));
    });
  });

  describe("isDigit", () => {
    it("should return true if the char being pointed at is a digit", () => {
      assert((new Scanner("3")).isDigit(0));
    });

    it("should return false if the char being pointed at is not a digit", () => {
      assert(!(new Scanner("\n")).isDigit(0));
    });
  });

  describe("isExtendedAlphabet", () => {
    it("should return true if the char being pointed at is an extended alphabet", () => {
      assert((new Scanner("œ")).isExtendedAlphabets(0));
    });

    it("should return false if the char being pointed at is not an extended alphabet", () => {
      assert(!(new Scanner("4")).isExtendedAlphabets(0));
    });
  });

  describe("isAlphabet", () => {
    it("should return true if the char being pointed at is an alphabet", () => {
      assert((new Scanner("a")).isAlphabet(0));
    });

    it("should return false if the char being pointed at is not an alphabet", () => {
      assert(
        !(new Scanner("1")).isAlphabet(0),
      );
    });
  });

  describe("isHexDigit", () => {
    it("should return true if the char being pointed at a hex digit", () => {
      assert((new Scanner("1")).isHexDigit(0));
      assert((new Scanner("2")).isHexDigit(0));
      assert((new Scanner("3")).isHexDigit(0));
      assert((new Scanner("4")).isHexDigit(0));
      assert((new Scanner("5")).isHexDigit(0));
      assert((new Scanner("6")).isHexDigit(0));
      assert((new Scanner("7")).isHexDigit(0));
      assert((new Scanner("8")).isHexDigit(0));
      assert((new Scanner("9")).isHexDigit(0));
      assert((new Scanner("A")).isHexDigit(0));
      assert((new Scanner("B")).isHexDigit(0));
      assert((new Scanner("C")).isHexDigit(0));
      assert((new Scanner("D")).isHexDigit(0));
      assert((new Scanner("E")).isHexDigit(0));
      assert((new Scanner("F")).isHexDigit(0));
      assert((new Scanner("a")).isHexDigit(0));
      assert((new Scanner("b")).isHexDigit(0));
      assert((new Scanner("c")).isHexDigit(0));
      assert((new Scanner("d")).isHexDigit(0));
      assert((new Scanner("e")).isHexDigit(0));
      assert((new Scanner("f")).isHexDigit(0));
    });

    it("should return false if the char being pointed at is not a hex digit", () => {
      assert(!(new Scanner("ž")).isHexDigit(0));
      assert(!(new Scanner(";")).isHexDigit(0));
      assert(!(new Scanner("\n")).isHexDigit(0));
      assert(!(new Scanner("z")).isHexDigit(0));
      assert(!(new Scanner("g")).isHexDigit(0));
      assert(!(new Scanner("G")).isHexDigit(0));
    });
  });

  describe("isAlphanumeric", () => {
    it("should return true if the char being pointed at is a number or a alphabet or an extended alphabet", () => {
      scanner = new Scanner("a4ž");

      assert(scanner.isAlphanumeric(0));
      assert(scanner.isAlphanumeric(1));
      assert(scanner.isAlphanumeric(2));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      scanner = new Scanner("[]");

      assert(!scanner.isAlphanumeric(0));
      assert(!scanner.isAlphanumeric(1));
    });
  });

  describe("isOutOfBounds", () => {
    it("returns true if scanner is beyond the source", () => {
      scanner = new Scanner("nnn");

      scanner.scan();
      scanner.scan();
      scanner.scan();

      assert(scanner.isOutOfBounds());
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      scanner = new Scanner("[]");

      assert(!scanner.isOutOfBounds());
    });
  });

  describe("getChar", () => {
    it("returns the char at the scanner", () => {
      scanner = new Scanner("nmp");

      assertEquals(scanner.getChar(), "n");
      assertEquals(scanner.getChar(1), "m");
      assertEquals(scanner.getChar(2), "p");
    });
  });

  describe("getCharCode", () => {
    it("returns the char code at the scanner", () => {
      scanner = new Scanner("npm");

      assertEquals(scanner.getCharCode(), 110);
      assertEquals(scanner.getCharCode(1), 112);
      assertEquals(scanner.getCharCode(2), 109);
    });
  });

  describe("getText", () => {
    it("returns a text for a given range from the source", () => {
      scanner = new Scanner("npm");

      assertEquals(scanner.getText(0, 3), "npm");
    });

    it("returns a text starting at a marked spot from the source", () => {
      scanner = new Scanner("hello");

      scanner.mark();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();

      assertEquals(scanner.getText(), "hello");
    });
  });

  describe("getRange", () => {
    it("returns an array for a given range", () => {
      scanner = new Scanner("npm");

      assertEquals(scanner.getRange(0, 3), [0, 3]);
    });

    it("returns an array starting at a marked spot", () => {
      scanner = new Scanner("hello");

      scanner.mark();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();

      assertEquals(scanner.getRange(), [0, 5]);
    });
  });

  describe("mark", () => {
    it("tracks the current index in memory", () => {
      scanner = new Scanner("memory");
      scanner.scan();
      scanner.mark();

      assertEquals(scanner.getRange(), [1, 1]);
    });
  });

  describe("comsumeWhitespace", () => {
    it("consumes all whitespaces", () => {
      scanner = new Scanner("          9      3");
      scanner.comsumeWhitespace();

      assertEquals(scanner.getChar(), "9");

      scanner.scan();
      scanner.comsumeWhitespace();

      assertEquals(scanner.getChar(), "3");

      scanner.comsumeWhitespace();
      assertEquals(scanner.getChar(), "3");

      scanner.scan();
      scanner.comsumeWhitespace();

      assert(scanner.isOutOfBounds());
    });

    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      scanner = new Scanner("  \r  \n      local  \r\n  \n\r    bar  baz ");
      scanner.comsumeWhitespace().scan("local".length).comsumeWhitespace().scan(
        "bar".length,
      ).comsumeWhitespace();

      assertEquals(
        scanner.getText(scanner.index, scanner.index + "baz".length),
        "baz",
      );
    });

    it("should track line numbers being added", () => {
      scanner = new Scanner("  \r  \n      local  \r\n  \n\r    bar  baz ");

      scanner.comsumeWhitespace();

      assertEquals(scanner.lnum, 3);
    });

    it("should track line start positions", () => {
      scanner = new Scanner("  \r  \n      local  \r\n  \n\r    bar  baz ");

      scanner.comsumeWhitespace();
      assertEquals(scanner.lnumStartIndex, 6);

      scanner.scan("local".length).comsumeWhitespace();
      assertEquals(scanner.lnumStartIndex, 25);
    });
  });
});
