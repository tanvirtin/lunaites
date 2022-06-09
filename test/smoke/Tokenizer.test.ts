import { Tokenizer, TokenType } from "../../src/Tokenizer.ts";
import { exec } from "https://deno.land/x/exec/mod.ts";
import { globToRegExp } from "https://deno.land/x/std@0.63.0/path/glob.ts";
import { walkSync } from "https://deno.land/std@0.77.0/fs/mod.ts";
import {
  afterAll,
  describe,
  it,
} from "https://deno.land/std@0.141.0/testing/bdd.ts";

function getRepositories() {
  return [
    "https://github.com/tanvirtin/vgit.nvim.git",
    "https://github.com/koreader/koreader",
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
  await Promise.all(getRepositories().map((link) => cloneGitRepository(link)));

  const files = walkSync(`${Deno.cwd()}/test/fixture/`, {
    match: [globToRegExp("**/**/*.lua")],
  });

  // files are bound by closure, in other words the closure acts as a getter for the private variable files.
  return () => files;
}

const ls = await fetchLuaSources();

describe("Tokenizer", () => {
  afterAll(async () => {
    await Promise.all(
      getRepositories().map((link) => deleteGitRepository(link)),
    );
  });

  for (const { path } of ls()) {
    it(`validating source file: ${path}`, async () => {
      let token;
      const text = await Deno.readTextFile(path);
      const tokenizer = new Tokenizer(text);

      while (token?.type !== TokenType.EOF) {
        token = tokenizer.tokenize();
      }
    });
  }
});
