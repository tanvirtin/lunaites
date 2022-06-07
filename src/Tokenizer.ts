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
  Comment = 512,
}

interface Token {
  type: TokenType;
  value: boolean | number | string;
  range: number[];
  lnum: number;
  lnumStartIndex: number;
}

interface TokenizerOptions {
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
  private options: TokenizerOptions = {
    labels: true,
    contextualGoto: true,
    integerDivision: true,
    bitwiseOperators: true,
    imaginaryNumbers: true,
    integerSuffixes: true,
    extendedIdentifiers: true,
  };

  constructor(source: string, options?: TokenizerOptions) {
    this.options = {
      ...this.options,
      ...(options ?? {}),
    };
    this.scanner = new Scanner(source, {
      extendedIdentifiers: this.options.extendedIdentifiers ?? true,
    });
    this.errorReporter = new ErrorReporter(this.scanner);
  }

  // All lua keywords
  private isKeyword(text: string) {
    const { options } = this;
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

    if (options.labels && !options.contextualGoto) {
      keywords.push("goto");
    }

    return keywords.some((keyword) => text === keyword);
  }

  // Eats away all whitespace characters and progresses the index.
  private consumeWhitespace(): boolean {
    const { scanner } = this;

    while (!scanner.isOutOfBounds()) {
      if (scanner.isWhitespace()) {
        scanner.scan();
      } else if (!scanner.consumeEOL()) {
        return true;
      }
    }

    return false;
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
      if (!scanner.isDigit()) {
        this.errorReporter.reportMalformedNumber();
      }

      scanner.scanWhile(scanner.isDigit);

      return true;
    }

