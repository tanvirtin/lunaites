import {
  ast,
  ParserException,
  Precedence,
  Scanner,
  TokenCursor,
  Tokenizer,
  TokenType,
} from "./mod.ts";

const {
  Not,
  Do,
  Identifier,
  OpenBrace,
  EOF,
  NilLiteral,
  BooleanLiteral,
  StringLiteral,
  CommentLiteral,
  NumericLiteral,
  Or,
  And,
  VarargLiteral,
  DoubleColon,
  Star,
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
  LessThanEqual,
  OpenParenthesis,
  Pipe,
  Plus,
  Minus,
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
      NumericLiteral,
      this.parseNumericLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      StringLiteral,
      this.parseStringLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      BooleanLiteral,
      this.parseBooleanLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      NilLiteral,
      this.parseNilLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      VarargLiteral,
      this.parseVarargLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      Identifier,
      this.parseIdentifierExpression,
    );

    this.registerNullDenotationExpressionParselet(
      CommentLiteral,
      this.parseCommentLiteralExpression,
    );

    this.registerNullDenotationExpressionParselet(
      OpenParenthesis,
      this.parseGroupingExpression,
    );

    this.registerNullDenotationExpressionParselet(
      Not,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      HashTag,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      Tilda,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      Minus,
      this.parseUnaryExpression,
    );

    this.registerNullDenotationExpressionParselet(
      Function,
      this.parseFunctionExpression,
    );

    this.registerNullDenotationExpressionParselet(
      OpenBrace,
      this.parseTableConstructor,
    );

    return this;
  }

  private registerLeftDenotationExpressionParselets(): Parser {
    this.registerLeftDenotationExpressionParselet(
      Plus,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Minus,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Star,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Divide,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      DoubleDivide,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      And,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Or,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      GreaterThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      LessThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      GreaterThanEqual,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      LessThanEqual,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      DoubleEqual,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      TildaEqual,
      this.parseBinaryExpression,
    );

    ///////// Bitwise operators ////////
    this.registerLeftDenotationExpressionParselet(
      Pipe,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Tilda,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Ampersand,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      DoubleGreaterThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      DoubleLessThan,
      this.parseBinaryExpression,
    );

    this.registerLeftDenotationExpressionParselet(
      Carrot,
      this.parseBinaryExpression,
    );
    ////////////////////////////////////

    this.registerLeftDenotationExpressionParselet(
      DoubleDot,
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
    this.expect(Identifier);

    return new ast.Identifier(this.tokenCursor.current);
  }

  private parseNumericLiteralExpression(): ast.Expression {
    this.expect(NumericLiteral);

    return new ast.NumericLiteral(this.tokenCursor.current);
  }

  private parseStringLiteralExpression(): ast.Expression {
    this.expect(StringLiteral);

    return new ast.StringLiteral(this.tokenCursor.current);
  }

  private parseBooleanLiteralExpression(): ast.Expression {
    this.expect(BooleanLiteral);

    return new ast.BooleanLiteral(this.tokenCursor.current);
  }

  private parseNilLiteralExpression(): ast.Expression {
    this.expect(NilLiteral);

    return new ast.NilLiteral(this.tokenCursor.current);
  }

  private parseVarargLiteralExpression(): ast.Expression {
    this.expect(VarargLiteral);

    return new ast.VarargLiteral(this.tokenCursor.current);
  }

  private parseCommentLiteralExpression(): ast.Expression {
    this.expect(CommentLiteral);

    return new ast.CommentLiteral(this.tokenCursor.current);
  }

  private parseFunctionExpression(): ast.Expression {
    this.expect(Function).advance();

    const [parlist, block] = this.parseFuncbody();

    return new ast.FunctionExpression(parlist, block);
  }

  // tableconstructor ::= ‘{’ [fieldlist] ‘}’
  private parseTableConstructor(): ast.Expression {
    this.expect("{").advance();

    const fieldlist = this.parseFieldlist();

    this.tokenCursor.advance();

    this.expect("}");

    return new ast.TableConstructor(fieldlist);
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
  ////////////////////////////// Utility /////////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  // field ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
  parseField(): ast.Expression {
    if (this.tokenCursor.match("[")) {
      this.tokenCursor.advance();

      const key = this.parseExpression();

      this.tokenCursor.advance();

      this.expect("]").advance();

      this.expect("=").advance();

      const value = this.parseExpression();

      return new ast.TableKey(key, value);
    }

    if (this.tokenCursor.match(Identifier)) {
      const key = this.parseIdentifierExpression();

      this.tokenCursor.advance();

      this.expect("=").advance();

      const value = this.parseExpression();

      return new ast.TableKeyString(key, value);
    }

    const value = this.parseExpression();

    return new ast.TableValue(value);
  }

  // fieldlist ::= field {fieldsep field} [fieldsep]
  parseFieldlist(): ast.Expression[] {
    const fieldList = [this.parseField()];

    while (this.tokenCursor.someMatchNext(",", ";")) {
      // Move to the either matched "," or ";"
      this.tokenCursor.advance();

      // However if we encounter "}" we have a dangling "," or ";"
      if (this.tokenCursor.matchNext("}")) {
        break;
      }

      // We skip over "," or ";"
      this.tokenCursor.advance();

      fieldList.push(this.parseField());
    }

    return fieldList;
  }

  // varlist ::= var {‘,’ var}
  parseVarlist(): ast.Identifier[] {
    const varlist = [this.parseIdentifierExpression()];

    while (this.tokenCursor.consumeNext(",")) {
      varlist.push(this.parseIdentifierExpression());
    }

    return varlist;
  }

  // explist ::= exp {‘,’ exp}
  parseExplist(): ast.Expression[] {
    const expressions = [this.parseExpression()];

    while (this.tokenCursor.consumeNext(",")) {
      expressions.push(this.parseExpression());
    }

    return expressions;
  }

  // namelist ::= Name {‘,’ Name}
  parseNamelist(): ast.Identifier[] {
    const namelist = [this.parseIdentifierExpression()];

    while (this.tokenCursor.consumeNext(",")) {
      namelist.push(this.parseIdentifierExpression());
    }

    return namelist;
  }

  // funcname ::= Name {‘.’ Name} [‘:’ Name]
  parseFuncname(): ast.Identifier | ast.MemberExpression {
    this.expect(Identifier);

    const base = this.parseIdentifierExpression();

    if (this.tokenCursor.someMatchNext(".", ":")) {
      this.tokenCursor.advance();

      const indexerToken = this.tokenCursor.current;

      this.tokenCursor.advance();

      const identifier = this.parseIdentifierExpression();

      return new ast.MemberExpression(base, indexerToken.value, identifier);
    }

    return base;
  }

  // parlist ::= namelist [‘,’ ‘...’] | ‘...’
  parseParlist(): ast.Expression[] {
    this.expect("(").advance();

    const parlist = [];

    if (this.tokenCursor.match(VarargLiteral)) {
      parlist.push(this.parseVarargLiteralExpression());
    } else if (this.tokenCursor.match(Identifier)) {
      parlist.push(this.parseIdentifierExpression());

      while (this.tokenCursor.consumeNext(",")) {
        if (this.tokenCursor.match(VarargLiteral)) {
          parlist.push(this.parseVarargLiteralExpression());
          break;
        }

        parlist.push(this.parseIdentifierExpression());
      }

      this.tokenCursor.advance();
    }

    this.expect(")");

    return parlist;
  }

  // funcbody ::= ‘(’ [parlist] ‘)’ block end
  parseFuncbody(): [ast.Expression[], ast.Block] {
    const parlist = this.parseParlist();

    this.tokenCursor.advance();

    const block = this.parseBlock();

    this.expect(End);

    return [parlist, block];
  }

  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Statements //////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  // local ::= 'local' 'function' Name funcdecl |
  //           'local' Name {',' Name} ['=' exp {',' exp}]
  parseLocalStatement(): ast.Statement {
    this.expect(Local).advance();

    if (this.tokenCursor.match(Function)) {
      return this.parseLocalFunctionStatement();
    }

    if (this.tokenCursor.match(Identifier)) {
      const namelist = this.parseNamelist();

      // NOTE: We can have local a, b, c = 1, 2, 3 or just local a, b, c.
      if (this.tokenCursor.consumeNext("=")) {
        const explist = this.parseExplist();

        return new ast.LocalStatement(namelist, explist);
      }

      return new ast.LocalStatement(namelist, []);
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

    this.expect(Then).advance();

    const ifBlock = this.parseBlock();
    const elifBlocks: ast.Block[] = [];
    const elifConditions: ast.Expression[] = [];

    while (this.tokenCursor.consume(Elseif)) {
      elifConditions.push(this.parseExpression());
      this.tokenCursor.advance();

      this.tokenCursor.advance();

      elifBlocks.push(this.parseBlock());
    }

    let elseBlock: ast.Block | null = null;

    if (this.tokenCursor.consume(Else)) {
      elseBlock = this.parseBlock();
    }

    this.expect(End);

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
    this.expect(Return).advance();

    if (this.tokenCursor.consume(";") || this.tokenCursor.eofToken) {
      return new ast.ReturnStatement([]);
    }

    const expressions = this.parseExplist();

    this.tokenCursor.consume(";");

    return new ast.ReturnStatement(expressions);
  }

  parseLocalFunctionStatement(): ast.Statement {
    this.expect(Function).advance();

    const name = this.parseIdentifierExpression();

    this.tokenCursor.advance();

    const [parlist, block] = this.parseFuncbody();

    return new ast.FunctionLocalStatement(name, parlist, block);
  }

  parseGlobalFunctionStatement(): ast.Statement {
    this.expect(Function).advance();

    const funcname = this.parseFuncname();

    this.tokenCursor.advance();

    const [parlist, block] = this.parseFuncbody();

    return new ast.FunctionGlobalStatement(funcname, parlist, block);
  }

  // while ::= 'while' exp 'do' block 'end'
  parseWhileStatement(): ast.Statement {
    this.expect(While).advance();

    const condition = this.parseExpression();

    this.expect(Do).advance();

    const block = this.parseBlock();

    this.expect(End);

    return new ast.WhileStatement(block, condition);
  }

  // for ::= Name '=' exp ',' exp [',' exp] 'do' block 'end'
  // for ::= namelist 'in' explist 'do' block 'end'
  // namelist ::= Name {',' Name}
  // explist ::= exp {',' exp}
  parseForStatement(): ast.Statement {
    this.expect(For).advance();

    this.expect(Identifier);

    const variable = this.parseIdentifierExpression();

    // Parse for generic statement
    if (this.tokenCursor.matchNext(",")) {
      const variables: ast.Identifier[] = [variable];

      while (
        !this.tokenCursor.consumeNext(In) && this.tokenCursor.consumeNext(",")
      ) {
        variables.push(this.parseIdentifierExpression());
      }

      const iterators = this.parseExplist();

      this.tokenCursor.advance();

      this.expect(Do).advance();

      const block = this.parseBlock();

      this.expect(End);

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

    this.expect(Do).advance();

    const block = this.parseBlock();

    this.expect(End);

    return new ast.ForNumericStatement(variable, start, end, step, block);
  }

  // repeat ::= 'repeat' block 'until' exp
  parseRepeatStatement(): ast.Statement {
    this.expect(Repeat).advance();

    const block = this.parseBlock();

    this.expect(Until).advance();

    const condition = this.parseExpression();

    return new ast.RepeatStatement(block, condition);
  }

  // break ::= 'break'
  parseBreakStatement(): ast.Statement {
    this.expect(Break);

    return new ast.BreakStatement();
  }

  // do ::= 'do' block 'end'
  parseDoStatement(): ast.Statement {
    this.expect(Do).advance();

    const block = this.parseBlock();

    this.expect(End);

    return new ast.DoStatement(block);
  }

  // goto ::= 'goto' Name
  parseGotoStatement(): ast.Statement {
    this.expect(Goto).advance();

    this.expect(Identifier);

    const identifier = this.parseIdentifierExpression();

    return new ast.GotoStatement(identifier);
  }

  // assignment ::= varlist '=' explist
  parseAssignmentStatement(): ast.Statement {
    const varlist = this.parseVarlist();

    this.tokenCursor.advance();

    this.expect("=").advance();

    const explist = this.parseExplist();

    return new ast.AssignmentStatement(varlist, explist);
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
      case SemiColon:
        return null;
      case Identifier:
        if (this.tokenCursor.someMatchNext("=", ",")) {
          return this.parseAssignmentStatement();
        }

        if (this.tokenCursor.someMatchNext("(", "[", ".", ":", "(", "{")) {
          return this.parseCallStatement();
        }

        return ParserException.raiseExpectedError(
          this.scanner,
          "=",
          this.tokenCursor.next,
        );
      case DoubleColon:
        return this.parseLabelStatement();
      case Break:
        return this.parseBreakStatement();
      case Goto:
        return this.parseGotoStatement();
      case Do:
        return this.parseDoStatement();
      case While:
        return this.parseWhileStatement();
      case Repeat:
        return this.parseRepeatStatement();
      case Return:
        return this.parseReturnStatement();
      case If:
        return this.parseIfStatement();
      case For:
        return this.parseForStatement();
      case Function:
        return this.parseGlobalFunctionStatement();
      case Local:
        return this.parseLocalStatement();
      default:
        ParserException.raiseUnexpectedTokenError(
          this.scanner,
          this.tokenCursor.current,
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
      if (this.tokenCursor.current.value === Return) {
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
    this.assertToken(EOF);

    return new ast.Chunk(block);
  }

  parse(): ast.Chunk {
    return this.parseChunk();
  }
}

export { Parser };
