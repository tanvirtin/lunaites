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
type NullDenotationExpressionParselet = () => ast.Expression;
// Left denotation tokens will contain a left expression associated with it.
type LeftDenotationExpressionParselet = (
  leftExpression: ast.Expression,
) => ast.Expression;

type ExpressionParseletTable<T> = Partial<Record<TokenType, T>>;
type NullDenotationExpressionParseletTable = ExpressionParseletTable<
  NullDenotationExpressionParselet
>;
type LeftDenotationExpressionParseletTable = ExpressionParseletTable<
  LeftDenotationExpressionParselet
>;

// Pratt parser.
class Parser {
  private scanner: Scanner;
  private tokenCursor: TokenCursor;
  private nullDenotationExpressionParseletTable:
    NullDenotationExpressionParseletTable = {};
  private leftDenotationExpressionParseletTable:
    LeftDenotationExpressionParseletTable = {};

  constructor(source: string) {
    const scanner = new Scanner(source);
    const tokenizer = new Tokenizer(scanner, {
      contextualGoto: false,
    });
    const tokenCursor = new TokenCursor(tokenizer);

    this.scanner = scanner;
    this.tokenCursor = tokenCursor;

    this.registerExpressionParselets();

    // We start the cursor.
    this.tokenCursor.advance();
  }

  private registerNullDenotationExpressionParselet(
    tokenType: TokenType,
    nullDenotationExpressionParselet: NullDenotationExpressionParselet,
  ): Parser {
    this.nullDenotationExpressionParseletTable[tokenType] =
      nullDenotationExpressionParselet.bind(
        this,
      );

    return this;
  }

  private registerLeftDenotationExpressionParselet(
    tokenType: TokenType,
    leftDenotationExpressionParselet: LeftDenotationExpressionParselet,
  ): Parser {
    this.leftDenotationExpressionParseletTable[tokenType] =
      leftDenotationExpressionParselet.bind(
        this,
      );

    return this;
  }

  private registerNullDenotationExpressionParselets(): Parser {
    this.registerNullDenotationExpressionParselet(
      TokenType.NumericLiteral,
      this.parseNumericLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.StringLiteral,
      this.parseStringLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.BooleanLiteral,
      this.parseBooleanLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.NilLiteral,
      this.parseNilLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.VarargLiteral,
      this.parseVarargLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.Identifier,
      this.parseIdentifierExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.CommentLiteral,
      this.parseCommentLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.OpenParenthesis,
      this.parseGroupingExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.Not,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.HashTag,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.Tilda,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.Minus,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      TokenType.Function,
      this.parseFunctionExpression,
    );

    // @@@ TODO: Add missing parselets for the following:
    // - '[' exp ']' | '.' Name | ':' Name args | args

    return this;
  }

  private registerLeftDenotationExpressionParselets(): Parser {
    this.registerLeftDenotationExpressionParselet(
      TokenType.Plus,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Minus,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Star,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Divide,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.DoubleDivide,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.And,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Or,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.GreaterThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.LessThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.GreaterThanEqual,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.LessThanEqual,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.DoubleEqual,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.TildaEqual,
      this.parseBinaryExpression,
    );

    ///////// Bitwise operators ////////
    this.registerLeftDenotationExpressionParselet(
      TokenType.Pipe,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Tilda,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Ampersand,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.DoubleGreaterThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.DoubleLessThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TokenType.Carrot,
      this.parseBinaryExpression,
    );
    ////////////////////////////////////

    this.registerLeftDenotationExpressionParselet(
      TokenType.DoubleDot,
      this.parseBinaryExpression,
    );

    return this;
  }

  private assertToken(tokenType: TokenType): Parser | never {
    if (!this.tokenCursor.consume(tokenType)) {
      ParserException.raiseUnexpectedTokenError(
        this.scanner,
        this.tokenCursor.current,
        this.tokenCursor.next,
      );
    }

    return this;
  }

  private expect(value: string | TokenType): TokenCursor | never {
    if (this.tokenCursor.match(value)) {
      return this.tokenCursor;
    }

    ParserException.raiseExpectedError(
      this.scanner,
      value,
      this.tokenCursor.next,
    );
  }

  private registerExpressionParselets(): Parser {
    return this
      .registerNullDenotationExpressionParselets()
      .registerLeftDenotationExpressionParselets();
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

  //////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Expressions //////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  private parseIdentifierExpression(): ast.Identifier {
    this.expect(TokenType.Identifier);

    return new ast.Identifier(this.tokenCursor.current);
  }

  private parseNumericLiteralExpression(): ast.Expression {
    this.expect(TokenType.NumericLiteral);

    return new ast.NumericLiteral(this.tokenCursor.current);
  }

