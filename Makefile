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

benchmarks:
	deno run benchmark/Tokenizer.benchmark.ts

check: lint fmt tests
