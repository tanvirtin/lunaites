import { Scanner } from "./mod.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  describe,
  it,
} from "./deps.ts";

describe("Scanner", () => {
  let scanner: Scanner;

  describe("scan", () => {
    it("increments the current scanner index by 1", () => {
      assertEquals((new Scanner("hello world")).pos, 0);
    });

    it("increments the current scanner index by a specific number", () => {
      scanner = new Scanner("hello world");

      assertStrictEquals(scanner.pos, 0);

      scanner.scan(200);

      assertStrictEquals(scanner.pos, 200);

      assert(scanner.isOutOfBoundsAt(scanner.pos));
    });
  });

  describe("scanWhile", () => {
    it("should scan until a given scanner evaluates to false", () => {
      const scanner = new Scanner("\n\n\n\n\n\n\n\n\n\nh");

      scanner.scanWhile(() => scanner.isLineFeedAt(scanner.pos));

      assertEquals(scanner.char, "h");
    });

    it("should scan until a given function evaluates to false", () => {
      const scanner = new Scanner("........................h");

      scanner.scanWhile(() => true);

      assert(scanner.isOutOfBoundsAt(scanner.pos));
      assertEquals(scanner.char, undefined);
    });
  });

  describe("scanUntil", () => {
    it("should scan until a given function evaluates to true", () => {
      const scanner = new Scanner("........................h");

      scanner.scanUntil(() => scanner.isOutOfBoundsAt(scanner.pos));

      assert(scanner.isOutOfBoundsAt(scanner.pos));
      assertEquals(scanner.char, undefined);
    });
  });

  describe("match", () => {
    it("should return true if the number of consequetive chars equal the current slice in the positive index", () => {
      const scanner = new Scanner("0xb1e");

      assert(scanner.match("0x"));

      scanner.scan().scan();

      assert(scanner.match("b1e"));
    });

    it("should return false if the number of consequetive chars does not equal the current slice in the positive index", () => {
      const scanner = new Scanner("0xb1e");

      assert(!scanner.match("hello"));

      scanner.scan().scan();

      assert(!scanner.match("0xb1e"));
    });
  });

  describe("isCharCode", () => {
    it("should return true if the char being pointed at is a the given char code", () => {
      assert((new Scanner("E")).isCharCodeAt(0, 69));
      assert((new Scanner("e")).isCharCodeAt(0, 101));
    });

    it("should return false if the char being pointed at is not a given char code", () => {
      assert(!(new Scanner("E")).isCharCodeAt(0, 68));
      assert(!(new Scanner("e")).isCharCodeAt(0, 100));
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
      assert((new Scanner("\n")).isLineFeedAt(0));
    });

    it("should return false if the char being pointed at is line feed", () => {
      assert(!(new Scanner("\r")).isLineFeedAt(0));
    });
  });

  describe("isCarriageReturn", () => {
    it("should return true if the char being pointed at is carriage return", () => {
      assert((new Scanner("\r")).isCarriageReturnAt(0));
    });

    it("should return false if the char being pointed at is carriage return", () => {
      assert(!(new Scanner("\n")).isCarriageReturnAt(0));
    });
  });

  describe("isLineTerminator", () => {
    it("should return true if the char being pointed at is line feed or carriage return", () => {
      scanner = new Scanner("\r\n\n\r");

      assert(scanner.isLineTerminatorAt(0));
      assert(scanner.isLineTerminatorAt(1));
      assert(scanner.isLineTerminatorAt(2));
      assert(scanner.isLineTerminatorAt(3));
    });

    it("should return false if the char being pointed at is line feed or carriage return", () => {
      scanner = new Scanner(" a s c");

      assert(!scanner.isLineTerminatorAt(0));
      assert(!scanner.isLineTerminatorAt(1));
      assert(!scanner.isLineTerminatorAt(2));
      assert(!scanner.isLineTerminatorAt(3));
    });
  });

  describe("isNewLine", () => {
    it("should return true if the char being pointed at is a combination of line feed and carriage return", () => {
      scanner = new Scanner("\r\n\n\r");

      assert(scanner.isNewLineAt(scanner.pos));

      scanner.scan();
      scanner.scan();

      assert(scanner.isNewLineAt(scanner.pos));
    });

    it("should return false if the char being pointed at is not a combination of line feed and carriage return", () => {
      scanner = new Scanner("\n \r");

      assert(!scanner.isNewLineAt(0));
      assert(!scanner.isNewLineAt(1));
      assert(!scanner.isNewLineAt(2));
    });
  });

  describe("isDigit", () => {
    it("should return true if the char being pointed at is a digit", () => {
      assert((new Scanner("3")).isDigitAt(0));
    });

    it("should return false if the char being pointed at is not a digit", () => {
      assert(!(new Scanner("\n")).isDigitAt(0));
    });
  });

  describe("isExtendedAlphabet", () => {
    it("should return true if the char being pointed at is an extended alphabet", () => {
      assert((new Scanner("œ")).isExtendedAlphabetsAt(0));
    });

    it("should return false if the char being pointed at is not an extended alphabet", () => {
      assert(!(new Scanner("4")).isExtendedAlphabetsAt(0));
    });
  });

  describe("isAlphabet", () => {
    it("should return true if the char being pointed at is an alphabet", () => {
      assert((new Scanner("a")).isAlphabetAt(0));
    });

    it("should return false if the char being pointed at is not an alphabet", () => {
      assert(
        !(new Scanner("1")).isAlphabetAt(0),
      );
    });
  });

  describe("isHexDigit", () => {
    it("should return true if the char being pointed at a hex digit", () => {
      assert((new Scanner("1")).isHexDigitAt(0));
      assert((new Scanner("2")).isHexDigitAt(0));
      assert((new Scanner("3")).isHexDigitAt(0));
      assert((new Scanner("4")).isHexDigitAt(0));
      assert((new Scanner("5")).isHexDigitAt(0));
      assert((new Scanner("6")).isHexDigitAt(0));
      assert((new Scanner("7")).isHexDigitAt(0));
      assert((new Scanner("8")).isHexDigitAt(0));
      assert((new Scanner("9")).isHexDigitAt(0));
      assert((new Scanner("A")).isHexDigitAt(0));
      assert((new Scanner("B")).isHexDigitAt(0));
      assert((new Scanner("C")).isHexDigitAt(0));
      assert((new Scanner("D")).isHexDigitAt(0));
      assert((new Scanner("E")).isHexDigitAt(0));
      assert((new Scanner("F")).isHexDigitAt(0));
      assert((new Scanner("a")).isHexDigitAt(0));
      assert((new Scanner("b")).isHexDigitAt(0));
      assert((new Scanner("c")).isHexDigitAt(0));
      assert((new Scanner("d")).isHexDigitAt(0));
      assert((new Scanner("e")).isHexDigitAt(0));
      assert((new Scanner("f")).isHexDigitAt(0));
    });

    it("should return false if the char being pointed at is not a hex digit", () => {
      assert(!(new Scanner("ž")).isHexDigitAt(0));
      assert(!(new Scanner(";")).isHexDigitAt(0));
      assert(!(new Scanner("\n")).isHexDigitAt(0));
      assert(!(new Scanner("z")).isHexDigitAt(0));
      assert(!(new Scanner("g")).isHexDigitAt(0));
      assert(!(new Scanner("G")).isHexDigitAt(0));
    });
  });

  describe("isAlphanumeric", () => {
    it("should return true if the char being pointed at is a number or a alphabet or an extended alphabet", () => {
      scanner = new Scanner("a4ž");

      assert(scanner.isAlphanumericAt(0));
      assert(scanner.isAlphanumericAt(1));
      assert(scanner.isAlphanumericAt(2));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      scanner = new Scanner("[]");

      assert(!scanner.isAlphanumericAt(0));
      assert(!scanner.isAlphanumericAt(1));
    });
  });

  describe("isOutOfBounds", () => {
    it("returns true if scanner is beyond the source", () => {
      scanner = new Scanner("nnn");

      scanner.scan();
      scanner.scan();
      scanner.scan();

      assert(scanner.isOutOfBoundsAt(scanner.pos));
    });

    it("should return false if the char being pointed at is not a whitespace", () => {
      scanner = new Scanner("[]");

      assert(!scanner.isOutOfBoundsAt(scanner.pos));
    });
  });

  describe("getChar", () => {
    it("returns the char at the scanner", () => {
      scanner = new Scanner("nmp");

      assertEquals(scanner.char, "n");
    });
  });

  describe("getCharCode", () => {
    it("returns the char code at the scanner", () => {
      scanner = new Scanner("npm");

      assertEquals(scanner.charCode, 110);
    });
  });

  describe("getText", () => {
    it("returns a text starting at a marked spot from the source", () => {
      scanner = new Scanner("hello");

      scanner.mark();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();

      assertEquals(scanner.text, "hello");
    });
  });

  describe("getRange", () => {
    it("returns an array starting at a marked spot", () => {
      scanner = new Scanner("hello");

      scanner.mark();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();
      scanner.scan();

      assertEquals(scanner.range, [0, 5]);
    });
  });

  describe("mark", () => {
    it("tracks the current index in memory", () => {
      scanner = new Scanner("memory");
      scanner.scan();
      scanner.mark();

      assertEquals(scanner.range, [1, 1]);
    });
  });
});
