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

  private createError(templateMessage: string, ...args: string[]): SyntaxError {
    return new SyntaxError(
      this.createErrorMessage(
        this.deriveTemplate(
          templateMessage,
          ...args,
        ),
      ),
    );
  }

  reportMalformedNumber(): never {
    const error = this.createError(
      "malformed number near '%s'",
      this.scanner.getText(),
    );

    throw error;
  }

  reportUnfinishedString(): never {
    const error = this.createError(
      "unfinished string near '%s'",
      this.scanner.getText(),
    );

    throw error;
  }

  reportUnfinishedLongString(): never {
    const error = this.createError(
      "unfinished long string near '%s'",
      this.scanner.getText(),
    );

    throw error;
  }

  reportUnexpectedCharacter(): never {
    const error = this.createError(
      "unfinished character near '%s'",
      this.scanner.getText(),
    );

    throw error;
  }
}

export { ErrorReporter };
