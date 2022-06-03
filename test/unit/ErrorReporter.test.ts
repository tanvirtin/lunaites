import { ErrorReporter } from "../../src/ErrorReporter.ts";
import { Scanner } from "../../src/Scanner.ts";
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import { assertThrows } from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("ErrorReporter", () => {
  describe("reportMalformedNumber", () => {
    it("throws a malformed number error correctly", () => {
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
    it("throws a unfinished string error correctly", () => {
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
    it("throws a unfinished string error correctly", () => {
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
});
