// Please refer to the https://www.asciitable.com/ for the char codes.

interface ScannerOptions {
  extendedIdentifiers: boolean;
}

class Scanner {
  // The index is intialized to -1, because first next will
  // incremented to 1 as soon as it the function is invoked.
  public index = -1;
  public line = 0;
  public lineStart = 0;
  public markedIndex = 0;
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

  // ' '
  isWhitespace(index?: number): boolean {
    const charCode = this.getCharCode(index ?? this.index);

    return charCode === 9 || charCode === 32 || charCode === 0xB ||
      charCode === 0xC;
  }

  // \n
  isLineFeed(index?: number): boolean {
    const charCode = this.getCharCode(index ?? this.index);

    return charCode === 10;
  }

  // \r
  isCarriageReturn(index?: number): boolean {
    const charCode = this.getCharCode(index ?? this.index);

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
    const charCode = this.getCharCode(index ?? this.index);

    return charCode >= 48 && charCode <= 57;
  }

  // Extended alphabets starting  ending in ÿ
  isExtendedAlphabets(index?: number): boolean {
    const charCode = this.getCharCode(index ?? this.index);

    return charCode >= 128;
  }

  // Alphabets
  isAlphabet(index?: number): boolean {
    const charCode = this.getCharCode(index ?? this.index);

    return ((charCode >= 65 && charCode <= 90) ||
      (charCode >= 97 && charCode <= 122) || 95 === charCode) ||
      (this.options.extendedIdentifiers && this.isExtendedAlphabets(index) ||
        false);
  }

  // [0-9] or Alphabets
  isAlphanumeric(index?: number): boolean {
    index = index ?? this.index;

    return this.isDigit(index) || this.isAlphabet(index);
  }

  // When scanner goes out of bounds of the source.
  isOutOfBounds(): boolean {
    return this.index < 0 || this.index >= this.source.length;
  }

  // Returns the current char under scanner.
  getChar(index?: number): string {
    return this.source[index ?? this.index];
  }

  // Returns the current char code under scanner.
  getCharCode(index?: number): number {
    return this.source.charCodeAt(index ?? this.index);
  }

  getText(markedIndex?: number, index?: number): string {
    markedIndex = markedIndex ?? this.markedIndex;
    index = index ?? this.index;

    return this.source.slice(markedIndex, index);
  }

  getRange(markedIndex?: number, index?: number): number[] {
    markedIndex = markedIndex ?? this.markedIndex;
    index = index ?? this.index;

    return [markedIndex, index];
  }

  // Mark the current index in memory.
  mark(): Scanner {
    this.markedIndex = this.index;

    return this;
  }

  // Increments the internal scanner index by 1.
  scan(by?: number): Scanner {
    this.index += by ?? 1;

    return this;
  }

  // Eats away all whitespace characters and progresses the index.
  eatWhitespace(): Scanner {
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
