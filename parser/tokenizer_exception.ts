import { Exception, Scanner } from "./mod.ts";

class TokenizerException {
  static raiseMalformedNumberError(scanner: Scanner): never {
    Exception.raiseTokenizerError(
      scanner,
      `malformed number near '${scanner.text}'`,
    );
  }

  static raiseUnfinishedStringError(scanner: Scanner): never {
    Exception.raiseTokenizerError(
      scanner,
      `unfinished string near '${scanner.text}'`,
    );
  }

  static raiseUnfinishedLongStringError(scanner: Scanner): never {
    Exception.raiseTokenizerError(
      scanner,
      `unfinished long string (starting at line ${scanner.lnum}) near '${scanner.text}'`,
    );
  }

  static raiseUnexpectedCharacterError(scanner: Scanner): never {
    Exception.raiseTokenizerError(
      scanner,
      `unfinished character near '${scanner.text}'`,
    );
  }

  static raiseUnfinishedLongCommentError(scanner: Scanner): never {
    Exception.raiseTokenizerError(
      scanner,
      `unfinished long comment (starting at line ${scanner.lnum}) near '${scanner.text}'`,
    );
  }
}

export { TokenizerException };
