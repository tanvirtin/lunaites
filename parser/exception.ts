import { Scanner } from "./mod.ts";

class ScannerError extends Error {
  scanner: Scanner;

  constructor(scanner: Scanner, message: string) {
    super(`[${scanner.lnum}:${scanner.getCol()}] ${message}`);

    this.scanner = scanner;
  }
}

class TokenizerError extends ScannerError {
  constructor(scanner: Scanner, message: string) {
    super(scanner, message);
  }
}

class ParserError extends ScannerError {
  constructor(scanner: Scanner, message: string) {
    super(scanner, message);
  }
}

class Exception {
  static raiseScannerError(scanner: Scanner, message: string): never {
    throw new ScannerError(scanner, message);
  }

  static raiseTokenizerError(scanner: Scanner, message: string): never {
    throw new TokenizerError(scanner, message);
  }

  static raiseParserError(scanner: Scanner, message: string): never {
    throw new ParserError(scanner, message);
  }
}

export { Exception, ParserError, ScannerError, TokenizerError };
