import { ErrorReporter, Scanner } from "./mod.ts";

enum TokenType {
  Keyword = "Keyword", // Keywords
  Identifier = "Identifier", // User defined identifiers within the language

  StringLiteral = "StringLiteral", // " or '
  NumericLiteral = "NumericLiteral", // 1, 2, 3, 4, etc.
  BooleanLiteral = "BooleanLiteral", // true or false
  NilLiteral = "NilLiteral", // nil
  VarargLiteral = "VarargLiteral", // ...
  CommentLiteral = "CommentLiteral", // -- or --[[]]

  Or = "Or", // or
  And = "And", // and
  Not = "Not", // not

  // Punctuators
  Dot = "Dot", // .
  Comma = "Comma", // ,
  Equal = "Equal", // =
  GreaterThan = "GreaterThan", // >
  LessThan = "LessThan", // <
  Divide = "Divide", // /
  Colon = "Colon", // :
  Tilda = "Tilda", // ~
  Ampersand = "Ampersand", // &
  Pipe = "Pipe", // |
  Star = "Star", // *
  Carrot = "Carrot", // ^
  Percentage = "Percentage", // %
  OpenBrace = "OpenBrace", // {
  ClosedBrace = "ClosedBrace", // }
  OpenParenthesis = "OpenParenthesis", // (
  ClosedParenthesis = "ClosedParenthesis", // )
  OpenBracket = "OpenBracket", // [
  ClosedBracket = "ClosedBracket", // ]
  SemiColon = "SemiColon", // ;
  HashTag = "HashTag", // #
  Minus = "Minus", // -
  Plus = "Plus", // +
  DoubleDot = "DoubleDot", // ..
  DoubleEqual = "DoubleEqual", // ==
  TildaEqual = "TildaEqual", // ~=
  GreaterThanEqual = "GreaterThanEqual", // >=
  LessThanEqual = "LessThanEqual", // <=
  DoubleDivide = "DoubleDivide", // //
  DoubleColon = "DoubleColon", // ::
  DoubleGreaterThan = "DoubleGreaterThan", // >>
  DoubleLessThan = "DoubleLessThan", // <<

  EOF = "EOF", // <eof>
}

enum Precedence {
  Lowest = 1,
  Or = 2, // or
  And = 3, // and
  Comparison = 4, // <, >, <=, >=, ~= or ==
  BitwiseOr = 5, // |
  BitwiseExclusiveOr = 6, // ~
  BitwiseAnd = 7, // &
  BitwiseShift = 8, // >> or <<
  StringConcat = 9, // ..
  Term = 10, // + or -
  Factor = 11, // *, /, //
  Unary = 12, // -, #, ~ or not
  Exponent = 13, // ^
}

interface TokenOptions {
  type: TokenType;
  value: string;
  range: number[];
  lnum: number;
  lnumStartIndex: number;
}

class Token {
  type: TokenType;
  value: string;
  range: number[];
  lnum: number;
  lnumStartIndex: number;

  constructor({ type, value, range, lnum, lnumStartIndex }: TokenOptions) {
    this.type = type;
    this.value = value;
    this.range = range;
    this.lnum = lnum;
    this.lnumStartIndex = lnumStartIndex;
  }

  // Each token will have a precedence associated with it.
  // https://www.lua.org/pil/3.5.html
  get precedence(): number {
    switch (this.type) {
      default:
        return Precedence.Lowest;

      case TokenType.Or:
        return Precedence.Or;
      case TokenType.And:
        return Precedence.And;

      case TokenType.GreaterThan:
        return Precedence.Comparison;
      case TokenType.LessThan:
        return Precedence.Comparison;
      case TokenType.GreaterThanEqual:
        return Precedence.Comparison;
      case TokenType.LessThanEqual:
        return Precedence.Comparison;
      case TokenType.DoubleEqual:
        return Precedence.Comparison;
      case TokenType.TildaEqual:
        return Precedence.Comparison;

      case TokenType.Pipe:
        return Precedence.BitwiseOr;
      case TokenType.Tilda:
        return Precedence.BitwiseExclusiveOr;
      case TokenType.Ampersand:
        return Precedence.BitwiseAnd;
      case TokenType.DoubleGreaterThan:
        return Precedence.BitwiseShift;
      case TokenType.DoubleLessThan:
        return Precedence.BitwiseShift;

      case TokenType.DoubleDot:
        return Precedence.StringConcat;

      case TokenType.Plus:
        return Precedence.Term;
      case TokenType.Minus:
        return Precedence.Term;

      case TokenType.Percentage:
        return Precedence.Factor;
      case TokenType.Star:
        return Precedence.Factor;
      case TokenType.Divide:
        return Precedence.Factor;
      case TokenType.DoubleDivide:
        return Precedence.Factor;

      case TokenType.Carrot:
        return Precedence.Exponent;
    }
  }
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

  private reportMalformedNumber(): never {
    ErrorReporter.report(
      this.scanner,
      "malformed number near '%s'",
      this.scanner.getText(),
    );
  }

  private reportUnfinishedString(): never {
    ErrorReporter.report(
      this.scanner,
      "unfinished string near '%s'",
      this.scanner.getText(),
    );
  }

  private reportUnfinishedLongString(): never {
    ErrorReporter.report(
      this.scanner,
      `unfinished long string (starting at line ${this.scanner.lnum}) near '%s'`,
      this.scanner.getText(),
    );
  }

