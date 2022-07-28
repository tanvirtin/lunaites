lint:
	deno lint

fmt:
	deno fmt --check

unit-tests:
	deno test -A --unstable ./*/*.unit.test.ts

smoke-tests:
	deno test -A --unstable ./*/*.smoke.test.ts

integration-tests:
	deno test -A --unstable ./*/*.integration.test.ts

snapshot-tests:
	deno test -A ./*/*.snapshot.test.ts

snapshot-tests-update:
	deno test -A ./*/*.snapshot.test.ts -- --update

tests:
	deno test -A --unstable ./*/*.*.test.ts

coverage: 
	deno test -A --coverage=cov/ > /dev/null; deno coverage cov/

check: lint fmt tests

profile:
	deno run -A ./parser/profile.ts

compile: 
	deno compile -A -o ./bin/lunaites mod.ts

watch:
	deno run -A ./core/scratchpad/watch.ts

build: check compile