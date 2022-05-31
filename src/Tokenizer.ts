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
  integerSuffixes?: boolean;
  integerDivision?: boolean;
  bitwiseOperators?: boolean;
  imaginaryNumbers?: boolean;
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
    imaginaryNumbers: true,
    integerSuffixes: true,
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

  private consumeExponent({ isBinary }: { isBinary?: boolean }) {
    const { scanner } = this;

    if (
      isBinary
        ? (scanner.isCharCode(69) || scanner.isCharCode(101)) // (p or P)
        : (scanner.isCharCode(80) || scanner.isCharCode(112)) // (e or E)
    ) {
      scanner.scan();

      // If we encounter a "+" or "-", we can just continue our
      // scanning as it's part of the semantics.
      if (scanner.isCharCode(43) || scanner.isCharCode(45)) {
        scanner.scan();
      }

      // If we encounter a digit after the exponent it's an error.
      if (!this.scanner.isDigit()) {
        this.errorReporter.reportMalformedNumber(
          `expected a digit to be followed after ${isBinary ? "p" : "e"}`,
        );
      }

      scanner.scanWhile(scanner.isDigit);

      return true;
    }

    return false;
  }

  private consumeImaginaryUnitSuffix() {
    const { feature, scanner } = this;

    if (!feature.imaginaryNumbers) {
      return false;
    }

    // We check of suffix indicator for imaginary numbers by "i" or "I"
    if (scanner.isCharCode(73) || scanner.isCharCode(105)) {
      scanner.scan();

      return true;
    }

    return false;
  }

  // Rules: Integer suffix should not work if the literal the suffix is
  // part of  has fractions ("." notation). Integer suffix will also
  // not work if there is an imaginary suffix before it as well.
  private consumeInt64Suffix() {
    const { errorReporter, feature, scanner } = this;

    if (!feature.integerSuffixes) {
      return false;
    }

    // Accepted suffixes: Any casing combination of ULL and LL

    // U or u
    if (scanner.isCharCode(85) || scanner.isCharCode(117)) {
      scanner.scan();
      // L or l
      if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
        scanner.scan();
        // L or l
        if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
          scanner.scan();

          return true;
        }
        // UL but no L
        errorReporter.reportMalformedNumber(
          'expected "UL" to be followed by an "L"',
        );
      }
      // U but no L
      errorReporter.reportMalformedNumber(
        'expected "U" to be followed by an "L"',
      );
      // L or l
    } else if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
      scanner.scan();

      // L or l
      if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
        scanner.scan();

        return true;
      }
      // First L but no second L
      errorReporter.reportMalformedNumber(
        'expected "L" to be followed by another "l"',
      );
    }

    return false;
  }

  private consumeDotNotation() {
    const { scanner } = this;

    if (scanner.isDotNotation()) {
      scanner.scan();

      return true;
    }

    return false;
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
    const { scanner } = this;

    // Put a mark on the scanner before we progress it.
    scanner.mark();

    // Since we are in this function, we know we are dealing with hexadecimal numeric literals.
    // This means we can successfully acknowledge 0 and "x".
    scanner.scan().scan();

    // Hexadecimal numbers can be represented as 0x.34
    let isDecimal = this.consumeDotNotation();

    scanner.scanWhile(scanner.isHexDigit);

    // If we already encountered a "." it cannot appear again, so incase we didn't encounter
    // a hex that start with a dot notation such as "0x.3f" we account for dot notation that
    // may appear afterwards.
    if (!isDecimal) {
      isDecimal = this.consumeDotNotation();
    }

    scanner.scanWhile(scanner.isHexDigit);

    // if we encounter another dot notation it's an error, e.g "0x3..3".
    if (isDecimal && scanner.isDotNotation()) {
      this.errorReporter.reportMalformedNumber('integer literal cannot have more than one "."');
    } 

    this.consumeExponent({ isBinary: false });
    const hasImaginaryUnitSuffix = this.consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.consumeInt64Suffix();

    if ((isDecimal || hasImaginaryUnitSuffix) && hasInt64Suffix) {
      this.errorReporter.reportMalformedNumber("numbers with fractions cannot have integer suffixes");
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

    // We check for dot notation to check if we are dealing with decimal numbers.
    let isDecimal = this.consumeDotNotation();

    scanner.scanWhile(scanner.isDigit);

    // If we encounter another dot notation it's an error, e.g "3..3" or "3.3.4".
    if (isDecimal && scanner.isDotNotation()) {
      this.errorReporter.reportMalformedNumber('integer literal cannot have more than one "."');
    } 

    // After we are done with the code above we may have something like 3 or 3.14159265359.
    // Now we need to check for exponent part, NOTE: 3.14159265359e2 is a valid statement.
    this.consumeExponent({ isBinary: true });
    const hasImaginaryUnitSuffix = this.consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.consumeInt64Suffix();

    if ((isDecimal || hasImaginaryUnitSuffix) && hasInt64Suffix) {
      this.errorReporter.reportMalformedNumber("numbers with fractions cannot have integer suffixes");
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
