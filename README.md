# Lunaites 🌙

Generates an
[Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) from
Lua source code.

## Why

- Curiosity to learn how programming languages are parsed by implementing one
  for a language widely used by the programming community.
- Lua parsers are mostly written using recursive descent algorithm. Lunaites
  implements a precedence parsing algorithm called Pratt Parsing.
- Understand and utilize
  [Backus–Naur form](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form).

### Supported Lua versions:

- [Lua 5.1](https://www.lua.org/manual/5.1/manual.html)

## Requirements

- [Deno](https://deno.land/#installation) runtime

## Usage

```ts
const { Parser } from './lunaites/parser/mod.ts';

const source = `
local sup = "Hello, world!");
print(sup);
`
const parser = new Parser(source);

const ast = parser.parse();
```

## Tests

Run the following commands

```sh
make smoke-tests
make integration-tests
make snapshot-tests
make unit-tests
```

or

```sh
make tests
```

## Testing scratchpad

Run the following command

```
make watch
```

And then open `lunaites/core/scratchpad/scratchpad` using your favourite text
editor to type or paste in your lua sourcode.

The ast representation of the source code will be piped to standard output as
you make changes to this file.

## Lua 5.1 Grammer

---

```
chunk ::= {stat [`;´]} [laststat [`;´]]

block ::= chunk

stat ::=  varlist `=´ explist | 
        functioncall | 
        do block end | 
        while exp do block end | 
        repeat block until exp | 
        if exp then block {elseif exp then block} [else block] end | 
        for Name `=´ exp `,´ exp [`,´ exp] do block end | 
        for namelist in explist do block end | 
        function funcname funcbody | 
        local function Name funcbody | 
        local namelist [`=´ explist] 

laststat ::= return [explist] | break

funcname ::= Name {`.´ Name} [`:´ Name]

varlist ::= var {`,´ var}

var ::=  Name | prefixexp `[´ exp `]´ | prefixexp `.´ Name 

namelist ::= Name {`,´ Name}

explist ::= {exp `,´} exp

exp ::=  nil | false | true | Number | String | `...´ | function | 
                prefixexp | tableconstructor | exp binop exp | unop exp 

prefixexp ::= var | functioncall | `(´ exp `)´

functioncall ::=  prefixexp args | prefixexp `:´ Name args 

args ::=  `(´ [explist] `)´ | tableconstructor | String 

function ::= function funcbody

funcbody ::= `(´ [parlist] `)´ block end

parlist ::= namelist [`,´ `...´] | `...´

tableconstructor ::= `{´ [fieldlist] `}´

fieldlist ::= field {fieldsep field} [fieldsep]

field ::= `[´ exp `]´ `=´ exp | Name `=´ exp | exp

fieldsep ::= `,´ | `;´

binop ::= `+´ | `-´ | `*´ | `/´ | `^´ | `%´ | `..´ | 
                `<´ | `<=´ | `>´ | `>=´ | `==´ | `~=´ | 
                and | or

	unop ::= `-´ | not | `#´
```

## References:

- https://craftinginterpreters.com/

## Notes:

- Please feel free to leave an issue if you find any problems with this parser.
