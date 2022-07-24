lint:
	deno lint

fmt:
	deno fmt --check

unit-tests:
	deno test -A --unstable ./*/*.unit.test.ts

smoke-tests:
	export LUNAITES_PROFILING=false
	deno test -A --unstable ./*/*.smoke.test.ts

integration-tests:
	export LUNAITES_PROFILING=false
	deno test -A --unstable ./*/*.integration.test.ts

tests:
	export LUNAITES_PROFILING=false
	deno test -A --unstable ./*/*.*.test.ts

coverage: 
	deno test -A --coverage=cov/ > /dev/null; deno coverage cov/

check: lint fmt tests

profile:
	export LUNAITES_PROFILING=true
	deno run -A ./parser/profile.ts

compile: 
	deno compile -A -o ./bin/lunaites mod.ts

build: check compile