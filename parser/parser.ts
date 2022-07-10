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
// - http://marvin.cs.uidaho.edu/Teaching/CS445/grammar.pdf
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
    const tokenizer = new Tokenizer(scanner, {
      contextualGoto: false,
    });
    const token_cursor = new TokenCursor(tokenizer);

    this.scanner = scanner;
    this.token_cursor = token_cursor;

    this.registerParselets();

    // We start the cursor.
    this.token_cursor.advance();
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

  private assertToken(tokenType: TokenType): Parser | never {
    if (!this.token_cursor.consume(tokenType)) {
      ParserException.raiseUnexpectedTokenError(
        this.scanner,
        this.token_cursor.current,
        this.token_cursor.next,
      );
    }

    return this;
  }

  private expect(value: string | TokenType): TokenCursor | never {
    if (this.token_cursor.match(value)) {
      return this.token_cursor;
    }

    ParserException.raiseExpectedError(
      this.scanner,
      value,
      this.token_cursor.next,
    );
  }

  private registerParselets(): Parser {
    return this
      .registerNullDenotationParselets()
      .registerLeftDenotationParselets();
  }

  // AST Node parsers.
  // -----------------------------------------------------------------------
  // Each method below will move the token cursor as necessary tokens are
  // gathered to create a particular node in the ast.
  //
  // After parsing of a node is completed, the parser method should not move
  // the token cursor any further.
  //
  // This means after an ast node has been parsed, the token cursor will be
  // located in the last token that was part of the ast node that just got parsed.
  //
  // Since I am generating an ast through recursion it is important that each
  // parser method keeps this behaviour consistent to avoid random bugs.

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
    const operatorToken = this.token_cursor.current;

    // Skip over the operator.
    this.token_cursor.advance();

    // Get the right expression to attach to the operator.
    const rightExpression = this.parseExpression(
      Precedence.getUnaryPrecedence(operatorToken),
    );

    return new ast.UnaryExpression(operatorToken, rightExpression);
  }

  private binaryParselet(leftExpression: ast.Expression): ast.Expression {
    const operatorToken = this.token_cursor.current;

    // Skip over the operator.
    this.token_cursor.advance();

    // Retrieve the right expression.
    const rightExpression = this.parseExpression(
      Precedence.getBinaryPrecedence(operatorToken),
    );

    return new ast.BinaryExpression(
      leftExpression,
      operatorToken,
      rightExpression,
    );
  }

  // NOTE: Grouping expression implicitly will have the highest precedence.
  private groupingParselet(): ast.Expression {
    // Skipping over the "("
    this.token_cursor.advance();

    // We gather the expression that can be found within the parenthesis.
    const expression = this.parseExpression();

    this.token_cursor.advance();

    this.expect(")");

    return new ast.GroupingExpression(expression);
  }

  // exp ::= (unop exp | primary | prefixexp ) { binop exp }
  // primary ::= nil | false | true | Number | String | '...' |
  //             functiondef | tableconstructor
  // prefixexp ::= (Name | '(' exp ')' ) { '[' exp ']' |
  //          '.' Name | ':' Name args | args }
  parseExpression(
    precedence: Precedence = Precedence.Lowest,
  ): ast.Expression {
    // For future me, checkout comments in the link below to refresh your memory on how pratt parsing works:
    //   - https://github.com/tanvirtin/tslox/blob/09209bc1b5025baa9cbbcfe85d03fca9360584e6/src/Parser.ts#L311
    const nullDenotationParselet =
      this.nullDenotationParseletTable[this.token_cursor.current.type];

    if (!nullDenotationParselet) {
      ParserException.raiseExpectedError(
        this.scanner,
        "<expression>",
        this.token_cursor.next,
      );
    }

    let leftExpression = nullDenotationParselet();

    // If we encounter an operator whos precedence is greater than
    // the last token's precedence, then the new operator will pull
    // the previous operator's intentended right expression as it's left.
    // This means that the last operator's right will be the expression
    // tied to the new operator with higher precedence.
    // Demonstrating what I mean for the expression: 1 + 2 * 3
    //                   AST
    //                    +
    //                  /   \
    //                 1     * <-- Operator precendece in action.
    //                      / \
    //                     2   3
    while (
      !this.token_cursor.eofToken &&
      precedence < Precedence.getPrecedence(this.token_cursor.next)
    ) {
      this.token_cursor.advance();

      const leftDenotationParselet =
        this.leftDenotationParseletTable[this.token_cursor.current.type];

      if (!leftDenotationParselet) {
        ParserException.raiseExpectedError(
          this.scanner,
          "<expression>",
          this.token_cursor.next,
        );
      }

      leftExpression = leftDenotationParselet(leftExpression);
    }

    return leftExpression;
  }

  // local ::= 'local' 'function' Name funcdecl |
  //           'local' Name {',' Name} ['=' exp {',' exp}]
  parseLocalStatement(): ast.Statement {
    this.expect("local").advance();

    const token = this.token_cursor.current;

    if (token.type === TokenType.Identifier) {
      const variables = [];
      const initializations = [];

      // Good use of the do statement. We parse identifiers, while we
      // keep encountering more identifiers we keep repeating.
      do {
        variables.push(this.identifierParselet());
        this.token_cursor.advance();
      } while (this.token_cursor.consume(","));

      // NOTE: We can have local a, b, c = 1, 2, 3 or just local a, b, c.
      if (this.token_cursor.consume("=")) {
        do {
          initializations.push(this.parseExpression());
          this.token_cursor.advance();
        } while (this.token_cursor.consume(","));
      }

      return new ast.LocalStatement(variables, initializations);
    }

    // Replicating the lua REPL error.
    ParserException.raiseExpectedError(
      this.scanner,
      "<name>",
      this.token_cursor.next,
    );
  }

  // label ::= '::' Name '::'
  parseLabelStatement(): ast.Statement {
    this.expect("::").advance();

    const name = this.identifierParselet();

    this.token_cursor.advance();

    this.expect("::").advance();

    return new ast.LabelStatement(name);
  }

  // if ::= 'if' exp 'then' block {elif} ['else' block] 'end'
  // elif ::= 'elseif' exp 'then' block
  parseIfStatement(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // retstat ::= 'return' [exp {',' exp}] [';']
  parseReturnStatement(): ast.Statement {
    const expressions: ast.Expression[] = [];

    this.expect("return").advance();

    while (!this.token_cursor.consume(";") && !this.token_cursor.eofToken) {
      const expression = this.parseExpression();

      expressions.push(expression);
      this.token_cursor.advance();

      if (!this.token_cursor.consume(",")) {
        break;
      }
    }

    this.token_cursor.consume(";");

    return new ast.ReturnStatement(expressions);
  }

  // funcdecl ::= '(' [parlist] ')' block 'end'
  // parlist ::= Name {',' Name} | [',' '...'] | '...'
  parseFunctionDeclaration(): ast.Statement {
    throw new Error("Not yet implemented");
  }

  // while ::= 'while' exp 'do' block 'end'
  parseWhileStatement(): ast.Statement {
    this.expect("while").advance();

    const condition = this.parseExpression();

    this.expect("do").advance();

    const block = this.parseBlock();

    this.expect("end");

    return new ast.WhileStatement(block, condition);
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
    this.expect("repeat").advance();

    const block = this.parseBlock();

    this.expect("until").advance();

    const condition = this.parseExpression();

    return new ast.RepeatStatement(block, condition);
  }

  // break ::= 'break' [';']
  parseBreakStatement(): ast.Statement {
    this.expect("break").advance();

    this.token_cursor.consume(";");

    return new ast.BreakStatement();
  }

  // do ::= 'do' block 'end'
  parseDoStatement(): ast.Statement {
    this.expect("goto").advance();

    const block = this.parseBlock();

    this.expect("end");

    return new ast.DoStatement(block);
  }

  // goto ::= 'goto' Name
  parseGotoStatement(): ast.Statement {
    this.expect("goto").advance();

    this.expect(TokenType.Identifier);

    const identifier = this.identifierParselet();

    return new ast.GotoStatement(identifier);
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
  parseBlock(): ast.Block {
    // A lua source file should essentially contain an array of statements.

    const statements: ast.Statement[] = [];

    // Only continue this loop if:
    //  - We don't encounter an EOF token.
    //  - And we don't encounter a block that is a follow.
    while (!this.token_cursor.eofToken && !this.token_cursor.isBlockFollow()) {
      if (this.token_cursor.current.value === "return") {
        statements.push(this.parseStatement());
        break;
      }

      const statement = this.parseStatement();

      // We ignore any random semicolons.
      this.token_cursor.consume(";");

      statements.push(statement);
    }

    return new ast.Block(statements);
  }

  // chunk ::= block
  parseChunk(): ast.Chunk {
    const block = this.parseBlock();

    // A chunk must end on an EOF token, if any other token is there
    // after we are done with parsing a chunk other than EOF it's invalid.
    this.assertToken(TokenType.EOF);

    return new ast.Chunk(block);
  }

  parse(): ast.Chunk {
    return this.parseChunk();
  }
}

export { Parser };
