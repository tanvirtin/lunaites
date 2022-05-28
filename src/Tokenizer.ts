import { Scanner } from "./Scanner.ts";

enum TokenType {
  EOF = 1,
  StringLiteral = 2,
  Keyword = 4,
  Identifier = 8,
  NumericLiteral = 16,
  Punctuator = 32,
  BooleanLiteral = 64,
  NilLiteral = 128,
  VarargLiteral = 256,
}

interface Token {
  type: number;
  value: null | boolean | number | string;
  line: number;
  lineStart: number;
  range: number[];
}

interface Feature {
  labels?: boolean;
  contextualGoto?: boolean;
  integerDivision?: boolean;
  bitwiseOperators?: boolean;
  extendedIdentifiers?: boolean;
}

class Tokenizer {
  public scanner: Scanner;
  private feature: Feature = {
    labels: true,
    contextualGoto: true,
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

  // All lua keywords
  isKeyword(text: string) {
    const { feature } = this;

    // Easier to narrow down by length of the string.
    switch (text.length) {
      case 2:
        return text === "do" || text === "if" || text === "in" || text === "or";
      case 3:
        return text == "and" || text === "end" || text === "for" ||
          text === "not";
      case 4:
        if (text === "else" || text === "then") {
          return true;
        }

        if (feature.labels && !feature.contextualGoto) {
          return (text === "goto");
        }

        return false;
      case 5:
        return text === "break" || text === "local" || text === "until" ||
          text === "while";
      case 6:
        return text === "elseif" || text === "repeat" || text === "return";
      case 8:
        return text === "function";
    }

    return false;
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

    let type = TokenType.Identifier;
    let value: null | string | boolean = this.scanner.getText();

    // Type and value depends on what type of identifier we are dealing with.
    if (this.isKeyword(value)) {
      type = TokenType.Keyword;
    } else if (value === "true" || value === "false") {
      type = TokenType.BooleanLiteral;
      value = value === "true";
    } else if (value === "nil") {
      type = TokenType.NilLiteral;
      value = null;
    }

    return {
      type,
      value,
      range: this.scanner.getRange(),
      line: this.scanner.line,
      lineStart: this.scanner.lineStart,
    };
  }

  tokenizeNumericLiteral(): Token {
    this.scanner.mark();

    // As long as there is a number we seen in the horizon we advance.
    while (this.scanner.isDigit()) {
      this.scanner.scan();
    }

    return {
      type: TokenType.NumericLiteral,
      value: this.scanner.getText(),
      range: this.scanner.getRange(),
      line: this.scanner.line,
      lineStart: this.scanner.lineStart,
    };
  }

  tokenize(): Token | void {
    // All whitespace noise is eaten away as they have no semantic value.
    this.scanner.comsumeWhitespace();

    if (this.scanner.isOutOfBounds()) {
      return this.tokenizeEOF();
    }

    if (this.scanner.isDigit()) {
      return this.tokenizeNumericLiteral();
    }

    // If the word is an alphabet it probably is an identifier.
    // NOTE: lua identifiers do not start with numbers.
    if (this.scanner.isAlphabet()) {
      return this.tokenizeIdentifier();
    }
  }
}

export { Tokenizer };