  private parseStringLiteralExpression(): ast.Expression {
    this.expect(TokenType.StringLiteral);

    return new ast.StringLiteral(this.tokenCursor.current);
  }

  private parseBooleanLiteralExpression(): ast.Expression {
    this.expect(TokenType.BooleanLiteral);

    return new ast.BooleanLiteral(this.tokenCursor.current);
  }

  private parseNilLiteralExpression(): ast.Expression {
    this.expect(TokenType.NilLiteral);

    return new ast.NilLiteral(this.tokenCursor.current);
  }

  private parseVarargLiteralExpression(): ast.Expression {
    this.expect(TokenType.VarargLiteral);

    return new ast.VarargLiteral(this.tokenCursor.current);
  }

  private parseCommentLiteralExpression(): ast.Expression {
    this.expect(TokenType.CommentLiteral);

    return new ast.CommentLiteral(this.tokenCursor.current);
  }

  // @@@ TODO: Add bnf notation
  private parseFunctionExpression(): ast.Expression {
    this.expect("function").advance();

    this.expect("(").advance();

    const argList: ast.Expression[] = [];

    if (this.tokenCursor.match(TokenType.VarargLiteral)) {
      argList.push(this.parseVarargLiteralExpression());
    } else if (this.tokenCursor.match(TokenType.Identifier)) {
      argList.push(this.parseExpression());

      while (this.tokenCursor.consumeNext(",")) {
        if (this.tokenCursor.match(TokenType.VarargLiteral)) {
          argList.push(this.parseVarargLiteralExpression());
          break;
        }

        argList.push(this.parseExpression());
      }

      this.tokenCursor.advance();
    }

    this.expect(")").advance();

    const block = this.parseBlock();

    this.expect("end");

    return new ast.FunctionExpression(argList, block);
  }

  private parseUnaryExpression(): ast.Expression {
    const operatorToken = this.tokenCursor.current;

    // Skip over the operator.
    this.tokenCursor.advance();

    // Get the right expression to attach to the operator.
    const rightExpression = this.parseExpression(
      Precedence.getUnaryPrecedence(operatorToken),
    );

    return new ast.UnaryExpression(operatorToken, rightExpression);
  }

  private parseBinaryExpression(
    leftExpression: ast.Expression,
  ): ast.Expression {
    const operatorToken = this.tokenCursor.current;

    // Skip over the operator.
    this.tokenCursor.advance();

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
  private parseGroupingExpression(): ast.Expression {
    // Skipping over the "("
    this.tokenCursor.advance();

    // We gather the expression that can be found within the parenthesis.
    const expression = this.parseExpression();

    // Skip over the last token that the expression ended on.
    this.tokenCursor.advance();

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
    const nullDenotationExpressionParselet =
      this.nullDenotationExpressionParseletTable[this.tokenCursor.current.type];

    if (!nullDenotationExpressionParselet) {
      ParserException.raiseExpectedError(
        this.scanner,
        "<expression>",
        this.tokenCursor.next,
      );
    }

    let leftExpression = nullDenotationExpressionParselet();

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
      !this.tokenCursor.eofToken &&
      precedence < Precedence.getPrecedence(this.tokenCursor.next)
    ) {
      this.tokenCursor.advance();

      const leftDenotationExpressionParselet = this
        .leftDenotationExpressionParseletTable[this.tokenCursor.current.type];

      if (!leftDenotationExpressionParselet) {
        ParserException.raiseExpectedError(
          this.scanner,
          "<expression>",
          this.tokenCursor.next,
        );
      }

      leftExpression = leftDenotationExpressionParselet(leftExpression);
    }

    return leftExpression;
  }

  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Statements //////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  // local ::= 'local' 'function' Name funcdecl |
  //           'local' Name {',' Name} ['=' exp {',' exp}]
  parseLocalStatement(): ast.Statement {
    this.expect("local").advance();

    if (this.tokenCursor.match(TokenType.Identifier)) {
      const variables = [];
      const initializations = [];

      variables.push(this.parseIdentifierExpression());

      // keep encountering more identifiers we keep repeating.
      while (this.tokenCursor.consumeNext(",")) {
        variables.push(this.parseIdentifierExpression());
      }

      // NOTE: We can have local a, b, c = 1, 2, 3 or just local a, b, c.
      if (this.tokenCursor.consumeNext("=")) {
        initializations.push(this.parseExpression());

        while (this.tokenCursor.consumeNext(",")) {
          initializations.push(this.parseExpression());
        }
      }

      return new ast.LocalStatement(variables, initializations);
    }

    if (this.tokenCursor.match("function")) {
      return this.parseFunctionStatement(true);
    }

    // Replicating the lua REPL error.
    ParserException.raiseExpectedError(
      this.scanner,
      "<name>",
      this.tokenCursor.next,
    );
  }

