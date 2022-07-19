- [x] chunk ::= block
- [x] block ::= {stat} [retstat]
- [ ] stat ::= ‘;’ | varlist ‘=’ explist | functioncall | label | break | goto
      Name | do block end | while exp do block end | repeat block until exp | if
      exp then block {elseif exp then block} [else block] end | for Name ‘=’ exp
      ‘,’ exp [‘,’ exp] do block end | for namelist in explist do block end |
      function funcname funcbody | local function Name funcbody | local namelist
      [‘=’ explist]
- [x] retstat ::= return [explist] [‘;’]
- [x] label ::= ‘::’ Name ‘::’
- [x] funcname ::= Name {‘.’ Name} [‘:’ Name]
- [x] varlist ::= var {‘,’ var}
- [ ] var ::= Name | prefixexp ‘[’ exp ‘]’ | prefixexp ‘.’ Name
- [x] namelist ::= Name {‘,’ Name}
- [x] explist ::= exp {‘,’ exp}
- [ ] exp ::= nil | false | true | Numeral | LiteralString | ‘...’ | functiondef
      | prefixexp | tableconstructor | exp binop exp | unop exp
- [ ] prefixexp ::= var | functioncall | ‘(’ exp ‘)’
- [ ] functioncall ::= prefixexp args | prefixexp ‘:’ Name args
- [ ] args ::= ‘(’ [explist] ‘)’ | tableconstructor | LiteralString
- [x] functiondef ::= function funcbody
- [x] funcbody ::= ‘(’ [parlist] ‘)’ block end
- [x] parlist ::= namelist [‘,’ ‘...’] | ‘...’
- [ ] tableconstructor ::= ‘{’ [fieldlist] ‘}’
- [ ] fieldlist ::= field {fieldsep field} [fieldsep]
- [x] field ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
- [ ] fieldsep ::= ‘,’ | ‘;’
- [ ] binop ::= ‘+’ | ‘-’ | ‘*’ | ‘/’ | ‘//’ | ‘^’ | ‘%’ | ‘&’ | ‘~’ | ‘|’ |
      ‘>>’ | ‘<<’ | ‘..’ | ‘<’ | ‘<=’ | ‘>’ | ‘>=’ | ‘==’ | ‘~=’ | and | or
- [ ] unop ::= ‘-’ | not | ‘#’ | ‘~’
