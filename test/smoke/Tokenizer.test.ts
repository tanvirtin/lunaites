import { Tokenizer, TokenType } from "../../src/Tokenizer.ts";
import { exec } from "https://deno.land/x/exec/mod.ts";
import { relative } from "https://deno.land/std@0.102.0/path/mod.ts";
import { globToRegExp } from "https://deno.land/x/std@0.63.0/path/glob.ts";
import { walkSync } from "https://deno.land/std@0.77.0/fs/mod.ts";
import {
  afterAll,
  describe,
  it,
} from "https://deno.land/std@0.141.0/testing/bdd.ts";

function makeRelativePath(path: string) {
  return relative(`${Deno.cwd()}/test/fixture`, path);
}

function getRepositories() {
  return [
    "https://github.com/tanvirtin/vgit.nvim.git",
    "https://github.com/koreader/koreader",
    "https://github.com/Neopallium/lua-pb.git",
    "https://github.com/luvit/luvit.git",
    "https://github.com/leafo/pgmoon.git",
    "https://github.com/lua/lua",
    "https://github.com/Neopallium/llvm-lua.git",
    "https://github.com/moteus/lua-path.git",
  ];
}

function getRepoName(link: string) {
  const fragments = link.split("/");

  return fragments[fragments.length - 1];
}

function getDerivedProjectPath(repoName: string) {
  return `${Deno.cwd()}/test/fixture/${getRepoName(repoName)}`;
}

function cloneGitRepository(link: string) {
  return exec(["git", "clone", link, getDerivedProjectPath(link)].join(" "));
}

function deleteGitRepository(link: string) {
  return exec(["rm", "-rf", getDerivedProjectPath(link)].join(" "));
}

async function fetchLuaSources() {
  await Promise.all(
    getRepositories().map((link) => {
      console.info(`Cloning ${link}`);

      return cloneGitRepository(link);
    }),
  );

  const files = walkSync(`${Deno.cwd()}/test/fixture/`, {
    match: [globToRegExp("*/**/*.lua")],
  });

  // files are bound by closure, in other words the closure acts as a getter for the private variable files.
  return () => files;
}

function deleteLuaSources() {
  return Promise.all(
    getRepositories().map((link) => deleteGitRepository(link)),
  );
}

await deleteLuaSources();
const ls = await fetchLuaSources();

describe("Tokenizer", () => {
  afterAll(async () => {
    await deleteLuaSources();
  });

  for (const { path } of ls()) {
    it(makeRelativePath(path), async () => {
      let token;
      const text = await Deno.readTextFile(path);
      const tokenizer = new Tokenizer(text);

      while (token?.type !== TokenType.EOF) {
        token = tokenizer.tokenize();
      }
    });
  }
});
