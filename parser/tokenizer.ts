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

const {
  Not,
  Do,
  Identifier,
  EOF,
  NilLiteral,
  BooleanLiteral,
  StringLiteral,
  CommentLiteral,
  NumericLiteral,
  Equal,
  Or,
  And,
  VarargLiteral,
  DoubleColon,
  Star,
  Comma,
  Colon,
  DoubleDivide,
  LessThan,
  GreaterThan,
  DoubleDot,
  TildaEqual,
  DoubleLessThan,
  DoubleGreaterThan,
  DoubleEqual,
  Divide,
  Tilda,
  Carrot,
  Ampersand,
  Percentage,
  OpenBrace,
  Dot,
  LessThanEqual,
  ClosedBrace,
  ClosedBracket,
  OpenBracket,
  OpenParenthesis,
  Pipe,
  Plus,
  Minus,
  ClosedParenthesis,
  HashTag,
  SemiColon,
  Return,
  If,
  In,
  For,
  Goto,
  Else,
  Then,
  Local,
  Break,
  Until,
  While,
  Elseif,
  Repeat,
  End,
  Function,
  GreaterThanEqual,
} = TokenType;

// References: https://www.ibm.com/docs/en/i/7.3?topic=tokens-literals

class Tokenizer {
  scanner: Scanner;
  #isStarted = false;
  #tokens: Token[] = [];
  #options: TokenizerOptions = {
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
    this.#options = {
      ...this.#options,
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
  //@Profiler.bench
  #consumeWhitespace(): boolean {
    while (!this.scanner.isOutOfBoundsAt(this.scanner.pos)) {
      if (this.scanner.isWhitespace(this.scanner.pos)) {
        this.scanner.scan();
      } else if (!this.scanner.consumeEOL()) {
        return true;
      }
    }

