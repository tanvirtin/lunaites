import {
  ast,
  ErrorReporter,
  Precedence,
  Scanner,
  Token,
  TokenCursor,
  Tokenizer,
  TokenType,
} from "./mod.ts";

// References:
// - https://www.lua.org/manual/5.4/manual.html#9

// Please refer to Backus-Naur Form

// Null denotation tokens will not contain any left expression associated with it.
type NullDenotationParselet = () => ast.Expression;
// Left denotation tokens will contain a left expression associated with it.
type LeftDenotationParselet = (
  leftExpression: ast.Expression,
) => ast.Expression;

type ParseletTable<T> = Partial<Record<TokenType, T>>;
type NullDenotationParseletTable = ParseletTable<NullDenotationParselet>;
type LeftDenotationParseletTable = ParseletTable<LeftDenotationParselet>;

// Pratt parser.
class Parser {
  private scanner: Scanner;
  private token_cursor: TokenCursor;
  private nullDenotationParseletTable: NullDenotationParseletTable = {};
  private leftDenotationParseletTable: LeftDenotationParseletTable = {};

  constructor(source: string) {
    const scanner = new Scanner(source);
    const tokenizer = new Tokenizer(scanner);
    const token_cursor = new TokenCursor(tokenizer);

    this.scanner = scanner;
    this.token_cursor = token_cursor;

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

  private registerLeftDenotationParselet(
    tokenType: TokenType,
    leftDenotationParselet: LeftDenotationParselet,
  ): Parser {
    this.leftDenotationParseletTable[tokenType] = leftDenotationParselet.bind(
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
      this.varargLiteralParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.Identifier,
      this.identifierParselet,
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
      TokenType.HashTag,
      this.unaryParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.Tilda,
      this.unaryParselet,
    );

    this.registerNullDenotationParselet(
      TokenType.Minus,
      this.unaryParselet,
    );

    return this;
  }

  private registerLeftDenotationParselets(): Parser {
    this.registerLeftDenotationParselet(
      TokenType.Plus,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Minus,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Star,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Divide,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.DoubleDivide,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.And,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Or,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.GreaterThan,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.LessThan,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.GreaterThanEqual,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.LessThanEqual,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.DoubleEqual,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.TildaEqual,
      this.binaryParselet,
    );

    ///////// Bitwise operators ////////
    this.registerLeftDenotationParselet(
      TokenType.Pipe,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Tilda,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Ampersand,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.DoubleGreaterThan,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.DoubleLessThan,
      this.binaryParselet,
    );

    this.registerLeftDenotationParselet(
      TokenType.Carrot,
      this.binaryParselet,
    );
    ////////////////////////////////////

    this.registerLeftDenotationParselet(
      TokenType.DoubleDot,
      this.binaryParselet,
    );

    return this;
  }

  private reportUnexpectedToken(expected: string, near: string): never {
    ErrorReporter.report(this.scanner, "%s expected near '%s'", expected, near);
  }

  private expect(
    value: string | TokenType,
    expected?: string,
    near?: string,
  ): void | never {
    if (this.token_cursor.consume(value)) {
      return;
    }

    this.reportUnexpectedToken(
      expected ?? value,
      near ?? this.token_cursor.next.value,
    );
  }

  private expectNext(
    value: string | TokenType,
    expected?: string,
    near?: string,
  ): void | never {
    if (this.token_cursor.consumeNext(value)) {
      return;
    }

    this.reportUnexpectedToken(
      expected ?? value,
      near ?? this.token_cursor.next.value,
    );
  }

  private registerParselets(): Parser {
    return this
      .registerNullDenotationParselets()
      .registerLeftDenotationParselets();
  }

  private identifierParselet(): ast.Identifier {
    return new ast.Identifier(this.token_cursor.current);
  }

  private numericLiteralParselet(): ast.Expression {
    return new ast.NumericLiteral(this.token_cursor.current);
  }

  private stringLiteralParselet(): ast.Expression {
    return new ast.StringLiteral(this.token_cursor.current);
  }

  private booleanLiteralParselet(): ast.Expression {
    return new ast.BooleanLiteral(this.token_cursor.current);
  }

  private nilLiteralParselet(): ast.Expression {
    return new ast.NilLiteral(this.token_cursor.current);
  }

  private varargLiteralParselet(): ast.Expression {
    return new ast.VarargLiteral(this.token_cursor.current);
  }

  private commentLiteralParselet(): ast.Expression {
    return new ast.CommentLiteral(this.token_cursor.current);
  }

  private unaryParselet(): ast.Expression {
    const { token_cursor } = this;

    const operatorToken = token_cursor.current;

    // Skip over the operator.
    token_cursor.advance();

    // Get the right expression to attach to the operator.
    const rightExpression = this.parseExpression(Precedence.Unary);

    return new ast.UnaryExpression(operatorToken, rightExpression);
  }

  private binaryParselet(leftExpression: ast.Expression): ast.Expression {
    const { token_cursor } = this;

    const operatorToken = token_cursor.current;

    // Skip over the operator.
    token_cursor.advance();

    // Retrieve the right expression.
    const rightExpression = this.parseExpression(operatorToken.precedence);

    return new ast.BinaryExpression(
      leftExpression,
      operatorToken,
      rightExpression,
    );
  }

  private groupingParselet(): ast.Expression {
    const { token_cursor } = this;

    const openParenthesisToken = token_cursor.current;

    // Skipping over the "("
    token_cursor.advance();

    // We gather the expression that can be found within the parenthesis.
    const expression = this.parseExpression(Precedence.Lowest);

    this.expectNext(")");

    const closedParenthesisToken = token_cursor.current;

    token_cursor.advance();

    return new ast.GroupingExpression(
      openParenthesisToken,
      expression,
      closedParenthesisToken,
    );
  }

  // Main powerhouse for parsing expressions.
  private parseExpression(precedence: Precedence): ast.Expression {
    const {
      token_cursor,
      nullDenotationParseletTable,
      leftDenotationParseletTable,
    } = this;

    const nullDenotationParselet =
      nullDenotationParseletTable[token_cursor.current.type];

    if (!nullDenotationParselet) {
      throw ErrorReporter.createError(
        this.scanner,
        "No null denotation parselet registered for %s",
        token_cursor.current.value,
      );
    }

    let leftExpression = nullDenotationParselet();

    while (
      !token_cursor.eofToken && precedence < token_cursor.next.precedence
    ) {
      token_cursor.advance();

      const leftDenotationParselet =
        leftDenotationParseletTable[token_cursor.current.type];

      if (!leftDenotationParselet) {
        throw ErrorReporter.createError(
          this.scanner,
          "No left denotation parselet registered for %s",
          token_cursor.current.value,
        );
      }

      leftExpression = leftDenotationParselet(leftExpression);
    }

    return leftExpression;
  }

  // local ::= `local` `function` <name> <function declration> |
  //           `local` <name> {',' <name>} [ `=` <expression> {`,` <expression>} ]
  parseLocalStatement(): ast.Statement {
    const { token_cursor } = this;

    this.expect("local");

    const token = token_cursor.current;

    if (token.type === TokenType.Identifier) {
      const variables = [];
      const initializations = [];

      // Good use of the do statement. We parse identifiers, while we
      // keep encountering more identifiers we keep repeating.
      do {
        variables.push(this.identifierParselet());
        token_cursor.advance();
      } while (token_cursor.consume(","));

      // NOTE: We can have local a, b, c = 1, 2, 3 or just local a, b, c.
      if (token_cursor.consume("=")) {
        do {
          initializations.push(this.parseExpression(Precedence.Lowest));
          token_cursor.advance();
        } while (token_cursor.consume(","));
      }

      return new ast.LocalStatement(variables, initializations);
    }

    // Replicating the lua REPL error.
    this.reportUnexpectedToken("<name>", token_cursor.next.value);
  }

  parseLabelStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseIfStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseReturnStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseFunctionDeclaration(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseWhileStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseForStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseRepeatStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseBreakStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseDoStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseGotoStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  parseAssignmentOrCallStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // There are two types of statements, simple and compound (connected via and/or, etc).
  // <statement> ::= `break` | `goto` | `do` | `while` | `repeat` | `return` | `if` | `for` | `function` |
  //               `local` | `label` | `assignment` | functioncall | ;
  parseStatement(): ast.Statement {
    const token = this.token_cursor.current;

    switch (token.value) {
      case "break":
        return this.parseBreakStatement();
      case "goto":
        return this.parseGotoStatement();
      case "do":
        return this.parseDoStatement();
      case "while":
        return this.parseWhileStatement();
      case "repeat":
        return this.parseRepeatStatement();
      case "return":
        return this.parseReturnStatement();
      case "if":
        return this.parseIfStatement();
      case "for":
        return this.parseForStatement();
      case "function":
        return this.parseFunctionDeclaration();
      case "local":
        return this.parseLocalStatement();
      case "::":
        return this.parseLabelStatement();
      default:
        return this.parseAssignmentOrCallStatement();
    }
  }

  isBlockFollow(token: Token): boolean {
    if (token.type === TokenType.EOF) {
      return true;
    }

    if (token.type !== TokenType.Keyword) {
      return false;
    }

    switch (token.value) {
      case "else":
        return true;
      case "elseif":
        return true;
      case "end":
        return true;
      case "until":
        return true;
      default:
        return false;
    }
  }

  parseChunk(): ast.Chunk {
    const { token_cursor } = this;
    const statements: ast.Statement[] = [];

    while (!this.isBlockFollow(token_cursor.current)) {
      if (token_cursor.current.value === "return") {
        statements.push(this.parseStatement());
        break;
      }

      const statement = this.parseStatement();

      // We ignore any random semicolons.
      token_cursor.consume(TokenType.SemiColon);

      statements.push(statement);
    }

    return new ast.Chunk(statements);
  }

  parse(): ast.Chunk {
    // We start the cursor first.
    this.token_cursor.advance();

    return this.parseChunk();
  }
}

export { Parser };
