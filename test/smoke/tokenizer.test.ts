import { Tokenizer, TokenType } from "../../mod.ts";
import {
  afterAll,
  describe,
  exec,
  globToRegExp,
  it,
  relative,
  walkSync,
} from "../../deps.ts";

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
    "https://github.com/Alloyed/lua-lsp.git",
    "https://github.com/sumneko/lua-language-server.git",
  ];
}

function getTestdataPath() {
  return `${Deno.cwd()}/test/smoke/testdata`;
}

function getRepoName(link: string) {
  const fragments = link.split("/");

  return fragments[fragments.length - 1];
}

function getDerivedProjectPath(repoName: string) {
  return `${getTestdataPath()}/${getRepoName(repoName)}`;
}

function cloneGitRepository(link: string) {
  return exec(["git", "clone", link, getDerivedProjectPath(link)].join(" "));
}

function deleteGitRepository(link: string) {
  return exec(["rm", "-rf", getDerivedProjectPath(link)].join(" "));
}

const isDir = (filename: string): boolean => {
  return Deno.statSync(filename).isDirectory;
};

async function fetchLuaSources() {
  await Promise.all(
    getRepositories().map((link) => {
      console.info(`Cloning ${link}`);

      return cloneGitRepository(link);
    }),
  );

  const files = walkSync(getTestdataPath(), {
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
    if (isDir(path)) {
      continue;
    }

    it(relative(getTestdataPath(), path), async () => {
      let token;
      const text = await Deno.readTextFile(path);
      const tokenizer = new Tokenizer(text);

      while (token?.type !== TokenType.EOF) {
        token = tokenizer.tokenize();
      }
    });
  }
});