  private reportUnexpectedCharacter(): never {
    ErrorReporter.report(
      this.scanner,
      "unfinished character near '%s'",
      this.scanner.getText(),
    );
  }

  private reportUnfinishedComment(): never {
    ErrorReporter.report(
      this.scanner,
      "unfinished comment near '%s'",
      this.scanner.getText(),
    );
  }

  private reportUnfinishedLongComment(): never {
    ErrorReporter.report(
      this.scanner,
      `unfinished long comment (starting at line ${this.scanner.lnum}) near '%s'`,
      this.scanner.getText(),
    );
  }

  // All lua keywords
  private isKeyword(text: string) {
    const { options } = this;
    const keywords: string[] = [
      "do",
      "if",
      "in",
      "end",
      "for",
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
        this.reportMalformedNumber();
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

  // Rules: Integer suffix should not work if the literal the suffix is
  // part of  has fractions ("." notation). Integer suffix will also
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
        this.reportMalformedNumber();
      }
      // U but no L
      this.reportMalformedNumber();
      // L or l
    } else if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
      scanner.scan();

      // L or l
      if (scanner.isCharCode(76) || scanner.isCharCode(108)) {
        scanner.scan();

        return true;
      }
      // First L but no second L
      this.reportMalformedNumber();
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
    const reportError = () =>
      isComment
        ? this.reportUnfinishedLongComment()
        : this.reportUnfinishedLongString();

    // if we keep encountering "=" we scan it and increment depth count.
    while (scanner.match("=")) {
      scanner.scan();
      ++depth;
    }

    // If we encounter a bunch of "=" and we already have a sequence such as [====
    // or something and the next character is not a "[" then we know it's an unfinished string.
    // This expression holds true for the following cases: "[[" or "[====["
    if (!scanner.match("[")) {
      return isComment ? false : reportError();
    }

    while (!encounteredDelimeter) {
      let runningDepth = 0;

      // If we hit out of bounds we have an unfinished
      // long string that never met the matching delimiter.
      if (scanner.isOutOfBounds()) {
        reportError();
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

    return new Token({
      type: TokenType.EOF,
      value: "<eof>",
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
    });
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

    return new Token({
      type: TokenType.CommentLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
    });
  }

  private tokenizeLongComment(): Token {
    const { scanner } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // scan over "--["
    scanner.scan("--[".length);

    this.scanLongString(true);

    return new Token({
      type: TokenType.CommentLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
    });
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
        this.reportUnfinishedString();
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

    return new Token({
      type: TokenType.StringLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
    });
  }

  private tokenizeLongStringLiteral(): Token {
    const { scanner } = this;
    const { lnum, lnumStartIndex } = scanner;

    // Mark the spot in the scanner for us to remember the start.
    scanner.mark();

    // Skip over "["
    scanner.scan();

    this.scanLongString(false);

    return new Token({
      type: TokenType.StringLiteral,
      value: scanner.getText(),
      lnum,
      lnumStartIndex,
      range: scanner.getRange(),
    });
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
    } else if (value === "or") {
      type = TokenType.Or;
    } else if (value === "and") {
      type = TokenType.And;
    } else if (value === "not") {
      type = TokenType.Not;
    } else if (value === "true" || value === "false") {
      type = TokenType.BooleanLiteral;
    } else if (value === "nil") {
      type = TokenType.NilLiteral;
    }

    return new Token({
      type,
      value,
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
    });
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
      this.reportMalformedNumber();
    }

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
    if (isDecimal && scanner.match(".")) {
      this.reportMalformedNumber();
    }

    const hasExponent = this.consumeExponent({ isBinary: false });
    const hasImaginaryUnitSuffix = this.consumeImaginaryUnitSuffix();
    const hasInt64Suffix = this.consumeInt64Suffix();

    // If either the number is a decimal, has exponent or has imaginary suffix,
    // if we find integer suffix as well, we throw an error.
    if (
      (isDecimal || hasExponent || hasImaginaryUnitSuffix) && hasInt64Suffix
    ) {
      this.reportMalformedNumber();
    }

    return new Token({
      type: TokenType.NumericLiteral,
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
    });
  }

  private tokenizeDecimalNumericLiteral(): Token {
    const { scanner } = this;

    // Mark the position and scan until we no longer encounter a digit.
    scanner.mark().scanWhile(scanner.isDigit);

    // We check for dot notation to check if we are dealing with decimal numbers.
    const isDecimal = this.consumeDotNotation();

    scanner.scanWhile(scanner.isDigit);

    // If we encounter another dot notation it's an error, e.g "3..3" or "3.3.4".
    if (isDecimal && scanner.match(".")) {
      this.reportMalformedNumber();
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
      this.reportMalformedNumber();
    }

    return new Token({
      type: TokenType.NumericLiteral,
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
    });
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

    return new Token({
      type: TokenType.VarargLiteral,
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
    });
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

    return new Token({
      type: punctuatorTable[punctuator],
      value: scanner.getText(),
      lnum: scanner.lnum,
      lnumStartIndex: scanner.lnumStartIndex,
      range: scanner.getRange(),
    });
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

    this.reportUnexpectedCharacter();
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

export { Precedence, Token, Tokenizer, TokenType };
export type { TokenizerOptions };
