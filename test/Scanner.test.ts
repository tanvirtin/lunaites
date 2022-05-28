import { Scanner } from "../src/Scanner.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("Scanner", () => {
  let scanner;

  describe("scan", () => {
    it("increments the current scanner index by 1", () => {
      scanner = new Scanner("hello world");

      scanner.scan();

      assertEquals(scanner.index, 0);
    });

    it("increments the current scanner index by a specific number", () => {
      scanner = new Scanner("hello world");

      scanner.scan();

      assertEquals(scanner.index, 0);

      scanner.scan(200);

      assertEquals(scanner.index, 200);
      assert(scanner.isOutOfBounds());
    });
  });

  describe("isWhitespace", () => {
    it("should return true if the char being pointed at is a whitespace", () => {
      scanner = new Scanner(" ");

      assert(scanner.isWhitespace(0));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      scanner = new Scanner("\n");

      assert(!scanner.isWhitespace(0));
    });
  });

  describe("isLineFeed", () => {
    it("should return true if the char being pointed at is line feed", () => {
      scanner = new Scanner("\n");

      assert(scanner.isLineFeed(0));
    });

    it("should return false if the char being pointed at is line feed", () => {
      scanner = new Scanner("\r");

      assert(!scanner.isLineFeed(0));
    });
  });

  describe("isCarriageReturn", () => {
    it("should return true if the char being pointed at is carriage return", () => {
      scanner = new Scanner("\r");

      assert(scanner.isCarriageReturn(0));
    });

    it("should return false if the char being pointed at is carriage return", () => {
      scanner = new Scanner("\n");

      assert(!scanner.isCarriageReturn(0));
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

      scanner.scan();

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
      scanner = new Scanner("3");

      assert(scanner.isDigit(0));
    });

    it("should return false if the char being pointed at is not a digit", () => {
      scanner = new Scanner("\n");

      assert(!scanner.isDigit(0));
    });
  });

  describe("isExtendedAlphabet", () => {
    it("should return true if the char being pointed at is an extended alphabet", () => {
      scanner = new Scanner("œ");

      assert(scanner.isExtendedAlphabets(0));
    });

    it("should return false if the char being pointed at is not an extended alphabet", () => {
      scanner = new Scanner("4");

      assert(!scanner.isExtendedAlphabets(0));
    });
  });

  describe("isAlphabet", () => {
    describe("with extendentIdentifiers set to true", () => {
      it("should return true if the char being pointed at is an extended alphabet", () => {
        scanner = new Scanner("ž", {
          extendedIdentifiers: true,
        });

        assert(scanner.isAlphabet(0));
      });

      it("should return true if the char being pointed at is an alphabet", () => {
        scanner = new Scanner("a", {
          extendedIdentifiers: true,
        });

        assert(scanner.isAlphabet(0));
      });

      it("should return false if the char being pointed at is not an alphabet", () => {
        scanner = new Scanner("1", {
          extendedIdentifiers: true,
        });

        assert(!scanner.isAlphabet(0));
      });
    });

    describe("with extendentIdentifiers set to false", () => {
      it("should return false if the char being pointed at is an extended alphabet", () => {
        scanner = new Scanner("ž", {
          extendedIdentifiers: false,
        });

        assert(!scanner.isAlphabet(0));
      });

      it("should return true if the char being pointed at is an alphabet", () => {
        scanner = new Scanner("a", {
          extendedIdentifiers: false,
        });

        assert(scanner.isAlphabet(0));
      });

      it("should return false if the char being pointed at is not an alphabet", () => {
        scanner = new Scanner("1", {
          extendedIdentifiers: false,
        });

        assert(!scanner.isAlphabet(0));
      });
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
      scanner.scan();

      assert(scanner.isOutOfBounds());
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      scanner = new Scanner("[]");

      scanner.scan();

      assert(!scanner.isOutOfBounds());
    });
  });

  describe("getChar", () => {
    it("returns the char at the scanner", () => {
      scanner = new Scanner("nmp");

      scanner.scan();
      assertEquals(scanner.getChar(), "n");
      assertEquals(scanner.getChar(1), "m");
      assertEquals(scanner.getChar(2), "p");
    });
  });

  describe("getCharCode", () => {
    it("returns the char code at the scanner", () => {
      scanner = new Scanner("npm");

      scanner.scan();
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

      scanner.scan();
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

      scanner.scan();
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
      scanner.scan();
      scanner.mark();

      assertEquals(scanner.markedIndex, 1);
    });
  });

  describe("eatWhitespace", () => {
    it("consumes all whitespaces", () => {
      scanner = new Scanner("          9      3");
      scanner.scan();
      scanner.eatWhitespace();

      assertEquals(scanner.getChar(), "9");

      scanner.scan();
      scanner.eatWhitespace();

      assertEquals(scanner.getChar(), "3");

      scanner.eatWhitespace();
      assertEquals(scanner.getChar(), "3");

      scanner.scan();
      scanner.eatWhitespace();

      assertEquals(scanner.getChar(), undefined);

      assert(scanner.isOutOfBounds());
    });

    it("should disregard whitespace, line feed, carriage return and line break and return identifiers", () => {
      scanner = new Scanner("  \r  \n      local  \r\n  \n\r    bar  baz ");
      scanner.scan().eatWhitespace().scan("local".length).eatWhitespace().scan(
        "bar".length,
      ).eatWhitespace();

      assertEquals(scanner.getText(scanner.index, scanner.index + "baz".length), "baz")
    });

    it("should track line numbers being added", () => {
      scanner = new Scanner("  \r  \n      local  \r\n  \n\r    bar  baz ");

      scanner.scan().eatWhitespace();

      assertEquals(scanner.line, 2);
    });

    it("should track line start positions", () => {
      scanner = new Scanner("  \r  \n      local  \r\n  \n\r    bar  baz ");

      scanner.scan().eatWhitespace();
      assertEquals(scanner.lineStart, 6);

      scanner.scan("local".length).eatWhitespace();
      assertEquals(scanner.lineStart, 25);
    });
  });
});
