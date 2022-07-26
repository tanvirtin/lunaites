import { Token, Tokenizer, TokenType } from "./mod.ts";

const { EOF } = TokenType;

// Layer to control "stream" of tokens.
class TokenCursor {
  #index = -1;
  #internalIndex = -1;
  #tokens: Token[] = [];
  #tokenizer: Tokenizer;
  #eofToken: Token | void = undefined;

  get done(): boolean {
    return this.#index === this.#internalIndex && !!this.#eofToken;
  }

  constructor(tokenizer: Tokenizer) {
    this.#tokenizer = tokenizer;
  }

  #tokenize(moveCursor = true): TokenCursor {
    if (this.#eofToken) {
      if (moveCursor && this.index < this.#tokens.length - 1) {
        ++this.#index;
      }

      return this;
    }
    // Function tokenize will keep returning the same
    // token called EOF if we hit the end of the line.
    const token = this.#tokenizer.tokenize();

    if (token.type === EOF) {
      this.#eofToken = token;
    }

    ++this.#internalIndex;

    if (moveCursor) {
      ++this.#index;
    }

    this.#tokens.push(token);

    return this;
  }

  at(index: number): Token {
    if (index > this.#internalIndex) {
      const times = index - this.#internalIndex;

      for (let i = 0; i < times + 1; ++i) {
        this.#tokenize(false);

        if (this.#eofToken) {
          break;
        }
      }
    }

    return this
      .#tokens[index > this.#internalIndex ? this.#internalIndex : index];
  }

  get index() {
    return this.#index;
  }

  get current(): Token {
    return this.#tokens[this.index];
  }

  get currentType(): TokenType {
    return this.#tokens[this.index].type;
  }

  get currentValue(): string {
    return this.#tokens[this.index].value;
  }

  get next(): Token {
    return this.lookahead(1);
  }

  get nextValue(): string {
    return this.next.value;
  }

  get nextType(): TokenType {
    return this.next.type;
  }

  get isBlockFollow(): boolean {
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

  someMatch(...args: string[] | TokenType[]): boolean {
    return args.some((arg) => this.match(arg));
  }

  someMatchNext(...args: string[] | TokenType[]): boolean {
    return args.some((arg) => this.matchNext(arg));
  }

  advance(): TokenCursor {
    return this.#tokenize();
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

  someConsume(...args: string[] | TokenType[]): boolean {
    const isMatchFound = this.someMatch(...args);

    if (isMatchFound) {
      this.advance();
    }

    return isMatchFound;
  }

  someConsumeNext(...args: string[] | TokenType[]): boolean {
    const isMatchFound = this.someMatchNext(...args);

    if (isMatchFound) {
      this.advance();
      this.advance();
    }

    return isMatchFound;
  }
}

export { TokenCursor };
