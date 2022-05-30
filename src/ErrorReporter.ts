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

  private throwError(templateMessage: string, ...args: string[]) {
    throw new SyntaxError(
      this.createErrorMessage(
        this.deriveTemplate(
          templateMessage,
          ...args,
        ),
      ),
    );
  }

  raiseMalformedNumber(): void {
    this.throwError("malformed number near '%s'", this.scanner.getText());
  }
}

export { ErrorReporter };