    return false;
  }

  private consumeBackslash() {
    const { scanner } = this;

    if (scanner.isBackslash()) {
      scanner.scan();
    }

    return false;
  }

  private consumeImaginaryUnitSuffix() {
    const { options, scanner } = this;

    if (!options.imaginaryNumbers) {
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
    const { errorReporter, options, scanner } = this;

    if (!options.integerSuffixes) {
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
        errorReporter.reportMalformedNumber();
      }
      // U but no L
      errorReporter.reportMalformedNumber();
      // L or l
    } else if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
      scanner.scan();

      // L or l
      if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
        scanner.scan();

        return true;
      }
      // First L but no second L
      errorReporter.reportMalformedNumber();
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
    const { scanner } = this;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    return {
      type: TokenType.EOF,
      value: "<eof>",
      range: scanner.getRange(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
    };
  }

  private tokenizeComment(): Token {
    const { scanner } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // scan over "--"
    scanner.scan().scan();

    while (!scanner.isLineTerminator() && !scanner.isOutOfBounds()) {
      scanner.scan();
    }

    return {
      type: TokenType.Comment,
      value: scanner.getText(),
      range: scanner.getRange(),
      lnum,
      lnumStartIndex,
    };
  }

  private tokenizeLongComment(): Token {
    const { errorReporter, scanner } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // scan over "--[["
    scanner.scan("--[[".length);

    while (!scanner.match("]]")) {
      // If we hit out of bounds it's an error
      if (scanner.isOutOfBounds()) {
        errorReporter.reportUnfinishedLongComment();
      }

      scanner.scan();

      // NOTE: EOL consumption should be done at the end of the loop, so that our while loop
      //       condition and error check statements are the first things to be ran in the new loop.
      // Multi line comments may contain \n, so we consume them to increment line number.
      scanner.consumeEOL();
    }

    // scan over "]]"
    scanner.scan().scan();

    return {
      type: TokenType.Comment,
      value: scanner.getText(),
      range: scanner.getRange(),
      lnum,
      lnumStartIndex,
    };
  }

  private tokenizeStringLiteral(): Token {
    const { scanner, errorReporter } = this;
    const { lnum, lnumStartIndex } = scanner;
    const delimeterCharCode = scanner.getCharCode();

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // Scan over the ending string delimiter (", ')
    scanner.scan();

    while (!scanner.isCharCode(delimeterCharCode)) {
      // If we hit out of bounds we have an unfinished string that
      // never met the matching delimiter.
      if (scanner.isOutOfBounds()) {
        errorReporter.reportUnfinishedString();
      }

      // We skip the next character after the backslash character.
      this.consumeBackslash();

      scanner.scan();

      // NOTE: EOL consumption should be done at the end of the loop, so that our while loop
      //       condition and error check statements are the first things to be ran in the new loop.
      scanner.consumeEOL();
    }

    // Scan over the ending string delimiter (", ')
    scanner.scan();

    return {
      type: TokenType.StringLiteral,
      value: scanner.getText(),
      range: scanner.getRange(),
      lnum,
      lnumStartIndex,
    };
  }

  private tokenizeLongStringLiteral(): Token {
    let depth = 0;
    let encounteredDelimeter = false;
    const { scanner, errorReporter } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // Skip over "["
    scanner.scan();

    // if we keep encountering "=" we scan it and increment depth count.
    while (scanner.isEqual()) {
      scanner.scan();
      ++depth;
    }

    // If we encounter a bunch of "=" and we already have a string sequence such as [====
    // or something and the next character is not a "[" then we know it's an unfinished string.
    // This expression holds true for the following cases: "[[" or "[====["
    if (!scanner.isOpenBracket()) {
      errorReporter.reportUnfinishedLongString();
    }

    while (!encounteredDelimeter) {
      let runningDepth = 0;

      // If we hit out of bounds we have an unfinished
      // long string that never met the matching delimiter.
      if (scanner.isOutOfBounds()) {
        errorReporter.reportUnfinishedLongString();
      }

      // If we encounter equal characters.
      while (scanner.isEqual()) {
        // We increment our running depth and check if it equals the real depth.
        // If it does and current char and next char equals "=]" we encountered
        // our delimeter.
        if (++runningDepth === depth && scanner.match("=]")) {
          encounteredDelimeter = true;
          depth = 0;

          scanner.scan();

          break;
        }

        scanner.scan();
      }

      // The long string itself could have no depth if it starts with [[.
      // Another instance could be there was a depth and we found a delimiter.
      if (depth === 0) {
        if (scanner.match("]]")) {
          encounteredDelimeter = true;

          // Scan over this delimeter.
          scanner.scan();
        }
      }

      scanner.scan();

      // NOTE: EOL consumption should be done at the end of the loop, so that our while loop
      //       condition and error check statements are the first things to be ran in the new loop.
      scanner.consumeEOL();
    }

    return {
      type: TokenType.StringLiteral,
      value: scanner.getText(),
      range: scanner.getRange(),
      lnum,
      lnumStartIndex,
    };
  }

  private tokenizeIdentifier(): Token {
    const { scanner } = this;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // Itentifiers can only be characters that are alphanumeric (digits or alphabets).
    scanner.scanWhile(scanner.isAlphanumeric);

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
      this.errorReporter.reportMalformedNumber();
    }

    const hasExponent = this.consumeExponent({ isBinary: false });
    const hasImaginaryUnitSuffix = this.consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.consumeInt64Suffix();

    // If either the number is a decimal, has exponent or has imaginary suffix,
    // if we find integer suffix as well, we throw an error.
    if (
      (isDecimal || hasExponent || hasImaginaryUnitSuffix) && hasInt64Suffix
    ) {
      this.errorReporter.reportMalformedNumber();
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
    const isDecimal = this.consumeDotNotation();

    scanner.scanWhile(scanner.isDigit);

    // If we encounter another dot notation it's an error, e.g "3..3" or "3.3.4".
    if (isDecimal && scanner.isDotNotation()) {
      this.errorReporter.reportMalformedNumber();
    }

    // After we are done with the code above we may have something like 3 or 3.14159265359.
    // Now we need to check for exponent part, NOTE: 3.14159265359e2 is a valid statement.
    const hasExponent = this.consumeExponent({ isBinary: true });
    const hasImaginaryUnitSuffix = this.consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.consumeInt64Suffix();

    // If either the number is a decimal, has exponent or has imaginary suffix,
    // if we find integer suffix as well, we throw an error.
    if (
      (isDecimal || hasExponent || hasImaginaryUnitSuffix) && hasInt64Suffix
    ) {
      this.errorReporter.reportMalformedNumber();
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
    const { scanner } = this;

    // If it's a hexadecimal it starts with "0x" or "0X".
    if (scanner.match("0x") || scanner.match("0X")) {
      return this.tokenizeHexadecimalNumericLiteral();
    }

    return this.tokenizeDecimalNumericLiteral();
  }

  tokenize(): Token {
    const { scanner } = this;

    // All whitespace noise is eaten away as they have no semantic value.
    this.consumeWhitespace();

    if (scanner.isOutOfBounds()) {
      return this.tokenizeEOF();
    }

    if (scanner.match("--")) {
      if (scanner.match("--[[")) {
        return this.tokenizeLongComment();
      }

      return this.tokenizeComment();
    }

    if (scanner.isQuote() || scanner.isDoubleQuote()) {
      return this.tokenizeStringLiteral();
    }

    if (scanner.match("[[") || scanner.match("[=")) {
      return this.tokenizeLongStringLiteral();
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

    this.errorReporter.reportUnexpectedCharacter();
  }
}

export { Tokenizer, TokenType };
export type { TokenizerOptions };
