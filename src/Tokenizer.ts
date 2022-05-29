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
    const keywords: string[] = [
      "do",
      "if",
      "in",
      "or",
      "and",
      "end",
      "for",
      "not",
      "else",
      "then",
      "break",
      "local",
      "until",
      "while",
      "elseif",
      "repeat",
      "return",
      "function",
    ];

    if (feature.labels && !feature.contextualGoto) {
      keywords.push("goto");
    }

    return keywords.some((keyword) => text === keyword);
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

    scanner.mark().scanWhile(scanner.isAlphanumeric);

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
    scanner.mark().scanWhile(scanner.isDigit);

    // If we are here we probably encountered something not a digit.
    // If it is a dot notation then we skip over it and scan some more
    // only if it's a digit.
    if (scanner.isDotNotation()) {
      scanner.scan().scanWhile(scanner.isDigit);
    }

    // After we are done with the code above we may have something like 3 or 3.14159265359.
    // Now we need to check for exponent part, NOTE: 3.14159265359e2 is a valid statement.

    // We check for exponent notation using the letter "e" or "E".
    if (scanner.isCharCode(69) || scanner.isCharCode(101)) {
      scanner.scan();

      // If we encounter it after "e" or "E", it makes sense to just skip
      // the tokens. Deno can parse the numbers comfortably.
      if (scanner.isCharCode(43) || scanner.isCharCode(45)) {
        scanner.scan();
      }

      scanner.scanWhile(scanner.isDigit);
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
