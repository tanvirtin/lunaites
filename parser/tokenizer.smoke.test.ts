import { Scanner, Tokenizer, TokenType } from "./mod.ts";
import { Test, TestType } from "../core/mod.ts";

async function main() {
  const test = new Test({
    name: "tokenizer",
    type: TestType.Smoke,
    importMeta: import.meta,
  });

  await test
    .registerSmoke([
      "https://github.com/tanvirtin/vgit.nvim.git",
      "https://github.com/koreader/koreader",
      "https://github.com/Neopallium/lua-pb.git",
      "https://github.com/luvit/luvit.git",
      "https://github.com/leafo/pgmoon.git",
      "https://github.com/lua/lua",
      "https://github.com/Neopallium/llvm-lua.git",
      "https://github.com/moteus/lua-path.git",
      "https://github.com/Alloyed/lua-lsp.git",
      "https://github.com/sumneko/lua-language-server.git",
    ], async (path: string) => {
      let token;
      const source = await Deno.readTextFile(path);
      const scanner = new Scanner(source);
      const tokenizer = new Tokenizer(scanner);

      while (token?.type !== TokenType.EOF) {
        token = tokenizer.tokenize();
      }
    });

  test.run();
}

await main();