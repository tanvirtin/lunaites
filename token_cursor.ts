import { Token, Tokenizer, TokenType } from "./mod.ts";

// Layer to control "stream" of tokens.
class TokenCursor {
  private _index = -1;
  private internalIndex = -1;
  private tokens: Token[] = [];
  private tokenizer: Tokenizer;
  public eofToken: Token | void = undefined;

  constructor(source: string) {
    this.tokenizer = new Tokenizer(source);
  }

  private tokenize(moveCursor = true): TokenCursor {
    if (this.eofToken) {
      if (moveCursor && this.index < this.tokens.length - 1) {
        ++this.index;
      }

      return this;
    }
    // Function tokenize will keep returning the same
    // token called EOF if we hit the end of the line.
    const token = this.tokenizer.tokenize();

    if (token.type === TokenType.EOF) {
      this.eofToken = token;
    }

    ++this.internalIndex;

    if (moveCursor) {
      ++this.index;
    }

    this.tokens.push(token);

    return this;
  }

  at(index: number): Token {
    if (index > this.internalIndex) {
      const times = index - this.internalIndex;

      for (let i = 0; i < times + 1; ++i) {
        this.tokenize(false);

        if (this.eofToken) {
          break;
        }
      }
    }

    return this
      .tokens[index > this.internalIndex ? this.internalIndex : index];
  }

  private set index(index: number) {
    this._index = index;
  }

  get index() {
    return this._index;
  }

  get current(): Token {
    return this.tokens[this.index];
  }

  get next(): Token {
    return this.lookahead(1);
  }

  lookahead(to: number): Token {
    if (this.eofToken) {
      return this.eofToken;
    }

    return this.at(this.index + to);
  }

  match(tokenType: TokenType): boolean {
    return this.current?.type === tokenType;
  }

  advance(): TokenCursor {
    return this.tokenize();
  }

  consume(tokenType: TokenType): boolean {
    const isMatchFound = this.match(tokenType);

    if (isMatchFound) {
      this.advance();
    }

    return isMatchFound;
  }
}

export { TokenCursor };
