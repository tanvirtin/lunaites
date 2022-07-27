import { Parser } from "./mod.ts";
import { TestRunner, TestType } from "../core/mod.ts";

async function main() {
  const testRunner = new TestRunner({
    name: "tokenizer",
    type: TestType.Smoke,
    importMeta: import.meta,
  });

  await testRunner
    .registerSmoke([
      "https://github.com/tanvirtin/vgit.nvim.git",
    ], async (path: string) => {
      const source = await Deno.readTextFile(path);
      const parser = new Parser(source);

      parser.parse();
    });

  testRunner.run();
}

await main();
