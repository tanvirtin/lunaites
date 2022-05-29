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
  type: TokenType;
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

// References: https://www.ibm.com/docs/en/i/7.3?topic=tokens-literals

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
  private isKeyword(text: string) {
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

  private tokenizeEOF(): Token {
    return {
      type: TokenType.EOF,
      value: "<eof>",
      range: [this.scanner.index, this.scanner.index],
      line: this.scanner.line,
      lineStart: this.scanner.lineStart,
    };
  }

  private tokenizeIdentifier(): Token {
    const { scanner } = this;

    scanner.mark().scanWhile(scanner.isAlphanumeric)

    let type = TokenType.Identifier;
    let value: null | string | boolean = scanner.getText();

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
      range: scanner.getRange(),
      line: scanner.line,
      lineStart: scanner.lineStart,
    };
  }

  private tokenizeDecimalNumericLiteral(): Token {
    const { scanner } = this;

    // Mark the position and scan until we no longer encounter a digit.
    scanner.mark().scanWhile(scanner.isDigit)

    // If we are here we probably encountered something not a digit.
    // If it is a dot notation then we skip over it and scan some more.
    if (scanner.isDotNotation()) {
      scanner.scan().scanWhile(scanner.isDigit);
    }

    return {
      type: TokenType.NumericLiteral,
      value: parseFloat(scanner.getText()),
      range: scanner.getRange(),
      line: scanner.line,
      lineStart: scanner.lineStart,
    };
  }

  private tokenizeNumericLiteral(): Token {
    return this.tokenizeDecimalNumericLiteral();
  }

  tokenize(): Token | void {
    const { scanner } = this;

    // All whitespace noise is eaten away as they have no semantic value.
    scanner.comsumeWhitespace();

    if (scanner.isOutOfBounds()) {
      return this.tokenizeEOF();
    }

    if (scanner.isDigit()) {
      return this.tokenizeNumericLiteral();
    }

    if (scanner.isDotNotation()) {
      if (scanner.isDigit(scanner.index + 1)) {
        return this.tokenizeDecimalNumericLiteral();
      }
    }

    // If the word is an alphabet it probably is an identifier.
    // NOTE: lua identifiers do not start with numbers.
    if (scanner.isAlphabet()) {
      return this.tokenizeIdentifier();
    }
  }
}

export { Tokenizer, TokenType };
