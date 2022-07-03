import { Parser } from "./mod.ts";
import { Test, TestType } from "../core/mod.ts";

async function main() {
  const test = new Test({
    name: "parser",
    type: TestType.Smoke,
    importMeta: import.meta,
  });

  await test
    .registerSmoke([
      "https://github.com/tanvirtin/vgit.nvim.git",
    ], async (path: string) => {
      const source = await Deno.readTextFile(path);
      const parser = new Parser(source);

      parser.parse();
    });

  test.run();
}

await main();
