import { Token, Tokenizer, TokenType } from "./mod.ts";

// Layer to control "stream" of tokens.
class TokenCursor {
  private _index = -1;
  private internalIndex = -1;
  private tokens: Token[] = [];
  private tokenizer: Tokenizer;
  public eofToken: Token | void = undefined;

  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
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

  isBlockFollow(): boolean {
    const token = this.current;

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

  lookahead(to: number): Token {
    return this.at(this.index + to);
  }

  match(query: string | TokenType): boolean {
    if (query in TokenType) {
      return this.current?.type === query;
    }

    return this.current?.value === query;
  }

  matchNext(query: string | TokenType): boolean {
    if (query in TokenType) {
      return this.next?.type === query;
    }

    return this.next?.value === query;
  }

  advance(): TokenCursor {
    return this.tokenize();
  }

  consume(query: string | TokenType): boolean {
    const isMatchFound = this.match(query);

    if (isMatchFound) {
      this.advance();
    }

    return isMatchFound;
  }

  consumeNext(query: string | TokenType): boolean {
    const isMatchFound = this.matchNext(query);

    if (isMatchFound) {
      this.advance();
      this.advance();
    }

    return isMatchFound;
  }
}

export { TokenCursor };