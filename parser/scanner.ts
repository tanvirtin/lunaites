// Please refer to the https://www.asciitable.com/ for the char codes.

interface ScannerOptions {
  extendedIdentifiers: boolean;
}

class Scanner {
  #source = "";
  #index = 0;
  lnum = 1;
  lnumStartIndex = 0;
  #markedIndex = 0;
  #options: ScannerOptions = {
    extendedIdentifiers: true,
  };

  constructor(source: string, options?: ScannerOptions) {
    this.#source = source;
    this.#options = {
      ...this.#options,
      ...(options ?? {}),
    };
  }

  /**
   * Current index the scanner is pointing at
   */
  get pos() {
    return this.#index;
  }

  /**
   * Current char the scanner is pointing at
   */
  get char(): string {
    return this.#source[this.#index];
  }

  /**
   * Current charCode the scanner is pointing at
   */
  get charCode(): number {
    return this.#source.charCodeAt(this.#index);
  }

  /**
   * Returns the current range from marked index to current index in an array or a specified range.
   */
  get text(): string {
    return this.#source.slice(this.#markedIndex, this.pos);
  }

  /**
   * Returns the current range from marked index to current index in an array or a specified range.
   */
  get range(): number[] {
    return [this.#markedIndex, this.pos];
  }

  // Mark the current index in memory.
  mark(): Scanner {
    this.#markedIndex = this.#index;

    return this;
  }

  // Verify if a given charcode is the one being pointed at.
  isCharCodeAt(index: number, charCode: number): boolean {
    if (this.isOutOfBoundsAt(index)) return false;

    return this.#source.charCodeAt(index) === charCode;
  }

  // \n
  isLineFeedAt(index: number): boolean {
    return this.isCharCodeAt(index, 10);
  }

  // \r
  isCarriageReturnAt(index: number): boolean {
    return this.isCharCodeAt(index, 13);
  }

  // ' '
  isWhitespace(index: number): boolean {
    const charCode = this.#source.charCodeAt(index);

    switch (charCode) {
      case 9:
      case 32:
      case 0xB:
      case 0xC:
        return true;
      default:
        return false;
    }
  }

  // \n or \r
  isLineTerminatorAt(index: number): boolean {
    return this.isLineFeedAt(index) || this.isCarriageReturnAt(index);
  }

  // \n\r or \r\n
  isNewLineAt(index: number): boolean {
    if (this.isOutOfBoundsAt(index)) return false;

    return (this.isLineFeedAt(index) && this.isCarriageReturnAt(index + 1)) ||
      (this.isCarriageReturnAt(index) && this.isLineFeedAt(index + 1));
  }

  // [0-9]
  isDigitAt(index: number): boolean {
    const charCode = this.#source.charCodeAt(index);

    return charCode >= 48 && charCode <= 57;
  }

  // Extended alphabets starting  ending in ÿ
  isExtendedAlphabetsAt(index: number): boolean {
    if (!this.#options.extendedIdentifiers) return false;

    const charCode = this.#source.charCodeAt(index);

    return charCode >= 128;
  }

  // Alphabets [A-Z, a-z]
  isAlphabetAt(index: number): boolean {
    const charCode = this.#source.charCodeAt(index);

    return ((charCode >= 65 && charCode <= 90) ||
      (charCode >= 97 && charCode <= 122) || 95 === charCode);
  }

  // [0-9], [A-f, a-f]
  isHexDigitAt(index: number) {
    const charCode = this.#source.charCodeAt(index);

    return this.isDigitAt(index) || (charCode >= 65 && charCode <= 70) ||
      (charCode >= 97 && charCode <= 102);
  }

  // [0-9] or Alphabets
  isAlphanumericAt(index: number): boolean {
    if (this.isOutOfBoundsAt(index)) return false;

    return this.isDigitAt(index) || this.isAlphabetAt(index) ||
      this.isExtendedAlphabetsAt(index);
  }

  // When scanner goes out of bounds of the source.
  isOutOfBoundsAt(index: number): boolean {
    return index < 0 || index >= this.#source.length;
  }

  getCol(): number {
    return this.#index - this.lnumStartIndex + 1;
  }

  match(chars: string): boolean {
    for (let i = 0; i < chars.length; ++i) {
      if (chars[i] !== this.#source[this.#index + i]) {
        return false;
      }
    }

    return true;
  }

  consumeEOL(): boolean {
    if (this.isLineTerminatorAt(this.#index)) {
      // If we encountered a line terminator, we scan the line count by 1.
      ++this.lnum;
      // If we encounter \n\r or \r\n it's a new line.
      if (this.isNewLineAt(this.#index)) {
        this.scan().scan();
        this.lnumStartIndex = this.#index;
        // Otherwise we skip the \n or \r.
      } else {
        this.scan();
        this.lnumStartIndex = this.#index;
      }

      return true;
    }

    return false;
  }

  someChar(chars: string[] | string): boolean {
    if (this.isOutOfBoundsAt(this.pos)) return false;

    for (const char of chars) {
      if (char === this.#source[this.pos]) {
        return true;
      }
    }

    return false;
  }

  someCharCode(charCodes: number[]): boolean {
    if (this.isOutOfBoundsAt(this.pos)) return false;

    for (const charCode of charCodes) {
      if (this.isCharCodeAt(this.pos, charCode)) {
        return true;
      }
    }

    return false;
  }

  // Increments the internal scanner index by 1.
  scan(by?: number): Scanner {
    // 0 gets ignored and treated as 1 which is why we use || and not ??.
    this.#index += by || 1;

    return this;
  }

  scanWhile(cond: () => boolean): Scanner {
    while (cond.call(this) && !this.isOutOfBoundsAt(this.pos)) {
      this.scan();
    }

    return this;
  }

  scanUntil(cond: () => boolean): Scanner {
    while (!cond.call(this) && !this.isOutOfBoundsAt(this.pos)) {
      this.scan();
    }

    return this;
  }
}

export { Scanner };
export type { ScannerOptions };
