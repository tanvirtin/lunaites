interface Token {
  type: number;
  value: boolean | number | string;
  line: number;
  lineStart: number;
  range: number[];
}

class Tokenizer {}

export { Tokenizer };
export type { Token };
