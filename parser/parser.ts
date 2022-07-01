import {
  ast,
  ParserException,
  Precedence,
  Scanner,
  TokenCursor,
  Tokenizer,
  TokenType,
} from "./mod.ts";

// Prerequisites: Backus-Naur Form
// References:
// - https://www.lua.org/manual/5.4/manual.html#9
// - https://craftinginterpreters.com/

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

  private expect(
    value: string | TokenType,
    expected?: string,
    near?: string,
  ): void | never {
    if (this.token_cursor.consume(value)) {
      return;
    }

    ParserException.raiseExpectedToken(
      this.scanner,
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

    ParserException.raiseExpectedToken(
      this.scanner,
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

  // exp ::= (unop exp | primary | prefixexp ) { binop exp }
  // primary ::= nil | false | true | Number | String | '...' |
  //             functiondef | tableconstructor
  // prefixexp ::= (Name | '(' exp ')' ) { '[' exp ']' |
  //          '.' Name | ':' Name args | args }
  private parseExpression(precedence: Precedence): ast.Expression {
    const {
      scanner,
      token_cursor,
      nullDenotationParseletTable,
      leftDenotationParseletTable,
    } = this;

    const nullDenotationParselet =
      nullDenotationParseletTable[token_cursor.current.type];

    if (!nullDenotationParselet) {
      ParserException.raiseExpectedToken(
        scanner,
        "<expression>",
        token_cursor.next.value,
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
        ParserException.raiseExpectedToken(
          scanner,
          "<expression>",
          token_cursor.next.value,
        );
      }

      leftExpression = leftDenotationParselet(leftExpression);
    }

    return leftExpression;
  }

  // local ::= 'local' 'function' Name funcdecl |
  //           'local' Name {',' Name} ['=' exp {',' exp}]
  parseLocalStatement(): ast.Statement {
    const { scanner, token_cursor } = this;

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
    ParserException.raiseExpectedToken(
      scanner,
      "<name>",
      token_cursor.next.value,
    );
  }

  // label ::= '::' Name '::'
  parseLabelStatement(): ast.Statement {
    this.expect("::");

    const name = this.identifierParselet();

    this.expectNext("::");

    return new ast.LabelStatement(name);
  }

  // if ::= 'if' exp 'then' block {elif} ['else' block] 'end'
  // elif ::= 'elseif' exp 'then' block
  parseIfStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // retstat ::= 'return' [exp {',' exp}] [';']
  parseReturnStatement(): ast.Statement {
    const { token_cursor } = this;
    const expressions: ast.Expression[] = [];

    token_cursor.advance();

    if (!token_cursor.eofToken) {
      do {
        expressions.push(this.parseExpression(Precedence.Lowest));
        token_cursor.advance();
      } while (token_cursor.consume(","));
    }

    token_cursor.consume(";");

    return new ast.ReturnStatement(expressions);
  }

  // funcdecl ::= '(' [parlist] ')' block 'end'
  // parlist ::= Name {',' Name} | [',' '...'] | '...'
  parseFunctionDeclaration(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // while ::= 'while' exp 'do' block 'end'
  parseWhileStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // for ::= Name '=' exp ',' exp [',' exp] 'do' block 'end'
  // for ::= namelist 'in' explist 'do' block 'end'
  // namelist ::= Name {',' Name}
  // explist ::= exp {',' exp}
  parseForStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // repeat ::= 'repeat' block 'until' exp
  parseRepeatStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // break ::= 'break'
  parseBreakStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // do ::= 'do' block 'end'
  parseDoStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // goto ::= 'goto' Name
  parseGotoStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // assignment ::= varlist '=' explist
  // var ::= Name | prefixexp '[' exp ']' | prefixexp '.' Name
  // varlist ::= var {',' var}
  // explist ::= exp {',' exp}
  // call ::= callexp
  // callexp ::= prefixexp args | prefixexp ':' Name args
  parseAssignmentOrCallStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // statement ::= break | goto | do | while | repeat | return |
  //               if | for | function | local | label | assignment |
  //               functioncall | ';'
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

  // block ::= {stat} [retstat]
  parseBlock() {
    // A lua source file should essentially contain an array of statements.

    const { token_cursor } = this;
    const statements: ast.Statement[] = [];

    // Only continue this loop if:
    //  - We don't encounter an EOF token.
    //  - And we don't encounter a block that is a follow.
    while (!token_cursor.eofToken && !token_cursor.isBlockFollow()) {
      if (token_cursor.current.value === "return") {
        statements.push(this.parseStatement());
        break;
      }

      const statement = this.parseStatement();

      // We ignore any random semicolons.
      token_cursor.consume(";");

      statements.push(statement);
    }

    return new ast.Block(statements);
  }

  // chunk ::= block
  parseChunk(): ast.Chunk {
    const { scanner, token_cursor } = this;
    const block = this.parseBlock();

    // A chunk must end on an EOF token, if any other token is there
    // after we are done with parsing a chunk other than EOF it's invalid.
    if (!this.token_cursor.match(TokenType.EOF)) {
      ParserException.raiseUnexpectedToken(
        scanner,
        token_cursor.current,
        token_cursor.next.value,
      );
    }

    return new ast.Chunk(block);
  }

  parse(): ast.Chunk {
    // We start the cursor first.
    this.token_cursor.advance();

    return this.parseChunk();
  }
}

export { Parser };
