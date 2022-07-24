import { Profiler } from "../core/mod.ts";

// Please refer to the https://www.asciitable.com/ for the char codes.

interface ScannerOptions {
  extendedIdentifiers: boolean;
}

class Scanner {
  private source = "";
  private _index = 0;
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

  /**
   * Current index the scanner is pointing at
   */
  get pos() {
    return this._index;
  }

  /**
   * Current char the scanner is pointing at
   */
  get char(): string {
    return this.source[this._index];
  }

  /**
   * Current charCode the scanner is pointing at
   */
  get charCode(): number {
    return this.source.charCodeAt(this._index);
  }

  /**
   * Returns the current range from marked index to current index in an array or a specified range.
   */
  get text(): string {
    return this.source.slice(this.markedIndex, this.pos);
  }

  /**
   * Returns the current range from marked index to current index in an array or a specified range.
   */
  get range(): number[] {
    return [this.markedIndex, this.pos];
  }

  // Mark the current index in memory.
  @Profiler.bench
  mark(): Scanner {
    this.markedIndex = this._index;

    return this;
  }

  // Verify if a given charcode is the one being pointed at.
  @Profiler.bench
  isCharCode(charCode: number, index: number): boolean {
    if (this.isOutOfBounds(index)) return false;

    return this.source.charCodeAt(index) === charCode;
  }

  // \n
  @Profiler.bench
  isLineFeed(index: number): boolean {
    return this.isCharCode(10, index);
  }

  // \r
  @Profiler.bench
  isCarriageReturn(index: number): boolean {
    return this.isCharCode(13, index);
  }

  // ' '
  @Profiler.bench
  isWhitespace(index: number): boolean {
    if (this.isOutOfBounds(index)) return false;

    const charCode = this.source.charCodeAt(index);

    return charCode === 9 || charCode === 32 || charCode === 0xB ||
      charCode === 0xC;
  }

  // \n or \r
  @Profiler.bench
  isLineTerminator(index: number): boolean {
    return this.isLineFeed(index) || this.isCarriageReturn(index);
  }

  // \n\r or \r\n
  @Profiler.bench
  isNewLine(index: number): boolean {
    return (this.isLineFeed(index) && this.isCarriageReturn(index + 1)) ||
      (this.isCarriageReturn(index) && this.isLineFeed(index + 1));
  }

  // [0-9]
  @Profiler.bench
  isDigit(index: number): boolean {
    const charCode = this.source.charCodeAt(index);

    return charCode >= 48 && charCode <= 57;
  }

  // Extended alphabets starting  ending in ÿ
  @Profiler.bench
  isExtendedAlphabets(index: number): boolean {
    if (!this.options.extendedIdentifiers) return false;

    const charCode = this.source.charCodeAt(index);

    return charCode >= 128;
  }

  // Alphabets [A-Z, a-z]
  @Profiler.bench
  isAlphabet(index: number): boolean {
    const charCode = this.source.charCodeAt(index);

    return ((charCode >= 65 && charCode <= 90) ||
      (charCode >= 97 && charCode <= 122) || 95 === charCode);
  }

  // [0-9], [A-f, a-f]
  @Profiler.bench
  isHexDigit(index: number) {
    const charCode = this.source.charCodeAt(index);

    return this.isDigit(index) || (charCode >= 65 && charCode <= 70) ||
      (charCode >= 97 && charCode <= 102);
  }

  // [0-9] or Alphabets
  @Profiler.bench
  isAlphanumeric(index: number): boolean {
    if (this.isOutOfBounds(index)) return false;

    return this.isDigit(index) || this.isAlphabet(index) ||
      this.isExtendedAlphabets(index);
  }

  // When scanner goes out of bounds of the source.
  @Profiler.bench
  isOutOfBounds(index: number): boolean {
    return index < 0 || index >= this.source.length;
  }

  @Profiler.bench
  isWithinBounds(): boolean {
    return this._index < this.source.length;
  }

  @Profiler.bench
  getCol(): number {
    return this._index - this.lnumStartIndex + 1;
  }

  @Profiler.bench
  match(chars: string): boolean {
    for (let i = 0; i < chars.length; ++i) {
      if (chars[i] !== this.source[this._index + i]) {
        return false;
      }
    }

    return true;
  }

  @Profiler.bench
  consumeEOL(): boolean {
    if (this.isLineTerminator(this._index)) {
      // If we encountered a line terminator, we scan the line count by 1.
      ++this.lnum;
      // If we encounter \n\r or \r\n it's a new line.
      if (this.isNewLine(this._index)) {
        this.scan().scan();
        this.lnumStartIndex = this._index;
        // Otherwise we skip the \n or \r.
      } else {
        this.scan();
        this.lnumStartIndex = this._index;
      }

      return true;
    }

    return false;
  }

  @Profiler.bench
  someChar(chars: string[] | string): boolean {
    for (const char of chars) {
      if (char === this.source[this.pos]) {
        return true;
      }
    }

    return false;
  }

  @Profiler.bench
  everyChar(chars: string[] | string): boolean {
    for (const char of chars) {
      if (char === this.source[this.pos]) {
        return false;
      }
    }

    return true;
  }

  @Profiler.bench
  someCharCode(charCodes: number[]): boolean {
    return charCodes.some((charCode) => this.isCharCode(charCode, this.pos));
  }

  @Profiler.bench
  everyCharCode(charCodes: number[]): boolean {
    return charCodes.some((charCode) => this.isCharCode(charCode, this.pos));
  }

  // Increments the internal scanner index by 1.
  @Profiler.bench
  scan(by?: number): Scanner {
    // 0 gets ignored and treated as 1 which is why we use || and not ??.
    this._index += by || 1;

    return this;
  }

  @Profiler.bench
  scanWhile(cond: () => boolean): Scanner {
    while (cond.call(this) && this.isWithinBounds()) {
      this.scan();
    }

    return this;
  }

  @Profiler.bench
  scanUntil(cond: () => boolean): Scanner {
    while (!cond.call(this) && this.isWithinBounds()) {
      this.scan();
    }

    return this;
  }
}

export { Scanner };
export type { ScannerOptions };
