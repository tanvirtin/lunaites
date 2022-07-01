import { Exception, Scanner, Token } from "./mod.ts";

class ParserException {
  static raiseExpectedToken(
    scanner: Scanner,
    expected: string,
    near: string,
  ): never {
    Exception.raiseParserError(
      scanner,
      `${expected} expected near '${near}'`,
    );
  }

  static raiseUnexpectedToken(
    scanner: Scanner,
    token: Token,
    near: string,
  ): never {
    Exception.raiseParserError(
      scanner,
      `unexpected ${token.type} '${token.value}' near '${near}'`,
    );
  }
}

export { ParserException };
