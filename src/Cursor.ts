import { Feature } from "./Lexer.ts";

// Please refer to the https://www.asciitable.com/ for the char codes.

class Cursor {
  // The index is intialized to -1, because first next will
  // increment it to 1 as soon as it the function is invoked.
  public index: number = -1;
  public line: number = 0;
  public lineStart: number = 0;
  public markedIndex: number = 0;
  private source: string = "";
  private feature: Feature;

  constructor(source: string, feature: Feature) {
    this.source = source;
    this.feature = feature;
  }

  // ''
  isWhitespace(index?: number): boolean {
    index = index ?? this.index;
    const charCode = this.getCharCode(index);

    return charCode === 9 || charCode === 32 || charCode === 0xB ||
      charCode === 0xC;
  }

  // \n
  isLineFeed(index?: number): boolean {
    index = index ?? this.index;
    const charCode = this.getCharCode(index);

    return charCode === 10;
  }

  // \r
  isCarriageReturn(index?: number): boolean {
    index = index ?? this.index;
    const charCode = this.getCharCode(index);

    return charCode === 13;
  }

  // \n or \r
  isLineTerminator(index?: number): boolean {
    index = index ?? this.index;

    return this.isLineFeed(index) || this.isCarriageReturn(index);
  }

  // \n\r or \r\n
  isNewLine(index?: number): boolean {
    index = index ?? this.index;

    return (this.isLineFeed(index) && this.isCarriageReturn(index + 1)) ||
      (this.isCarriageReturn(index) && this.isLineFeed(index + 1));
  }

  // [0-9]
  isDigit(index?: number): boolean {
    index = index ?? this.index;
    const charCode = this.getCharCode(index);

    return charCode >= 48 && charCode <= 57;
  }

  // Extended alphabets starting  ending in ÿ
  isExtendedAlphabets(index?: number): boolean {
    index = index ?? this.index;
    const charCode = this.getCharCode(index);

    return charCode >= 128;
  }

  // Alphabets
  isAlphabet(index?: number): boolean {
    index = index ?? this.index;
    const charCode = this.getCharCode(index);

    return ((charCode >= 65 && charCode <= 90) ||
      (charCode >= 97 && charCode <= 122) || 95 === charCode) ||
      (this.feature.extendedIdentifiers && this.isExtendedAlphabets(index) ||
        false);
  }

  // [0-9] or Alphabets
  isAlphanumeric(index?: number): boolean {
    index = index ?? this.index;

    return this.isDigit(index) || this.isAlphabet(index);
  }

  // When cursor goes out of bounds of the source.
  isOutOfBounds(): boolean {
    return this.index < 0 || this.index >= this.source.length;
  }

  // Returns the current char under cursor.
  getChar(index?: number): string {
    return this.source[index ?? this.index];
  }

  // Returns the current char code under cursor.
  getCharCode(index?: number): number {
    return this.source.charCodeAt(index ?? this.index);
  }

  getText(markedIndex?: number, index?: number): string {
    markedIndex = this.markedIndex ?? this.markedIndex;
    index = index ?? this.index;

    return this.source.slice(markedIndex, index);
  }

  getRange(markedIndex?: number, index?: number): number[] {
    markedIndex = this.markedIndex ?? this.markedIndex;
    index = index ?? this.index;

    return [markedIndex, index];
  }

  // Mark the current index in memory.
  mark(): void {
    this.markedIndex = this.index;
  }

  // Increments the cursor by 1 or many.
  increment(by?: number) {
    if (by) {
      this.index += by;

      return this.index;
    }

    return ++this.index;
  }

  // Decrements the cursor by 1 or many.
  decrement(by?: number) {
    if (by) {
      this.index -= by;

      return this.index;
    }

    return --this.index;
  }

  // Eats away all whitespace characters and progresses the index.
  eatWhitespace(): void {
    while (!this.isOutOfBounds()) {
      if (this.isWhitespace()) {
        this.increment();
      } else if (this.isLineTerminator()) {
        // If we encountered a line terminator, we increment the line count by 1.
        ++this.line;
        // If we encounter \n\r or \r\n it's a new line.
        if (this.isNewLine()) {
          this.increment();
          this.lineStart = this.increment();
          // Otherwise we skip the \n or \r.
        } else {
          this.lineStart = this.increment();
        }
      } else {
        break;
      }
    }
  }
}

export { Cursor };
