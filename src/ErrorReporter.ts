import { Scanner } from "./Scanner.ts";

class TokenError extends SyntaxError {
  hint?: string;
}

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

  private throwError(templateMessage: string, ...args: string[]): TokenError {
    return new TokenError(
      this.createErrorMessage(
        this.deriveTemplate(
          templateMessage,
          ...args,
        ),
      ),
    );
  }

  reportMalformedNumber(hint = ""): void {
    const error = this.throwError(
      "malformed number near '%s'",
      this.scanner.getText(),
    );

    error.hint = hint;

    throw error;
  }
}

export { ErrorReporter };
