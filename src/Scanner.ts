// Please refer to the https://www.asciitable.com/ for the char codes.

interface ScannerOptions {
  extendedIdentifiers: boolean;
}

class Scanner {
  public index = 0;
  public line = 0;
  public lineStart = 1;
  private markedIndex = 0;
  private source = "";
  private options: ScannerOptions = {
    extendedIdentifiers: true,
  };

  constructor(source: string, options?: ScannerOptions) {
    this.source = source;
    this.options = {
      ...this.options,
      ...(options ?? {}),
    };
  }

  private sanitizeIndex(index?: number) {
    return index ?? this.index;
  }

  // ' '
  isDotNotation(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode === 46;
  }

  // ' '
  isWhitespace(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode === 9 || charCode === 32 || charCode === 0xB ||
      charCode === 0xC;
  }

  // \n
  isLineFeed(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode === 10;
  }

  // \r
  isCarriageReturn(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode === 13;
  }

  // \n or \r
  isLineTerminator(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    return this.isLineFeed(index) || this.isCarriageReturn(index);
  }

  // \n\r or \r\n
  isNewLine(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    return (this.isLineFeed(index) && this.isCarriageReturn(index + 1)) ||
      (this.isCarriageReturn(index) && this.isLineFeed(index + 1));
  }

  // [0-9]
  isDigit(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode >= 48 && charCode <= 57;
  }

  // Extended alphabets starting  ending in ÿ
  isExtendedAlphabets(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode >= 128;
  }

  // Alphabets
  isAlphabet(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return ((charCode >= 65 && charCode <= 90) ||
      (charCode >= 97 && charCode <= 122) || 95 === charCode) ||
      (this.options.extendedIdentifiers && this.isExtendedAlphabets(index) ||
        false);
  }

  // [0-9] or Alphabets
  isAlphanumeric(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    return this.isDigit(index) || this.isAlphabet(index);
  }

  // When scanner goes out of bounds of the source.
  isOutOfBounds(index?: number): boolean {
    index = this.sanitizeIndex(index);

    return index < 0 || index >= this.source.length;
  }

  // Returns the current char under scanner.
  getChar(index?: number): string {
    index = this.sanitizeIndex(index);

    if (index >= this.source.length || index < 0) {
      throw new Error('"index" is out of range');
    }

    return this.source[index];
  }

  // Returns the current char code under scanner.
  getCharCode(index?: number): number {
    index = this.sanitizeIndex(index);

    if (index >= this.source.length || index < 0) {
      throw new Error('"index" is out of range');
    }

    return this.source.charCodeAt(index);
  }

  // Returns the current range from marked index to
  // current index in an array or a specified range.
  getText(markedIndex?: number, index?: number): string {
    const length = this.source.length;
    markedIndex = markedIndex ?? this.markedIndex;
    index = this.sanitizeIndex(index);

    if (markedIndex >= length || markedIndex < 0) {
      throw new Error('"markedIndex" is out of range');
    }

    if (index >= length + 1 || index < 0) {
      throw new Error('"markedIndex" is out of range');
    }

    if (markedIndex >= index) {
      throw new Error('"markedIndex" is greater than "index"');
    }

    return this.source.slice(markedIndex, index);
  }

  // Returns the current range from marked index to current
  // index in an array or a specified range.
  getRange(markedIndex?: number, index?: number): number[] {
    markedIndex = markedIndex ?? this.markedIndex;
    index = this.sanitizeIndex(index);
    const length = this.source.length;

    if (markedIndex >= length || markedIndex < 0) {
      throw new Error('"markedIndex" is out of range');
    }

    if (index >= length + 1 || index < 0) {
      throw new Error('"markedIndex" is out of range');
    }

    if (markedIndex > index) {
      throw new Error('"markedIndex" is greater than "index"');
    }

    return [markedIndex, index];
  }

  // Mark the current index in memory.
  mark(): Scanner {
    this.markedIndex = this.index;

    return this;
  }

  // Increments the internal scanner index by 1.
  scan(by?: number): Scanner {
    // 0 gets ignored and treated as 1 which is why we use || and not ??.
    this.index += by || 1;

    return this;
  }

  // Eats away all whitespace characters and progresses the index.
  comsumeWhitespace(): Scanner {
    while (!this.isOutOfBounds()) {
      if (this.isWhitespace()) {
        this.scan();
      } else if (this.isLineTerminator()) {
        // If we encountered a line terminator, we scan the line count by 1.
        ++this.line;
        // If we encounter \n\r or \r\n it's a new line.
        if (this.isNewLine()) {
          this.scan().scan();
          this.lineStart = this.index;
          // Otherwise we skip the \n or \r.
        } else {
          this.scan();
          this.lineStart = this.index;
        }
      } else {
        break;
      }
    }

    return this;
  }
}

export { Scanner };
export type { ScannerOptions };