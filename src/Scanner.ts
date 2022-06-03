// Please refer to the https://www.asciitable.com/ for the char codes.

interface ScannerOptions {
  extendedIdentifiers: boolean;
}

class Scanner {
  private source = "";
  public index = 0;
  public lnum = 1;
  public lnumStartIndex = 0;
  private markedIndex = 0;
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

  // Verify if a given charcode is the one being pointed at.
  isCharCode(charCode: number, index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    return this.getCharCode(index) === charCode;
  }

  // '['
  isOpenBracket(index?: number): boolean {
    return this.isCharCode(91, index);
  }

  // '='
  isEqual(index?: number): boolean {
    return this.isCharCode(61, index);
  }

  // '\'
  isBackslash(index?: number): boolean {
    return this.isCharCode(92, index);
  }

  // '.'
  isDotNotation(index?: number): boolean {
    return this.isCharCode(46, index);
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
    return this.isCharCode(10, index);
  }

  // \r
  isCarriageReturn(index?: number): boolean {
    return this.isCharCode(13, index);
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

  // '
  isQuote(index?: number): boolean {
    return this.isCharCode(39, index);
  }

  // "
  isDoubleQuote(index?: number): boolean {
    return this.isCharCode(34, index);
  }

  // Extended alphabets starting  ending in ÿ
  isExtendedAlphabets(index?: number): boolean {
    if (!this.options.extendedIdentifiers) return false;

    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return charCode >= 128;
  }

  // Alphabets [A-Z, a-z]
  isAlphabet(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return ((charCode >= 65 && charCode <= 90) ||
      (charCode >= 97 && charCode <= 122) || 95 === charCode);
  }

  // [0-9], [A-f, a-f]
  isHexDigit(index?: number) {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    const charCode = this.getCharCode(index);

    return this.isDigit(index) || (charCode >= 65 && charCode <= 70) ||
      (charCode >= 97 && charCode <= 102);
  }

  // [0-9] or Alphabets
  isAlphanumeric(index?: number): boolean {
    index = this.sanitizeIndex(index);

    if (this.isOutOfBounds(index)) return false;

    return this.isDigit(index) || this.isAlphabet(index) ||
      this.isExtendedAlphabets(index);
  }

  // When scanner goes out of bounds of the source.
  isOutOfBounds(index?: number): boolean {
    index = this.sanitizeIndex(index);

    return index < 0 || index >= this.source.length;
  }

  getCol(): number {
    return this.index - this.lnumStartIndex + 1;
  }

  // Returns the current char under scanner.
  getChar(index?: number): string {
    index = this.sanitizeIndex(index);

    return this.source[index];
  }

  // Returns the current char code under scanner.
  getCharCode(index?: number): number {
    index = this.sanitizeIndex(index);

    return this.source.charCodeAt(index);
  }

  // Returns the current range from marked index to
  // current index in an array or a specified range.
  getText(markedIndex?: number, index?: number): string {
    markedIndex = markedIndex ?? this.markedIndex;
    index = this.sanitizeIndex(index);

    return this.source.slice(markedIndex, index);
  }

  // Returns the current range from marked index to current
  // index in an array or a specified range.
  getRange(markedIndex?: number, index?: number): number[] {
    markedIndex = markedIndex ?? this.markedIndex;
    index = this.sanitizeIndex(index);

    return [markedIndex, index];
  }

  match(chars: string): boolean {
    let found = true;

    for (let i = 0; i < chars.length; ++i) {
      const charCode = chars.charCodeAt(i);
      found = this.isCharCode(charCode, this.index + i);

      if (!found) {
        break;
      }
    }

    return found;
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

  scanWhile(cond: () => boolean): Scanner {
    while (cond.call(this) && this.index < this.source.length) {
      this.scan();
    }

    return this;
  }

  scanUntil(cond: () => boolean): Scanner {
    while (!cond.call(this) && this.index < this.source.length) {
      this.scan();
    }

    return this;
  }

  consumeEOL(): boolean {
    if (this.isLineTerminator()) {
      // If we encountered a line terminator, we scan the line count by 1.
      ++this.lnum;
      // If we encounter \n\r or \r\n it's a new line.
      if (this.isNewLine()) {
        this.scan().scan();
        this.lnumStartIndex = this.index;
        // Otherwise we skip the \n or \r.
      } else {
        this.scan();
        this.lnumStartIndex = this.index;
      }

      return true;
    }

    return false;
  }
}

export { Scanner };
export type { ScannerOptions };
