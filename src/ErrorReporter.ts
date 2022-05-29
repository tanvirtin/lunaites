import { Scanner } from "./Scanner.ts";

enum ErrorType {
  malformedNumber = "malformed number near '%1'",
}

class ErrorReporter {
  scanner: Scanner;

  constructor(scanner: Scanner) {
    this.scanner = scanner;
  }

  raiseMalformedNumber() {
    const { index, line, lineStart } = this.scanner;

    const col = index - lineStart + 1;

    throw new SyntaxError(`[${line}:${col}] malformed number near '${this.scanner.getText()}'`);
  }
}

export { ErrorReporter, ErrorType };