    return false;
  }

  // Eats away the entire shebang line
  //@Profiler.bench
  #consumeShebangLine(): boolean {
    if (this.scanner.match("#!")) {
      this.scanner.scanUntil(() => this.scanner.isLineFeedAt(this.scanner.pos));
      this.#consumeWhitespace();

      return true;
    }

    return false;
  }

  //@Profiler.bench
  #consumeExponent({ isBinary }: { isBinary?: boolean }) {
    let charCode = this.scanner.charCode;

    if (
      isBinary
        ? charCode === 69 || charCode === 101 // (p or P)
        : charCode === 80 || charCode === 112 // (e or E)
    ) {
      this.scanner.scan();

      charCode = this.scanner.charCode;

      // If we encounter a "+" or "-", we can just continue our
      // scanning as it's part of the semantics.
      if (charCode === 43 || charCode === 45) {
        this.scanner.scan();

        charCode = this.scanner.charCode;
      }

      // If we encounter a digit after the exponent it's an error.
      if (!(charCode >= 48 && charCode <= 57)) {
        TokenizerException.raiseMalformedNumberError(this.scanner);
      }

      this.scanner.scanWhile(() => this.scanner.isDigitAt(this.scanner.pos));

      return true;
    }

    return false;
  }

  //@Profiler.bench
  #consumeBackslash(): boolean {
    if (this.scanner.match("\\")) {
      this.scanner.scan();

      return true;
    }

    return false;
  }

  //@Profiler.bench
  #consumeImaginaryUnitSuffix(): boolean {
    if (!this.#options.imaginaryNumbers) {
      return false;
    }

    const charCode = this.scanner.charCode;

    // We check of suffix indicator for imaginary numbers by "i" or "I"
    if (charCode === 73 || charCode === 105) {
      this.scanner.scan();

      return true;
    }

    return false;
  }

  // Rules:
  // ------
  // Integer suffix should not work if the literal being processed
  // has fractions ("." notation). Integer suffix will also
  // not work if there is an imaginary suffix before it as well.
  //@Profiler.bench
  #consumeInt64Suffix(): boolean {
    if (!this.#options.integerSuffixes) {
      return false;
    }

    let charCode = this.scanner.charCode;

    // Accepted suffixes: Any casing combination of ULL and LL

    // U or u
    if (charCode === 85 || charCode === 117) {
      this.scanner.scan();

      charCode = this.scanner.charCode;

      // L or l
      if (charCode === 76 || charCode === 108) {
        this.scanner.scan();

        charCode = this.scanner.charCode;
        // L or l
        if (charCode === 76 || charCode === 108) {
          this.scanner.scan();

          return true;
        }

        // UL but no L
        TokenizerException.raiseMalformedNumberError(this.scanner);
      }
      // U but no L
      TokenizerException.raiseMalformedNumberError(this.scanner);
      // L or l
    } else if (charCode === 76 || charCode === 108) {
      this.scanner.scan();

      charCode = this.scanner.charCode;

      // L or l
      if (charCode === 76 || charCode === 108) {
        this.scanner.scan();

        return true;
      }
      // First L but no second L
      TokenizerException.raiseMalformedNumberError(this.scanner);
    }

    return false;
  }

  //@Profiler.bench
  #consumeDotNotation(): boolean {
    if (this.scanner.match(".")) {
      this.scanner.scan();

      return true;
    }

    return false;
  }

  //@Profiler.bench
  #scanLongString(isComment: boolean): boolean {
    let depth = 0;
    let encounteredDelimeter = false;

    const raiseError = () =>
      isComment
        ? TokenizerException.raiseUnfinishedLongCommentError(this.scanner)
        : TokenizerException.raiseUnfinishedLongStringError(this.scanner);

    // if we keep encountering "=" we scan it and increment depth count.
    while (this.scanner.match("=")) {
      this.scanner.scan();
      ++depth;
    }

    // If we encounter a bunch of "=" and we already have a sequence such as [====
    // or something and the next character is not a "[" then we know it's an unfinished string.
    // This expression holds true for the following cases: "[[" or "[====["
    if (!this.scanner.match("[")) {
      return isComment ? false : raiseError();
    }

    while (!encounteredDelimeter) {
      let runningDepth = 0;

      // If we hit out of bounds we have an unfinished
      // long string that never met the matching delimiter.
      if (this.scanner.isOutOfBoundsAt(this.scanner.pos)) {
        raiseError();
      }

      // If we encounter equal characters.
      while (this.scanner.match("=")) {
        // We increment our running depth and check if it equals the real depth.
        // If it does and current char and next char equals "=]" we encountered
        // our delimeter.
        if (++runningDepth === depth && this.scanner.match("=]")) {
          encounteredDelimeter = true;
          depth = 0;

          this.scanner.scan();

          break;
        }

        this.scanner.scan();
      }

      // The long string itself could have no depth if it starts with [[.
      // Another instance could be there was a depth and we found a delimiter.
      if (depth === 0) {
        if (this.scanner.match("]]")) {
          encounteredDelimeter = true;

          // Scan over this delimeter.
          this.scanner.scan();
        }
      }

      // If we successfully consume an end of line then we don't need to scan again.
      // NOTE: this.scanner.consumeEOL progresses the this.scanner, which means we don't need
      // to progress it we have already consumed a token within this loop.
      if (!this.scanner.consumeEOL()) {
        this.scanner.scan();
      }
    }

    return true;
  }

  //@Profiler.bench
  #tokenizeEOF(): Token {
    // Mark the spot in the this.scanner for us to remember the start.
    this.scanner.mark();

    return {
      type: EOF,
      value: "<eof>",
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeComment(): Token {
    const { lnum, lnumStartIndex } = this.scanner;

    // Mark the spot in the this.scanner for us to remember the start.
    this.scanner.mark();

    // scan over "--"
    this.scanner.scan().scan();

    while (
      !this.scanner.isLineTerminatorAt(this.scanner.pos) &&
      !this.scanner.isOutOfBoundsAt(this.scanner.pos)
    ) {
      this.scanner.scan();
    }

    return {
      type: CommentLiteral,
      value: this.scanner.text,
      lnum,
      lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeLongComment(): Token {
    const { lnum, lnumStartIndex } = this.scanner;

    // Mark the spot in the this.scanner for us to remember the start.
    this.scanner.mark();

    // scan over "--["
    this.scanner.scan("--[".length);

    this.#scanLongString(true);

    return {
      type: CommentLiteral,
      value: this.scanner.text,
      lnum,
      lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeStringLiteral(): Token {
    const { lnum, lnumStartIndex } = this.scanner;
    const delimeterCharCode = this.scanner.charCode;

    // Mark the spot in the this.scanner for us to remember the start.
    this.scanner.mark();

    // Scan over the ending string delimiter (", ')
    this.scanner.scan();

    while (!this.scanner.isCharCodeAt(this.scanner.pos, delimeterCharCode)) {
      // If we hit out of bounds we have an unfinished string that
      // never met the matching delimiter.
      if (this.scanner.isOutOfBoundsAt(this.scanner.pos)) {
        TokenizerException.raiseUnfinishedStringError(this.scanner);
      }

      this.#consumeBackslash();

      // If we successfully consume an end of line then we don't need to scan again.
      // NOTE: this.scanner.consume* progresses the this.scanner.
      if (!this.scanner.consumeEOL()) {
        this.scanner.scan();
      }
    }

    // Scan over the ending string delimiter (", ')
    this.scanner.scan();

    return {
      type: StringLiteral,
      value: this.scanner.text,
      lnum,
      lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeLongStringLiteral(): Token {
    const { lnum, lnumStartIndex } = this.scanner;

    // Mark the spot in the this.scanner for us to remember the start.
    this.scanner.mark();

    // Skip over "["
    this.scanner.scan();

    this.#scanLongString(false);

    return {
      type: StringLiteral,
      value: this.scanner.text,
      lnum,
      lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeIdentifier(): Token {
    // Mark the spot in the this.scanner for us to remember the start.
    this.scanner.mark();

    // Itentifiers can only be characters that are alphanumeric (digits or alphabets).
    this.scanner.scanWhile(() =>
      this.scanner.isAlphanumericAt(this.scanner.pos)
    );

    let type;
    const value = this.scanner.text;

    // Switch case is more optimized over heap allocations.
    switch (value) {
      case "or":
        type = Or;
        break;
      case "and":
        type = And;
        break;
      case "not":
        type = Not;
        break;
      case "true":
        type = BooleanLiteral;
        break;
      case "false":
        type = BooleanLiteral;
        break;
      case "nil":
        type = NilLiteral;
        break;
      case "do":
        type = Do;
        break;
      case "if":
        type = If;
        break;
      case "in":
        type = In;
        break;
      case "end":
        type = End;
        break;
      case "for":
        type = For;
        break;
      case "else":
        type = Else;
        break;
      case "then":
        type = Then;
        break;
      case "break":
        type = Break;
        break;
      case "local":
        type = Local;
        break;
      case "while":
        type = While;
        break;
      case "elseif":
        type = Elseif;
        break;
      case "until":
        type = Until;
        break;
      case "repeat":
        type = Repeat;
        break;
      case "return":
        type = Return;
        break;
      case "function":
        type = Function;
        break;
      case "goto":
        type = Goto;
        break;
    }

    return {
      type: type != null ? type : Identifier,
      value,
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
      range: this.scanner.range,
      isKeyword: !!type,
    };
  }

  //@Profiler.bench
  #tokenizeHexadecimalNumericLiteral(): Token {
    // Put a mark on the this.scanner before we progress it.
    this.scanner.mark();

    // Since we are in this function, we know we are dealing with hexadecimal numeric literals.
    // This means we can successfully acknowledge 0 and "x".
    this.scanner.scan().scan();

    // Next character must either be a hexadecimal or a ".", if not it's an error.
    if (
      !this.scanner.match(".") && !this.scanner.isHexDigitAt(this.scanner.pos)
    ) {
      TokenizerException.raiseMalformedNumberError(this.scanner);
    }

    // Hexadecimal numbers can be represented as 0x.34
    let isDecimal = this.#consumeDotNotation();

    // When dealing with hexadecimal numeric literals, only hexadecimal digits are valid.
    // For example, Letters can be either between 0-9 or A-F.
    this.scanner.scanWhile(() => this.scanner.isHexDigitAt(this.scanner.pos));

    // If we already encountered a "." it cannot appear again, so incase we didn't encounter
    // a hex that start with a dot notation such as "0x.3f" we account for dot notation that
    // may appear afterwards.
    if (!isDecimal) {
      isDecimal = this.#consumeDotNotation();
    }

    this.scanner.scanWhile(() => this.scanner.isHexDigitAt(this.scanner.pos));

    // If we encounter another dot notation it's an error, e.g "0x3..3".
    if (isDecimal && this.scanner.match(".")) {
      TokenizerException.raiseMalformedNumberError(this.scanner);
    }

    const hasExponent = this.#consumeExponent({ isBinary: false });
    const hasImaginaryUnitSuffix = this.#consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.#consumeInt64Suffix();

    // If either the number is a decimal or has exponent or has imaginary suffix
    // and if we find integer suffix it's a syntax error that should be thrown.
    if (
      (isDecimal || hasExponent || hasImaginaryUnitSuffix) && hasInt64Suffix
    ) {
      TokenizerException.raiseMalformedNumberError(this.scanner);
    }

    return {
      type: NumericLiteral,
      value: this.scanner.text,
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeDecimalNumericLiteral(): Token {
    // Mark the position and scan until we no longer encounter a digit.
    this.scanner.mark().scanWhile(() =>
      this.scanner.isDigitAt(this.scanner.pos)
    );

    // We check for dot notation to check if we are dealing with decimal numbers.
    const isDecimal = this.#consumeDotNotation();

    // When dealing with decimal numeric literal, only digits are valid.
    this.scanner.scanWhile(() => this.scanner.isDigitAt(this.scanner.pos));

    // If we encounter another dot notation it's an error, e.g "3..3" or "3.3.4".
    if (isDecimal && this.scanner.match(".")) {
      TokenizerException.raiseMalformedNumberError(this.scanner);
    }

    // After we are done with the code above we may have something like 3 or 3.14159265359.
    // Now we need to check for exponent part, NOTE: 3.14159265359e2 is a valid statement.
    const hasExponent = this.#consumeExponent({ isBinary: true });

    const hasImaginaryUnitSuffix = this.#consumeImaginaryUnitSuffix();

    const hasInt64Suffix = this.#consumeInt64Suffix();

    // If either the number is a decimal, has exponent or has imaginary suffix,
    // if we find integer suffix as well, we throw an error.
    if (
      (isDecimal || hasExponent || hasImaginaryUnitSuffix) && hasInt64Suffix
    ) {
      TokenizerException.raiseMalformedNumberError(this.scanner);
    }

    return {
      type: NumericLiteral,
      value: this.scanner.text,
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizeNumericLiteral(): Token {
    // If it's a hexadecimal it starts with "0x" or "0X".
    if (this.scanner.match("0x") || this.scanner.match("0X")) {
      return this.#tokenizeHexadecimalNumericLiteral();
    }

    return this.#tokenizeDecimalNumericLiteral();
  }

  //@Profiler.bench
  #tokenizeVarargLiteral(): Token {
    // Put a mark on the this.scanner before we progress it.
    this.scanner.mark();

    // skip over "...".
    this.scanner.scan().scan().scan();

    return {
      type: VarargLiteral,
      value: this.scanner.text,
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  //@Profiler.bench
  #tokenizePunctuator(punctuator: string, type: TokenType): Token {
    // Put a mark on the this.scanner before we progress it.
    this.scanner.mark();

    this.scanner.scan(punctuator.length);

    return {
      type,
      value: this.scanner.text,
      lnum: this.scanner.lnum,
      lnumStartIndex: this.scanner.lnumStartIndex,
      range: this.scanner.range,
      isKeyword: false,
    };
  }

  tokenize(): Token {
    // Shebang must be the first two bytes in a file.
    // So we must use this check before any whitespace consumption.
    if (!this.#isStarted) {
      this.#isStarted = true;

      this.#consumeShebangLine();
    }

    // All whitespace noise is eaten away as they have no semantic value.
    this.#consumeWhitespace();

    const pos = this.scanner.pos;

    if (this.scanner.isOutOfBoundsAt(pos)) {
      return this.#tokenizeEOF();
    }

    const charCode = this.scanner.charCode;

    // If the word is an alphabet it probably is an identifier.
    // NOTE: lua identifiers do not start with numbers.
    if (
      ((charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122) || 95 === charCode)
    ) {
      return this.#tokenizeIdentifier();
    }

    if (charCode === 39 || charCode === 34) {
      return this.#tokenizeStringLiteral();
    }

    if (charCode >= 48 && charCode <= 57) {
      return this.#tokenizeNumericLiteral();
    }

    switch (charCode) {
      case 35: { // #
        return this.#tokenizePunctuator(this.scanner.char, HashTag);
      }
      case 37: // %
        return this.#tokenizePunctuator(this.scanner.char, Percentage);
      case 40: // (
        return this.#tokenizePunctuator(this.scanner.char, OpenParenthesis);
      case 41: // )
        return this.#tokenizePunctuator(this.scanner.char, ClosedParenthesis);
      case 42: // *
        return this.#tokenizePunctuator(this.scanner.char, Star);
      case 43: // +
        return this.#tokenizePunctuator(this.scanner.char, Plus);
      case 44: // ,
        return this.#tokenizePunctuator(this.scanner.char, Comma);
      case 45: { // -
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (charCode === 45 && nextCharCode === 45) {
          const nextNextCharCode = this.scanner.charCodeAt(pos + 2);
          const nextNextNextCharCode = this.scanner.charCodeAt(pos + 3);

          // We check for these two conditions because you can also have
          // comments such as --[hello world which is valid.
          if (nextNextCharCode === 91) {
            if (nextNextNextCharCode === 91 || nextNextNextCharCode === 61) {
              return this.#tokenizeLongComment();
            }
          }

          return this.#tokenizeComment();
        }

        return this.#tokenizePunctuator(this.scanner.char, Minus);
      }
      case 46: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (nextCharCode >= 48 && nextCharCode <= 57) {
          return this.#tokenizeDecimalNumericLiteral();
        }

        if (nextCharCode === 46) {
          const nextNextCharCode = this.scanner.charCodeAt(pos + 2);

          if (nextNextCharCode === 46) {
            return this.#tokenizeVarargLiteral();
          }

          return this.#tokenizePunctuator("..", DoubleDot);
        }

        return this.#tokenizePunctuator(".", Dot);
      }
      case 47: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (this.#options.integerDivision && nextCharCode === 47) {
          return this.#tokenizePunctuator("//", DoubleDivide);
        }

        return this.#tokenizePunctuator("/", Divide);
      }
      case 58: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (this.#options.labels && nextCharCode === 58) {
          return this.#tokenizePunctuator("::", DoubleColon);
        }

        return this.#tokenizePunctuator(":", Colon);
      }
      case 59: // ;
        return this.#tokenizePunctuator(this.scanner.char, SemiColon);
      case 60: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (this.#options.bitwiseOperators && nextCharCode === 61) {
          return this.#tokenizePunctuator("<=", LessThanEqual);
        }

        if (this.#options.bitwiseOperators && nextCharCode === 60) {
          return this.#tokenizePunctuator("<<", DoubleLessThan);
        }

        return this.#tokenizePunctuator("<", LessThan);
      }
      case 61: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (nextCharCode === 61) {
          return this.#tokenizePunctuator("==", DoubleEqual);
        }

        return this.#tokenizePunctuator("=", Equal);
      }
      case 62: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (this.#options.bitwiseOperators && nextCharCode === 61) {
          return this.#tokenizePunctuator(">=", GreaterThanEqual);
        }

        if (this.#options.bitwiseOperators && nextCharCode === 62) {
          return this.#tokenizePunctuator(">>", DoubleGreaterThan);
        }

        return this.#tokenizePunctuator(">", GreaterThan);
      }
      case 91: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (nextCharCode === 91 || nextCharCode === 61) {
          return this.#tokenizeLongStringLiteral();
        }

        return this.#tokenizePunctuator("[", OpenBracket);
      }
      case 93: // ]
        return this.#tokenizePunctuator(this.scanner.char, ClosedBracket);
      case 94: // ^
        return this.#tokenizePunctuator(this.scanner.char, Carrot);
      case 123: // {
        return this.#tokenizePunctuator(this.scanner.char, OpenBrace);
      case 125: // }
        return this.#tokenizePunctuator(this.scanner.char, ClosedBrace);
      case 126: {
        const nextCharCode = this.scanner.charCodeAt(pos + 1);

        if (nextCharCode === 61) {
          return this.#tokenizePunctuator("~=", TildaEqual);
        }

        if (this.#options.bitwiseOperators) {
          return this.#tokenizePunctuator("~", Tilda);
        }
      }
    }

    if (this.#options.bitwiseOperators && charCode === 38) {
      return this.#tokenizePunctuator("&", Ampersand);
    }

    if (this.#options.bitwiseOperators && charCode === 124) {
      return this.#tokenizePunctuator("|", Pipe);
    }

    TokenizerException.raiseUnexpectedCharacterError(this.scanner);
  }

  getTokens(): Token[] {
    while (true) {
      const token = this.tokenize();
      this.#tokens.push(token);

      if (token.type === EOF) {
        break;
      }
    }

    return this.#tokens;
  }
}

export { Tokenizer };
export type { TokenizerOptions };