  // label ::= '::' Name '::'
  parseLabelStatement(): ast.Statement {
    this.expect("::").advance();

    const name = this.parseIdentifierExpression();

    // We advance over identifier token.
    this.tokenCursor.advance();

    this.expect("::");

    return new ast.LabelStatement(name);
  }

  // if ::= 'if' exp 'then' block {elseif} ['else' block] 'end'
  // elseif ::= 'elseif' exp 'then' block
  parseIfStatement(): ast.Statement {
    this.expect("if").advance();

    const ifCondition = this.parseExpression();

    this.tokenCursor.advance();

    this.expect("then").advance();

    const ifBlock = this.parseBlock();
    const elifBlocks: ast.Block[] = [];
    const elifConditions: ast.Expression[] = [];

    while (this.tokenCursor.consume("elseif")) {
      elifConditions.push(this.parseExpression());
      this.tokenCursor.advance();

      this.tokenCursor.advance();

      elifBlocks.push(this.parseBlock());
    }

    let elseBlock: ast.Block | null = null;

    if (this.tokenCursor.consume("else")) {
      elseBlock = this.parseBlock();
    }

    this.expect("end");

    return new ast.IfStatement(
      ifCondition,
      ifBlock,
      elifConditions,
      elifBlocks,
      elseBlock,
    );
  }

  // retstat ::= 'return' [exp {',' exp}] [';']
  parseReturnStatement(): ast.Statement {
    const expressions: ast.Expression[] = [];

    this.expect("return").advance();

    if (this.tokenCursor.consume(";") || this.tokenCursor.eofToken) {
      return new ast.ReturnStatement(expressions);
    }

    expressions.push(this.parseExpression());

    while (
      this.tokenCursor.consumeNext(",") &&
      !this.tokenCursor.consumeNext(";")
    ) {
      expressions.push(this.parseExpression());
    }

    return new ast.ReturnStatement(expressions);
  }

  // funcdecl ::= {Name} '(' [parlist] ')' block 'end'
  // parlist ::= Name {',' Name} | [',' '...'] | '...'
  parseFunctionStatement(isLocal: boolean): ast.Statement {
    this.expect("function").advance();

    let identifier: ast.Identifier | null = null;

    if (this.tokenCursor.match(TokenType.Identifier)) {
      identifier = this.parseIdentifierExpression();
      this.tokenCursor.advance();
    }

    this.expect("(").advance();

    const argList: ast.Expression[] = [];

    if (this.tokenCursor.match(TokenType.VarargLiteral)) {
      argList.push(this.parseVarargLiteralExpression());
    } else if (this.tokenCursor.match(TokenType.Identifier)) {
      argList.push(this.parseIdentifierExpression());

      while (this.tokenCursor.consumeNext(",")) {
        if (this.tokenCursor.match(TokenType.VarargLiteral)) {
          argList.push(this.parseVarargLiteralExpression());
          break;
        }

        argList.push(this.parseIdentifierExpression());
      }

      this.tokenCursor.advance();
    }

    this.expect(")").advance();

    const block = this.parseBlock();

    this.expect("end");

    return new ast.FunctionStatement(isLocal, argList, block, identifier);
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
    this.expect("for").advance();

    this.expect(TokenType.Identifier);

    const variable = this.parseIdentifierExpression();

    // Parse for generic statement
    if (this.tokenCursor.matchNext(",")) {
      const variables: ast.Identifier[] = [variable];

      while (
        !this.tokenCursor.consumeNext("in") && this.tokenCursor.consumeNext(",")
      ) {
        variables.push(this.parseIdentifierExpression());
      }

      const iterators: ast.Expression[] = [this.parseExpression()];

      while (this.tokenCursor.consumeNext(",")) {
        iterators.push(this.parseExpression());
      }

      this.tokenCursor.advance();

      this.expect("do").advance();

      const block = this.parseBlock();

      this.expect("end");

      return new ast.ForGenericStatement(variables, iterators, block);
    }

    this.tokenCursor.advance();

    this.expect("=").advance();

    const start = this.parseExpression();

    this.tokenCursor.advance();

    this.expect(",").advance();

    const end = this.parseExpression();

    let step;
    // Rule obligation: We are at the last token parseExpression ended on,
    // so we have to consumeNext not consume.
    if (this.tokenCursor.consumeNext(",")) {
      step = this.parseExpression();
    }

    this.tokenCursor.advance();

    this.expect("do").advance();

    const block = this.parseBlock();

    this.expect("end");

    return new ast.ForNumericStatement(variable, start, end, step, block);
  }

