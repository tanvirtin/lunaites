import { Scanner, Token, TokenizerException, TokenType } from "./mod.ts";

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
  private isStarted = false;
  private tokens: Token[] = [];
  private options: TokenizerOptions = {
    labels: true,
    contextualGoto: true,
    integerDivision: true,
    bitwiseOperators: true,
    imaginaryNumbers: true,
    integerSuffixes: true,
    extendedIdentifiers: true,
  };

  constructor(
    scanner: Scanner,
    options?: TokenizerOptions,
  ) {
    this.options = {
      ...this.options,
      ...(options ?? {}),
    };
    this.scanner = scanner;
  }

  // Lua should progress the index and ignore:
  //   - characters space
  //   - form feed
  //   - newline
  //   - carriage return
  //   - horizontal tab
  //   - vertical tab
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

  // Eats away the entire shebang line
  private consumeShebangLine(): boolean {
    const { scanner } = this;

    if (scanner.match("#!")) {
      scanner.scanUntil(scanner.isLineFeed);
      this.consumeWhitespace();

      return true;
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
        TokenizerException.raiseMalformedNumberError(scanner);
      }

      scanner.scanWhile(scanner.isDigit);

      return true;
    }

    return false;
  }

  private consumeBackslash(): boolean {
    const { scanner } = this;

    if (scanner.match("\\")) {
      scanner.scan();

      return true;
    }

    return false;
  }

  private consumeImaginaryUnitSuffix(): boolean {
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

  // Rules:
  // ------
  // Integer suffix should not work if the literal being processed
  // has fractions ("." notation). Integer suffix will also
  // not work if there is an imaginary suffix before it as well.
  private consumeInt64Suffix(): boolean {
    const { options, scanner } = this;

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
        TokenizerException.raiseMalformedNumberError(scanner);
      }
      // U but no L
      TokenizerException.raiseMalformedNumberError(scanner);
      // L or l
    } else if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
      scanner.scan();

      // L or l
      if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
        scanner.scan();

        return true;
      }
      // First L but no second L
      TokenizerException.raiseMalformedNumberError(scanner);
    }

    return false;
  }

  private consumeDotNotation(): boolean {
    const { scanner } = this;

    if (scanner.match(".")) {
      scanner.scan();

      return true;
    }

    return false;
  }

  private scanLongString(isComment: boolean): boolean {
    let depth = 0;
    let encounteredDelimeter = false;
    const { scanner } = this;
    const raiseError = () =>
      isComment
        ? TokenizerException.raiseUnfinishedLongCommentError(scanner)
        : TokenizerException.raiseUnfinishedLongStringError(scanner);

    // if we keep encountering "=" we scan it and increment depth count.
    while (scanner.match("=")) {
      scanner.scan();
      ++depth;
    }

    // If we encounter a bunch of "=" and we already have a sequence such as [====
    // or something and the next character is not a "[" then we know it's an unfinished string.
    // This expression holds true for the following cases: "[[" or "[====["
    if (!scanner.match("[")) {
      return isComment ? false : raiseError();
    }

    while (!encounteredDelimeter) {
      let runningDepth = 0;

      // If we hit out of bounds we have an unfinished
      // long string that never met the matching delimiter.
      if (scanner.isOutOfBounds()) {
        raiseError();
      }

      // If we encounter equal characters.
      while (scanner.match("=")) {
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

      // If we successfully consume an end of line then we don't need to scan again.
      // NOTE: scanner.consumeEOL progresses the scanner, which means we don't need
      // to progress it we have already consumed a token within this loop.
      if (!scanner.consumeEOL()) {
        scanner.scan();
      }
    }

    return true;
  }

  private tokenizeEOF(): Token {
    const { scanner } = this;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    return {
      type: TokenType.EOF,
      value: "<eof>",
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
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
      type: TokenType.CommentLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  private tokenizeLongComment(): Token {
    const { scanner } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // scan over "--["
    scanner.scan("--[".length);

    this.scanLongString(true);

    return {
      type: TokenType.CommentLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  private tokenizeStringLiteral(): Token {
    const { scanner } = this;
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
        TokenizerException.raiseUnfinishedStringError(scanner);
      }

      this.consumeBackslash();

      // If we successfully consume an end of line then we don't need to scan again.
      // NOTE: scanner.consume* progresses the scanner.
      if (!scanner.consumeEOL()) {
        scanner.scan();
      }
    }

    // Scan over the ending string delimiter (", ')
    scanner.scan();

    return {
      type: TokenType.StringLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  private tokenizeLongStringLiteral(): Token {
    const { scanner } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // Skip over "["
    scanner.scan();

    this.scanLongString(false);

    return {
      type: TokenType.StringLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  private tokenizeIdentifier(): Token {
    const { scanner } = this;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // Itentifiers can only be characters that are alphanumeric (digits or alphabets).
    scanner.scanWhile(scanner.isAlphanumeric);

    const keywordTokenTypeMap = new Map(Object.entries({
      or: TokenType.Or,
      and: TokenType.And,
      not: TokenType.Not,
      true: TokenType.BooleanLiteral,
      false: TokenType.BooleanLiteral,
      nil: TokenType.NilLiteral,
      do: TokenType.Do,
      if: TokenType.If,
      in: TokenType.In,
      end: TokenType.End,
      for: TokenType.For,
      else: TokenType.Else,
      then: TokenType.Then,
      break: TokenType.Break,
      local: TokenType.Local,
      while: TokenType.While,
      elseif: TokenType.Elseif,
      until: TokenType.Until,
      repeat: TokenType.Repeat,
      return: TokenType.Return,
      function: TokenType.Function,
      goto: TokenType.Goto,
    }));
    const value = scanner.getText();
    const keywordTokenType = keywordTokenTypeMap.get(value);

    return {
      type: keywordTokenType != null ? keywordTokenType : TokenType.Identifier,
      value,
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: !!keywordTokenType,
    };
  }

  private tokenizeHexadecimalNumericLiteral(): Token {
    const { scanner } = this;

    // Put a mark on the scanner before we progress it.
    scanner.mark();

    // Since we are in this function, we know we are dealing with hexadecimal numeric literals.
    // This means we can successfully acknowledge 0 and "x".
    scanner.scan().scan();

    // Next character must either be a hexadecimal or a ".", if not it's an error.
    if (!scanner.match(".") && !scanner.isHexDigit()) {
      TokenizerException.raiseMalformedNumberError(scanner);
    }

    // Hexadecimal numbers can be represented as 0x.34
    let isDecimal = this.consumeDotNotation();

    // When dealing with hexadecimal numeric literals, only hexadecimal digits are valid.
    // For example, Letters can be either between 0-9 or A-F.
    scanner.scanWhile(scanner.isHexDigit);

    // If we already encountered a "." it cannot appear again, so incase we didn't encounter
    // a hex that start with a dot notation such as "0x.3f" we account for dot notation that
    // may appear afterwards.
    if (!isDecimal) {
      isDecimal = this.consumeDotNotation();
    }

    scanner.scanWhile(scanner.isHexDigit);

    // If we encounter another dot notation it's an error, e.g "0x3..3".
    if (isDecimal && scanner.match(".")) {
      TokenizerException.raiseMalformedNumberError(scanner);
    }

    const hasExponent = this.consumeExponent({ isBinary: false });
    const hasImaginaryUnitSuffix = this.consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.consumeInt64Suffix();

    // If either the number is a decimal or has exponent or has imaginary suffix
    // and if we find integer suffix it's a syntax error that should be thrown.
    if (
      (isDecimal || hasExponent || hasImaginaryUnitSuffix) && hasInt64Suffix
    ) {
      TokenizerException.raiseMalformedNumberError(scanner);
    }

    return {
      type: TokenType.NumericLiteral,
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  private tokenizeDecimalNumericLiteral(): Token {
    const { scanner } = this;

    // Mark the position and scan until we no longer encounter a digit.
    scanner.mark().scanWhile(scanner.isDigit);

    // We check for dot notation to check if we are dealing with decimal numbers.
    const isDecimal = this.consumeDotNotation();

    // When dealing with decimal numeric literal, only digits are valid.
    scanner.scanWhile(scanner.isDigit);

    // If we encounter another dot notation it's an error, e.g "3..3" or "3.3.4".
    if (isDecimal && scanner.match(".")) {
      TokenizerException.raiseMalformedNumberError(scanner);
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
      TokenizerException.raiseMalformedNumberError(scanner);
    }

    return {
      type: TokenType.NumericLiteral,
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
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

  private tokenizeVarargLiteral(): Token {
    const { scanner } = this;

    // Put a mark on the scanner before we progress it.
    scanner.mark();

    // skip over "...".
    scanner.scan().scan().scan();

    return {
      type: TokenType.VarargLiteral,
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  private tokenizePunctuator(punctuator: string): Token {
    const { scanner } = this;
    const punctuatorTable: Record<string, TokenType> = {
      [".."]: TokenType.DoubleDot,
      ["."]: TokenType.Dot,
      [","]: TokenType.Comma,
      ["=="]: TokenType.DoubleEqual,
      ["="]: TokenType.Equal,
      [">="]: TokenType.GreaterThanEqual,
      [">>"]: TokenType.DoubleGreaterThan,
      [">"]: TokenType.GreaterThan,
      ["<="]: TokenType.LessThanEqual,
      ["<<"]: TokenType.DoubleLessThan,
      ["<"]: TokenType.LessThan,
      ["~="]: TokenType.TildaEqual,
      ["~"]: TokenType.Tilda,
      ["//"]: TokenType.DoubleDivide,
      ["/"]: TokenType.Divide,
      [":"]: TokenType.Colon,
      ["::"]: TokenType.DoubleColon,
      ["&"]: TokenType.Ampersand,
      ["|"]: TokenType.Pipe,
      ["*"]: TokenType.Star,
      ["^"]: TokenType.Carrot,
      ["%"]: TokenType.Percentage,
      ["{"]: TokenType.OpenBrace,
      ["}"]: TokenType.ClosedBrace,
      ["["]: TokenType.OpenBracket,
      ["]"]: TokenType.ClosedBracket,
      ["("]: TokenType.OpenParenthesis,
      [")"]: TokenType.ClosedParenthesis,
      [";"]: TokenType.SemiColon,
      ["#"]: TokenType.HashTag,
      ["-"]: TokenType.Minus,
      ["+"]: TokenType.Plus,
    };

    // Put a mark on the scanner before we progress it.
    scanner.mark();

    scanner.scan(punctuator.length);

    return {
      type: punctuatorTable[punctuator],
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
      isKeyword: false,
    };
  }

  tokenize(): Token {
    const { scanner, options, isStarted } = this;

    // Shebang must be the first two bytes in a file.
    // So we must use this check before any whitespace consumption.
    if (!isStarted) {
      this.isStarted = true;

      this.consumeShebangLine();
    }

    // All whitespace noise is eaten away as they have no semantic value.
    this.consumeWhitespace();

    if (scanner.isOutOfBounds()) {
      return this.tokenizeEOF();
    }

    // If the word is an alphabet it probably is an identifier.
    // NOTE: lua identifiers do not start with numbers.
    if (scanner.isAlphabet()) {
      return this.tokenizeIdentifier();
    }

    if (scanner.match("--")) {
      // We check for these two conditions because you can also have
      // comments such as --[hello world which is valid.
      if (scanner.match("--[[") || scanner.match("--[=")) {
        return this.tokenizeLongComment();
      }

      return this.tokenizeComment();
    }

    if (scanner.match('"') || scanner.match("'")) {
      return this.tokenizeStringLiteral();
    }

    if (scanner.match("[")) {
      if (scanner.match("[[") || scanner.match("[=")) {
        return this.tokenizeLongStringLiteral();
      }

      return this.tokenizePunctuator("[");
    }

    if (scanner.isDigit()) {
      return this.tokenizeNumericLiteral();
    }

    if (scanner.match(".")) {
      if (scanner.isDigit(scanner.index + 1)) {
        return this.tokenizeDecimalNumericLiteral();
      }

      if (scanner.match("...")) {
        return this.tokenizeVarargLiteral();
      }

      if (scanner.match("..")) {
        return this.tokenizePunctuator("..");
      }

      if (scanner.match(".")) {
        return this.tokenizePunctuator(".");
      }
    }

    if (scanner.match("=")) {
      if (scanner.match("==")) {
        return this.tokenizePunctuator("==");
      }

      return this.tokenizePunctuator("=");
    }

    if (scanner.match(">")) {
      if (options.bitwiseOperators && scanner.match(">=")) {
        return this.tokenizePunctuator(">=");
      }

      if (options.bitwiseOperators && scanner.match(">>")) {
        return this.tokenizePunctuator(">>");
      }

      return this.tokenizePunctuator(">");
    }

    if (scanner.match("<")) {
      if (options.bitwiseOperators && scanner.match("<=")) {
        return this.tokenizePunctuator("<=");
      }

      if (options.bitwiseOperators && scanner.match("<<")) {
        return this.tokenizePunctuator("<<");
      }

      return this.tokenizePunctuator("<");
    }

    if (scanner.match("~")) {
      if (scanner.match("~=")) {
        return this.tokenizePunctuator("~=");
      }

      if (options.bitwiseOperators) {
        return this.tokenizePunctuator("~");
      }
    }

    if (scanner.match("/")) {
      if (options.integerDivision && scanner.match("//")) {
        return this.tokenizePunctuator("//");
      }

      return this.tokenizePunctuator("/");
    }

    if (scanner.match(":")) {
      if (options.labels && scanner.match("::")) {
        return this.tokenizePunctuator("::");
      }

      return this.tokenizePunctuator(":");
    }

    if (options.bitwiseOperators && scanner.match("&")) {
      return this.tokenizePunctuator("&");
    }

    if (options.bitwiseOperators && scanner.match("|")) {
      return this.tokenizePunctuator("|");
    }

    if (scanner.someChar("*^%,{}]();#-+")) {
      return this.tokenizePunctuator(scanner.getChar());
    }

    TokenizerException.raiseUnexpectedCharacterError(scanner);
  }

  getTokens(): Token[] {
    while (true) {
      const token = this.tokenize();
      this.tokens.push(token);

      if (token.type === TokenType.EOF) {
        break;
      }
    }

    return this.tokens;
  }
}

export { Tokenizer };
export type { TokenizerOptions };
