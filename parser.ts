import {
  ast,
  ErrorReporter,
  Precedence,
  Scanner,
  TokenCursor,
  Tokenizer,
  TokenizerOptions,
  TokenType,
} from "./mod.ts";

// Null denotation tokens will not contain any left expression associated with it.
type NullDenotationParselet = () => ast.Expression;
// Left denotation tokens will contain a left expression associated with it.
type LeftDenotationParselet = (
  leftExpression: ast.Expression,
) => ast.Expression;

type ParseletTable<T> = Partial<Record<TokenType, T>>;

// Pratt parser.
class Parser {
  private cursor: TokenCursor;
  private errorReporter: ErrorReporter;
  private nullDenotationParseletTable: ParseletTable<NullDenotationParselet> =
    {};
  private LeftDenotationParseletTable: ParseletTable<LeftDenotationParselet> =
    {};

  constructor(source: string, tokenizerOptions?: TokenizerOptions) {
    const scanner = new Scanner(source);
    const errorReporter = new ErrorReporter(scanner);

    this.cursor = new TokenCursor(
      new Tokenizer(
        scanner,
        errorReporter,
        tokenizerOptions,
      ),
    );
    this.errorReporter = errorReporter;

    this.registerParselets();
  }

  private registerNullDenotationParselet(
    tokenType: TokenType,
    nullDenotationParselet: NullDenotationParselet,
  ): Parser {
    this.nullDenotationParseletTable[tokenType] = nullDenotationParselet.bind(
      this,
    );

    return this;
  }

  private registerNullDenotationParselets(): Parser {
    this.registerNullDenotationParselet(
      TokenType.NumericLiteral,
      this.numericLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.StringLiteral,
      this.stringLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.BooleanLiteral,
      this.booleanLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.NilLiteral,
      this.nilLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.VarargLiteral,
      this.VarargLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.CommentLiteral,
      this.commentLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.OpenParenthesis,
      this.groupingParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.Not,
      this.unaryParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.Minus,
      this.unaryParselet,
    );

    return this;
  }

  private registerLeftDenotationParselets(): Parser {
    return this;
  }

  private registerParselets(): Parser {
    return this
      .registerNullDenotationParselets()
      .registerLeftDenotationParselets();
  }

  private numericLiteralParselet(): ast.Expression {
    return new ast.NumericLiteral(this.cursor.current);
  }

  private stringLiteralParselet(): ast.Expression {
    return new ast.StringLiteral(this.cursor.current);
  }

  private booleanLiteralParselet(): ast.Expression {
    return new ast.BooleanLiteral(this.cursor.current);
  }

  private nilLiteralParselet(): ast.Expression {
    return new ast.NilLiteral(this.cursor.current);
  }

  private VarargLiteralParselet(): ast.Expression {
    return new ast.VarargLiteral(this.cursor.current);
  }

  private commentLiteralParselet(): ast.Expression {
    return new ast.CommentLiteral(this.cursor.current);
  }

  private unaryParselet(): ast.Expression {
    const { cursor } = this;

    const operatorToken = cursor.current;

    // Skip over the operator.
    cursor.advance();

    // Get the right expression to attach to the operator.
    const rightExpression = this.parseExpression(Precedence.Unary);

    return new ast.UnaryExpression(operatorToken, rightExpression);
  }

  private groupingParselet(): ast.Expression {
    const { cursor } = this;

    const openParenthesisToken = cursor.current;

    // Skipping over the "("
    cursor.advance();

    // We gather the expression that can be found within the parenthesis.
    const expression = this.parseExpression();

    // Expecting a ")"
    if (!cursor.matchNext(TokenType.ClosedParenthesis)) {
      this.errorReporter.reportExpectedCharacter(")", cursor.next.value);
    }

    const closedParenthesisToken = cursor.current;

    cursor.advance();

    return new ast.GroupingExpression(
      openParenthesisToken,
      expression,
      closedParenthesisToken,
    );
  }

  private parseExpression(precedence = Precedence.Lowest): ast.Expression {
    const { cursor, nullDenotationParseletTable, LeftDenotationParseletTable } =
      this;

    const nullDenotationParselet =
      nullDenotationParseletTable[cursor.current.type];

    if (!nullDenotationParselet) {
      throw new Error();
    }

    let leftExpression = nullDenotationParselet();

    while (!cursor.eofToken && precedence < cursor.next.precedence) {
      cursor.advance();

      const LeftDenotationParselet =
        LeftDenotationParseletTable[cursor.current.type];

      if (!LeftDenotationParselet) {
        throw new Error();
      }

      leftExpression = LeftDenotationParselet(leftExpression);
    }

    return leftExpression;
  }

  parse(): ast.Expression {
    // We start the cursor first.
    this.cursor.advance();

    return this.parseExpression();
  }
}

export { Parser };
