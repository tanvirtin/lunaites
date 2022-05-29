import { Scanner } from "./Scanner.ts";

enum ErrorType {
  malformedNumber = "malformed number near '%1'",
}

class ErrorReporter {
  scanner: Scanner;

  constructor(scanner: Scanner) {
    this.scanner = scanner;
  }

  raiseMalformedNumber(): void {
    const { index, lnum, lnumIndex } = this.scanner;
    const col = index - lnumIndex + 1;
    const errorMessage =
      `[${lnum}:${col}] malformed number near '${this.scanner.getText()}'`;

    throw new SyntaxError(errorMessage);
  }
}

export { ErrorReporter, ErrorType };
