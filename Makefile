tests:
	deno test -A --unstable

unit-tests:
	deno test -A --unstable ./test/unit/

smoke-tests:
	deno test -A --unstable ./test/smoke/

lint:
	deno lint

fmt:
	deno fmt --check

bench:
	deno run bench/Tokenizer.bench.ts

check: lint fmt tests
