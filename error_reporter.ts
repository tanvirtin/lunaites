import { Scanner } from "./scanner.ts";

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
    return `[${this.scanner.lnum}:${this.scanner.getCol()}] ${message}`;
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

  reportError(message: string, nearbyText?: string): never {
    const error = this.createError(
      message,
      nearbyText ?? this.scanner.getText(),
    );

    throw error;
  }

  reportMalformedNumber(): never {
    this.reportError("malformed number near '%s'");
  }

  reportUnfinishedString(): never {
    this.reportError("unfinished string near '%s'");
  }

  reportUnfinishedLongString(): never {
    this.reportError(
      `unfinished long string (starting at line ${this.scanner.lnum}) near '%s'`,
    );
  }

  reportUnexpectedCharacter(): never {
    this.reportError("unfinished character near '%s'");
  }

  reportUnfinishedComment(): never {
    this.reportError("unfinished comment near '%s'");
  }

  reportUnfinishedLongComment(): never {
    this.reportError("unfinished long comment near '%s'");
  }
}

export { ErrorReporter };
