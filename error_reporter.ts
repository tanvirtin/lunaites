import { Scanner } from "./mod.ts";

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
    const { scanner } = this;

    return `[${scanner.lnum}:${scanner.getCol()}] ${message}`;
  }

  createError(templateMessage: string, ...args: string[]): SyntaxError {
    return new SyntaxError(
      this.createErrorMessage(
        this.deriveTemplate(
          templateMessage,
          ...args,
        ),
      ),
    );
  }

  reportError(message: string, ...args: string[]): never {
    const error = this.createError(
      message,
      ...args,
    );

    throw error;
  }

  reportMalformedNumber(): never {
    this.reportError("malformed number near '%s'", this.scanner.getText());
  }

  reportUnfinishedString(): never {
    this.reportError("unfinished string near '%s'", this.scanner.getText());
  }

  reportUnfinishedLongString(): never {
    this.reportError(
      `unfinished long string (starting at line ${this.scanner.lnum}) near '%s'`,
      this.scanner.getText(),
    );
  }

  reportUnexpectedCharacter(): never {
    this.reportError("unfinished character near '%s'", this.scanner.getText());
  }

  reportUnfinishedComment(): never {
    this.reportError("unfinished comment near '%s'", this.scanner.getText());
  }

  reportUnfinishedLongComment(): never {
    this.reportError(
      `unfinished long comment (starting at line ${this.scanner.lnum}) near '%s'`,
      this.scanner.getText(),
    );
  }

  reportExpectedCharacter(expected: string, nearbyText: string) {
    this.reportError(`'${expected}' expected near %s`, nearbyText);
  }
}

export { ErrorReporter };
