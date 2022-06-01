import { Scanner } from "./Scanner.ts";

class ErrorReporter {
  scanner: Scanner;

  constructor(scanner: Scanner) {
    this.scanner = scanner;
  }

  private deriveTemplate(message: string, ...args: string[]) {
    args.forEach((arg) => (message = message.replace("%s", arg)));

    return message;
  }

  private createErrorMessage(message: string) {
    return `[${this.scanner.lnum}:${this.scanner.getCol()}] ${message} }'`;
  }

  private throwError(templateMessage: string, ...args: string[]): SyntaxError {
    return new SyntaxError(
      this.createErrorMessage(
        this.deriveTemplate(
          templateMessage,
          ...args,
        ),
      ),
    );
  }

  reportMalformedNumber(): void {
    const error = this.throwError(
      "malformed number near '%s'",
      this.scanner.getText(),
    );

    throw error;
  }

  reportUnfinishedString(): void {
    const error = this.throwError(
      "unfinished string near '%s'",
      this.scanner.getText(),
    );

    throw error;
  }
}

export { ErrorReporter };
