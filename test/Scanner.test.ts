import { Scanner } from "../src/Scanner.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("Scanner", () => {
  describe("isWhitespace", () => {
    it("should return true if the char being pointed at is a whitespace", () => {
      const scanner = new Scanner(" ");

      assert(scanner.isWhitespace(0));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      const scanner = new Scanner("\n");

      assert(!scanner.isWhitespace(0));
    });
  });

  describe("isLineFeed", () => {
    it("should return true if the char being pointed at is line feed", () => {
      const scanner = new Scanner("\n");

      assert(scanner.isLineFeed(0));
    });

    it("should return false if the char being pointed at is line feed", () => {
      const scanner = new Scanner("\r");

      assert(!scanner.isLineFeed(0));
    });
  });

  describe("isCarriageReturn", () => {
    it("should return true if the char being pointed at is carriage return", () => {
      const scanner = new Scanner("\r");

      assert(scanner.isCarriageReturn(0));
    });

    it("should return false if the char being pointed at is carriage return", () => {
      const scanner = new Scanner("\n");

      assert(!scanner.isCarriageReturn(0));
    });
  });

  describe("isLineTerminator", () => {
    it("should return true if the char being pointed at is line feed or carriage return", () => {
      const scanner = new Scanner("\r\n\n\r");

      assert(scanner.isLineTerminator(0));
      assert(scanner.isLineTerminator(1));
      assert(scanner.isLineTerminator(2));
      assert(scanner.isLineTerminator(3));
    });

    it("should return false if the char being pointed at is line feed or carriage return", () => {
      const scanner = new Scanner(" a s c");

      assert(!scanner.isLineTerminator(0));
      assert(!scanner.isLineTerminator(1));
      assert(!scanner.isLineTerminator(2));
      assert(!scanner.isLineTerminator(3));
    });
  });

  describe("isNewLine", () => {
    it("should return true if the char being pointed at is a combination of line feed and carriage return", () => {
      const scanner = new Scanner("\r\n\n\r");

      scanner.increment();

      assert(scanner.isNewLine());

      scanner.increment();
      scanner.increment();

      assert(scanner.isNewLine());
    });

    it("should return false if the char being pointed at is not a combination of line feed and carriage return", () => {
      const scanner = new Scanner("\n \r");

      assert(!scanner.isNewLine(0));
      assert(!scanner.isNewLine(1));
      assert(!scanner.isNewLine(2));
    });
  });

  describe("isDigit", () => {
    it("should return true if the char being pointed at is a digit", () => {
      const scanner = new Scanner("3");

      assert(scanner.isDigit(0));
    });

    it("should return false if the char being pointed at is not a digit", () => {
      const scanner = new Scanner("\n");

      assert(!scanner.isDigit(0));
    });
  });

  describe("isExtendedAlphabet", () => {
    it("should return true if the char being pointed at is an extended alphabet", () => {
      const scanner = new Scanner("œ");

      assert(scanner.isExtendedAlphabets(0));
    });

    it("should return false if the char being pointed at is not an extended alphabet", () => {
      const scanner = new Scanner("4");

      assert(!scanner.isExtendedAlphabets(0));
    });
  });

  describe("isAlphabet", () => {
    describe("with extendentIdentifiers set to true", () => {
      it("should return true if the char being pointed at is an extended alphabet", () => {
        const scanner = new Scanner("ž", {
          extendedIdentifiers: true,
        });

        assert(scanner.isAlphabet(0));
      });

      it("should return true if the char being pointed at is an alphabet", () => {
        const scanner = new Scanner("a", {
          extendedIdentifiers: true,
        });

        assert(scanner.isAlphabet(0));
      });

      it("should return false if the char being pointed at is not an alphabet", () => {
        const scanner = new Scanner("1", {
          extendedIdentifiers: true,
        });

        assert(!scanner.isAlphabet(0));
      });
    });

    describe("with extendentIdentifiers set to false", () => {
      it("should return false if the char being pointed at is an extended alphabet", () => {
        const scanner = new Scanner("ž", {
          extendedIdentifiers: false,
        });

        assert(!scanner.isAlphabet(0));
      });

      it("should return true if the char being pointed at is an alphabet", () => {
        const scanner = new Scanner("a", {
          extendedIdentifiers: false,
        });

        assert(scanner.isAlphabet(0));
      });

      it("should return false if the char being pointed at is not an alphabet", () => {
        const scanner = new Scanner("1", {
          extendedIdentifiers: false,
        });

        assert(!scanner.isAlphabet(0));
      });
    });
  });

  describe("isAlphanumeric", () => {
    it("should return true if the char being pointed at is a number or a alphabet or an extended alphabet", () => {
      const scanner = new Scanner("a4ž");

      assert(scanner.isAlphanumeric(0));
      assert(scanner.isAlphanumeric(1));
      assert(scanner.isAlphanumeric(2));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      const scanner = new Scanner("[]");

      assert(!scanner.isAlphanumeric(0));
      assert(!scanner.isAlphanumeric(1));
    });
  });

  describe("isOutOfBounds", () => {
    it("returns true if scanner is beyond the source", () => {
      const scanner = new Scanner("nnn");

      scanner.increment();
      scanner.increment();
      scanner.increment();
      scanner.increment();

      assert(scanner.isOutOfBounds());
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      const scanner = new Scanner("[]");

      scanner.increment();

      assert(!scanner.isOutOfBounds());
    });
  });

  describe("getChar", () => {
    it("returns the char at the scanner", () => {
      const scanner = new Scanner("nmp");

      scanner.increment();
      assertEquals(scanner.getChar(), "n");
      assertEquals(scanner.getChar(1), "m");
      assertEquals(scanner.getChar(2), "p");
    });
  });

  describe("getCharCode", () => {
    it("returns the char code at the scanner", () => {
      const scanner = new Scanner("npm");

      scanner.increment();
      assertEquals(scanner.getCharCode(), 110);
      assertEquals(scanner.getCharCode(1), 112);
      assertEquals(scanner.getCharCode(2), 109);
    });
  });

  describe("getText", () => {
    it("returns a text for a given range from the source", () => {
      const scanner = new Scanner("npm");

      assertEquals(scanner.getText(0, 3), "npm");
    });

    it("returns a text starting at a marked spot from the source", () => {
      const scanner = new Scanner("hello");

      scanner.increment();
      scanner.mark();
      scanner.increment();
      scanner.increment();
      scanner.increment();
      scanner.increment();
      scanner.increment();

      assertEquals(scanner.getText(), "hello");
    });
  });

  describe("getRange", () => {
    it("returns an array for a given range", () => {
      const scanner = new Scanner("npm");

      assertEquals(scanner.getRange(0, 3), [0, 3]);
    });

    it("returns an array starting at a marked spot", () => {
      const scanner = new Scanner("hello");

      scanner.increment();
      scanner.mark();
      scanner.increment();
      scanner.increment();
      scanner.increment();
      scanner.increment();
      scanner.increment();

      assertEquals(scanner.getRange(), [0, 5]);
    });
  });
});