  // repeat ::= 'repeat' block 'until' exp
  parseRepeatStatement(): ast.Statement {
    this.expect("repeat").advance();

    const block = this.parseBlock();

    this.expect("until").advance();

    const condition = this.parseExpression();

    return new ast.RepeatStatement(block, condition);
  }

  // break ::= 'break'
  parseBreakStatement(): ast.Statement {
    this.expect("break");

    return new ast.BreakStatement();
  }

  // do ::= 'do' block 'end'
  parseDoStatement(): ast.Statement {
    this.expect("do").advance();

    const block = this.parseBlock();

    this.expect("end");

    return new ast.DoStatement(block);
  }

  // goto ::= 'goto' Name
  parseGotoStatement(): ast.Statement {
    this.expect("goto").advance();

    this.expect(TokenType.Identifier);

    const identifier = this.parseIdentifierExpression();

    return new ast.GotoStatement(identifier);
  }

  // assignment ::= varlist '=' explist
  // var ::= Name | prefixexp '[' exp ']' | prefixexp '.' Name
  // varlist ::= var {',' var}
  // explist ::= exp {',' exp}
  // prefixexp ::= var | functioncall | ‘(’ exp ‘)’
  parseAssignmentStatement(): ast.Statement {
    throw new Error("assignment statement parser not yet implemented");
  }

  // call ::= callexp
  // callexp ::= prefixexp args | prefixexp ':' Name args
  // args ::=  ‘(’ [explist] ‘)’ | tableconstructor | LiteralString
  parseCallStatement(): ast.Statement {
    throw new Error("call statement parser not yet implemented");
  }

  // stat ::=  ‘;’ |
  //         varlist ‘=’ explist |
  //         local function Name funcbody |
  //         local namelist [‘=’ explist]
  //         function funcname funcbody |
  //         label |
  //         break |
  //         goto Name |
  //         do block end |
  //         while exp do block end |
  //         repeat block until exp |
  //         if exp then block {elseif exp then block} [else block] end |
  //         for Name ‘=’ exp ‘,’ exp [‘,’ exp] do block end |
  //         for namelist in explist do block end |
  //         functioncall |
  parseStatement(): ast.Statement | null {
    const token = this.tokenCursor.current;

    switch (token.type) {
      // @@ TODO: For a true lossless parser,
      // I need to take this into consideration in the future.
      case TokenType.SemiColon:
        return null;
      case TokenType.Local:
        return this.parseLocalStatement();
      case TokenType.Function:
        return this.parseFunctionStatement(false);
      case TokenType.DoubleColon:
        return this.parseLabelStatement();
      case TokenType.Break:
        return this.parseBreakStatement();
      case TokenType.Goto:
        return this.parseGotoStatement();
      case TokenType.Do:
        return this.parseDoStatement();
      case TokenType.While:
        return this.parseWhileStatement();
      case TokenType.Repeat:
        return this.parseRepeatStatement();
      case TokenType.Return:
        return this.parseReturnStatement();
      case TokenType.If:
        return this.parseIfStatement();
      case TokenType.For:
        return this.parseForStatement();
      default:
        if (!this.tokenCursor.match(TokenType.Identifier)) {
          ParserException.raiseUnexpectedTokenError(
            this.scanner,
            this.tokenCursor.current,
            this.tokenCursor.next,
          );
        }

        if (this.tokenCursor.multiMatchNext("=", ",")) {
          return this.parseAssignmentStatement();
        }

        if (this.tokenCursor.multiMatchNext("(", "[", ".", ":", "(", "{")) {
          return this.parseCallStatement();
        }

        ParserException.raiseExpectedError(
          this.scanner,
          "=",
          this.tokenCursor.next,
        );
    }
  }

  // block ::= {stat} [retstat]
  parseBlock(): ast.Block {
    // A lua source file should essentially contain an array of statements.

    const statements: ast.Statement[] = [];

    // After a statement has been consumed we advance the cursor.
    // NOTE: Neither expression or statement parser methods should not advance
    //       the token cursor any more than they should.

    // Only continue this loop if:
    //  - We don't encounter an EOF token.
    //  - And we don't encounter a block that is a follow.
    while (!this.tokenCursor.eofToken && !this.tokenCursor.isBlockFollow()) {
      if (this.tokenCursor.current.value === TokenType.Return) {
        const statement = this.parseStatement();

        if (statement) {
          statements.push(statement);
        }

        this.tokenCursor.advance();
        this.tokenCursor.consume(";");

        break;
      }

      const statement = this.parseStatement();

      if (statement) {
        statements.push(statement);
      }

      this.tokenCursor.advance();
      this.tokenCursor.consume(";");
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
