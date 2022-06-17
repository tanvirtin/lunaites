import { Tokenizer } from "./mod.ts";

// Pratt parser.
class Parser {
  private tokenizer: Tokenizer;

  constructor(source: string) {
    this.tokenizer = new Tokenizer(source);
  }

  parse() {}
}

export { Parser };
