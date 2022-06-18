import { ast, Token, TokenCursor, TokenType } from "./mod.ts";

// Null denotation tokens will not contain a left expression associated with it.
type NudParselet = () => Token | ast.Expression;
// Left denotation tokens will contain a left expression associated with it.
type LedParselet = (leftExpression: ast.Expression) => ast.Expression;

type Parselet = NudParselet | LedParselet;

type ParseletMap = Partial<Record<TokenType, Parselet>>;

// Pratt parser.
class Parser {
  private cursor: TokenCursor;
  private nudParseletMap: ParseletMap = {};
  private ledParseletMap: ParseletMap = {};

  constructor(source: string) {
    this.cursor = new TokenCursor(source);

    this.registerParselets();
  }

  private registerNudParselet(
    token: TokenType,
    nudParselet: NudParselet,
  ): Parser {
    this.nudParseletMap[token] = nudParselet.bind(this);

    return this;
  }

  private registerLedParselet(
    token: TokenType,
    ledParselet: LedParselet,
  ): Parser {
    this.ledParseletMap[token] = ledParselet.bind(this);

    return this;
  }

  private registerParselets() {
    this.registerNudParselet(
      TokenType.Keyword,
      this.keywordParselet,
    );
    this.registerNudParselet(
      TokenType.Identifier,
      this.identifierParselet,
    );
    this.registerNudParselet(
      TokenType.NumericLiteral,
      this.numericLiteralParselet,
    );
  }

  private keywordParselet(): Token {
    return this.cursor.current;
  }

  private numericLiteralParselet(): Token {
    return this.cursor.current;
  }

  private identifierParselet(): Token {
    return this.cursor.current;
  }

  advance() {}

  parse() {}
}

export { Parser };
