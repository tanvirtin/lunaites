import { Exception, Scanner, Token } from "./mod.ts";

class ParserException {
  static raiseExpectedError(
    scanner: Scanner,
    expected: string,
    nearToken: Token,
  ): never {
    Exception.raiseParserError(
      scanner,
      `${expected} expected near '${nearToken.value}'`,
    );
  }

  static raiseUnexpectedTokenError(
    scanner: Scanner,
    unexpectedToken: Token,
    nearToken: Token,
  ): never {
    Exception.raiseParserError(
      scanner,
      `unexpected ${unexpectedToken.type} '${unexpectedToken.value}' near '${nearToken.value}'`,
    );
  }
}

export { ParserException };
