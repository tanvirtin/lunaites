import { basename } from "./deps.ts";
import type { Suite } from "./mod.ts";

class E2ESpecGenerator {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async getSpecPaths() {
    const currentPath = this.path;

    const names: string[] = [];

    for await (const dirEntry of Deno.readDir(currentPath)) {
      const entryPath = `${currentPath}/${dirEntry.name}`;
      names.push(entryPath);
    }

    return names;
  }

  async generate(): Promise<Suite[]> {
    const specPaths = await this.getSpecPaths();

    const onlies = [];
    const rest = [];

    for await (let name of specPaths) {
      const text = await Deno.readTextFile(name);
      name = basename(name);
      const lines = text.split("\n");

      lines.shift(); // "source"
      lines.shift(); // "------"

      let source = "";
      let currentLine = lines[0];
      let index = 0;
      while (currentLine !== "result") {
        ++index;
        const newline = lines.shift();
        if (newline != null) {
          currentLine = newline;
          source += currentLine;
        }
      }

      lines.shift();

      let result = "";
      currentLine = lines[index];
      while (currentLine !== "") {
        const newline = lines.shift();
        if (!newline) {
          break;
        }

        currentLine = newline;
        result += currentLine;
      }

      const suite = {
        source,
        result: result && JSON.parse(result) || result,
      };

      if (name.startsWith("+")) {
        onlies.push(suite);
      } else if (!name.startsWith("-")) {
        rest.push(suite);
      }
    }

    return onlies.length > 0 ? onlies : rest;
  }
}

export { E2ESpecGenerator };
