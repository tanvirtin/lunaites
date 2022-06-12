import { ErrorReporter, Scanner } from "../../mod.ts";
import { assertThrows, describe, it } from "../../deps.ts";

describe("ErrorReporter", () => {
  describe("reportMalformedNumber", () => {
    it("throws a malformed number error", () => {
      const computation = () => {
        const scanner = new Scanner("0x333pe");
        const errorReporter = new ErrorReporter(scanner);

        scanner.scan("0x333p".length);

        errorReporter.reportMalformedNumber();
      };

      assertThrows(
        computation,
        SyntaxError,
        "[1:7] malformed number near '0x333p'",
      );
    });
  });

  describe("reportUnfinishedString", () => {
    it("throws a unfinished string error", () => {
      const computation = () => {
        const scanner = new Scanner("'");
        const errorReporter = new ErrorReporter(scanner);

        scanner.scan();

        errorReporter.reportUnfinishedString();
      };

      assertThrows(
        computation,
        SyntaxError,
        "[1:2] unfinished string near '''",
      );
    });
  });

  describe("reportUnfinishedLongString", () => {
    it("throws a unfinished string error", () => {
      const computation = () => {
        const scanner = new Scanner("[[");
        const errorReporter = new ErrorReporter(scanner);

        scanner.scan().scan();

        errorReporter.reportUnfinishedLongString();
      };

      assertThrows(
        computation,
        SyntaxError,
        "[1:3] unfinished long string near '[['",
      );
    });
  });

  describe("reportUnexpectedCharacter", () => {
    it("throws a unfinished character error", () => {
      const computation = () => {
        const scanner = new Scanner("*");
        const errorReporter = new ErrorReporter(scanner);

        scanner.scan();

        errorReporter.reportUnexpectedCharacter();
      };

      assertThrows(
        computation,
        SyntaxError,
        "[1:2] unfinished character near '*'",
      );
    });
  });

  describe("reportUnfinishedComment", () => {
    it("throws a unfinished comment error", () => {
      const computation = () => {
        const scanner = new Scanner("--");
        const errorReporter = new ErrorReporter(scanner);

        scanner.scan().scan();

        errorReporter.reportUnfinishedComment();
      };

      assertThrows(
        computation,
        SyntaxError,
        "[1:3] unfinished comment near '--'",
      );
    });
  });

  describe("reportUnfinishedLongComment", () => {
    it("throws a unfinished long comment error", () => {
      const computation = () => {
        const scanner = new Scanner("--[[");
        const errorReporter = new ErrorReporter(scanner);

        scanner.scan().scan().scan().scan();

        errorReporter.reportUnfinishedLongComment();
      };

      assertThrows(
        computation,
        SyntaxError,
        "[1:5] unfinished long comment near '--[['",
      );
    });
  });
});
