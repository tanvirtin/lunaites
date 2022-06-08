tests:
	deno test -A --unstable

lint:
	deno lint

fmt:
	deno fmt --check

benchmarks:
	deno run benchmark/Tokenizer.benchmark.ts

check: lint fmt tests
