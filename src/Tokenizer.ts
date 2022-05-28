import { Cursor } from "./Cursor.ts";
import { Feature, Token, TokenType } from "./Lexer.ts";

class Tokenizer {
  public cursor: Cursor;
  private feature: Feature = {
    labels: true,
    integerDivision: true,
    bitwiseOperators: true,
    extendedIdentifiers: true,
  };

  constructor(source: string, feature?: Feature) {
    this.feature = feature ?? this.feature;
    this.cursor = new Cursor(source, this.feature);
  }

  scanEOF(): Token {
    return {
      type: TokenType.EOF,
      value: "<eof>",
      range: [this.cursor.index, this.cursor.index],
      line: this.cursor.line,
      lineStart: this.cursor.lineStart,
    };
  }

  scanIdentifier(): Token {
    this.cursor.mark();

    while (this.cursor.isAlphanumeric()) {
      this.cursor.increment();
    }

    return {
      type: TokenType.Identifier,
      value: this.cursor.getText(),
      range: this.cursor.getRange(),
      line: this.cursor.line,
      lineStart: this.cursor.lineStart,
    };
  }

  next(): Token | void {
    this.cursor.increment();
    // All whitespace noise is eaten away as they have no semantic value.
    this.cursor.eatWhitespace();

    if (this.cursor.isOutOfBounds()) {
      return this.scanEOF();
    }

    // If the word is an alphabet it probably is an identifier.
    if (this.cursor.isAlphabet()) {
      return this.scanIdentifier();
    }

    this.cursor.mark();
  }
}

export { Tokenizer };
