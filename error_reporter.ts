import { Scanner } from "./mod.ts";

class ErrorReporter {
  private static deriveTemplate(message: string, ...args: string[]) {
    args.forEach((arg) => (message = message.replace("%s", arg)));

    return message;
  }

  private static createErrorMessage(scanner: Scanner, message: string) {
    return `[${scanner.lnum}:${scanner.getCol()}] ${message}`;
  }

  static createError(
    scanner: Scanner,
    templateMessage: string,
    ...args: string[]
  ): SyntaxError {
    return new SyntaxError(this.createErrorMessage(
      scanner,
      this.deriveTemplate(
        templateMessage,
        ...args,
      ),
    ));
  }

  static report(
    scanner: Scanner,
    message: string,
    ...args: string[]
  ): never {
    const error = this.createError(
      scanner,
      message,
      ...args,
    );

    throw error;
  }
}

export { ErrorReporter };
