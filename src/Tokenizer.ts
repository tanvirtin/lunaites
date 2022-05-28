import { Scanner } from "./Scanner.ts";
import { Feature, Token, TokenType } from "./Lexer.ts";

class Tokenizer {
  public scanner: Scanner;
  private feature: Feature = {
    labels: true,
    integerDivision: true,
    bitwiseOperators: true,
    extendedIdentifiers: true,
  };

  constructor(source: string, feature?: Feature) {
    this.feature = {
      ...this.feature,
      ...(feature ?? {}),
    };
    this.scanner = new Scanner(source, {
      extendedIdentifiers: this.feature.extendedIdentifiers ?? true,
    });
  }

  tokenizeEOF(): Token {
    return {
      type: TokenType.EOF,
      value: "<eof>",
      range: [this.scanner.index, this.scanner.index],
      line: this.scanner.line,
      lineStart: this.scanner.lineStart,
    };
  }

  tokenizeIdentifier(): Token {
    this.scanner.mark();

    while (this.scanner.isAlphanumeric()) {
      this.scanner.scan();
    }

    return {
      type: TokenType.Identifier,
      value: this.scanner.getText(),
      range: this.scanner.getRange(),
      line: this.scanner.line,
      lineStart: this.scanner.lineStart,
    };
  }

  tokenize(): Token | void {
    this.scanner.scan();
    // All whitespace noise is eaten away as they have no semantic value.
    this.scanner.eatWhitespace();

    if (this.scanner.isOutOfBounds()) {
      return this.tokenizeEOF();
    }

    // If the word is an alphabet it probably is an identifier.
    if (this.scanner.isAlphabet()) {
      return this.tokenizeIdentifier();
    }

    this.scanner.mark();
  }
}

export { Tokenizer };
