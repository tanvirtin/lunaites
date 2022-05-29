import { ErrorReporter } from "../../src/ErrorReporter.ts";
import { Scanner } from '../../src/Scanner.ts';
import { describe, it } from "https://deno.land/std@0.141.0/testing/bdd.ts";
import {
  assertThrows,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

describe("ErrorReporter", () => {
  describe("raise", () => {
    it("throws a malformed number error correctly", () => {
      const computation = () => {
        const scanner = new Scanner("0x.333p4e");
        const errorReporter = new ErrorReporter(scanner)

        scanner.scanUntil(scanner.isOutOfBounds)

        errorReporter.raiseMalformedNumber()
      }

      assertThrows(computation, SyntaxError, "[0:9] malformed number near '0x.333p4e'");
    });
  });
});
