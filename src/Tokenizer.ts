import { Scanner } from "./Scanner.ts";
import { ErrorReporter } from "./ErrorReporter.ts";

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
  value: boolean | number | string;
  range: number[];
  lnum: number;
  lnumStartIndex: number;
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
  private errorReporter: ErrorReporter;
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
    this.errorReporter = new ErrorReporter(this.scanner);
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
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
    };
  }

  private tokenizeIdentifier(): Token {
    const { scanner } = this;

    scanner.mark().scanWhile(scanner.isAlphanumeric);

    let type = TokenType.Identifier;
    const value = scanner.getText();

    // Type and value depends on what type of identifier we are dealing with.
    if (this.isKeyword(value)) {
      type = TokenType.Keyword;
    } else if (value === "true" || value === "false") {
      type = TokenType.BooleanLiteral;
    } else if (value === "nil") {
      type = TokenType.NilLiteral;
    }

    return {
      type,
      value,
      range: scanner.getRange(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
    };
  }

  private tokenizeHexadecimalNumericLiteral(): Token {
    let encounteredDotNotation = false;
    const { scanner } = this;

    // Put a mark on the scanner before we progress it.
    scanner.mark();

    // Since we are in this function, we know we are dealing with hexadecimal numeric literals.
    // This means we can successfully acknowledge 0 and "x".
    scanner.scan().scan();

    // Hexadecimal numbers can be represented as 0x.34
    if (scanner.isDotNotation()) {
      encounteredDotNotation = true;
      // If we encounter a dot notation we go over it as we know this can be expected.
      scanner.scan();
    }

    scanner.scanWhile(scanner.isHexDigit);

    // If we already "." it cannot appear again.
    if (!encounteredDotNotation && scanner.isDotNotation()) {
      encounteredDotNotation = true;
      // If we encounter a dot notation we go over it as we know this can be expected.
      scanner.scan();
    }

    scanner.scanWhile(scanner.isHexDigit);

    // We check for exponents, which is denoted by the "p" or "P" symbol.
    if (scanner.isCharCode(80) || scanner.isCharCode(112)) {
      scanner.scan();

      // +/- gets recognized as well since it's tied to exponents.
      if (scanner.isCharCode(43) || scanner.isCharCode(45)) {
        scanner.scan();
      }

      if (!this.scanner.isDigit()) {
        this.errorReporter.raiseMalformedNumber();
      }

      scanner.scanWhile(scanner.isDigit);
    }

    return {
      type: TokenType.NumericLiteral,
      value: scanner.getText(),
      range: scanner.getRange(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
    };
  }

  private tokenizeDecimalNumericLiteral(): Token {
    const { scanner } = this;

    // Mark the position and scan until we no longer encounter a digit.
    scanner.mark().scanWhile(scanner.isDigit);

    // If we are here we probably encountered something not a digit.
    // If it is a dot notation then we acknowledge over it and scan some more
    // only if it's a digit.
    if (scanner.isDotNotation()) {
      scanner.scan().scanWhile(scanner.isDigit);
    }

    // After we are done with the code above we may have something like 3 or 3.14159265359.
    // Now we need to check for exponent part, NOTE: 3.14159265359e2 is a valid statement.

    // We check for exponent notation using the letter "e" or "E".
    // The letters "e" and "E" are considered to be part of the numeric literal.
    if (scanner.isCharCode(69) || scanner.isCharCode(101)) {
      scanner.scan();

      // If we encounter a "+" or "-", we can just continue our
      // scanning as it's part of the semantics.
      if (scanner.isCharCode(43) || scanner.isCharCode(45)) {
        scanner.scan();
      }

      scanner.scanWhile(scanner.isDigit);
    }

    return {
      type: TokenType.NumericLiteral,
      value: scanner.getText(),
      range: scanner.getRange(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
    };
  }

  private tokenizeNumericLiteral(): Token {
    // If it's a hexadecimal it starts with "0x" or "0X".
    if (this.scanner.isHexadecimal()) {
      return this.tokenizeHexadecimalNumericLiteral();
    }

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
