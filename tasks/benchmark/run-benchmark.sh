#!/usr/bin/env bash
# Run the verifier benchmark blind: fresh headless pi session per case,
# ground truth stripped, verifier protocol (agents/verifier.md) as system prompt.
# Usage: bash tasks/benchmark/run-benchmark.sh [case-name-filter] [cases-dir]
set -u
cd "$(dirname "$0")/../.."
FILTER="${1:-}"
CASES="${2:-tasks/benchmark/cases}"
if [ "$CASES" = "tasks/benchmark/cases" ]; then
	OUT="tasks/benchmark/results"
else
	OUT="tasks/benchmark/$(basename "$CASES")-results"
fi
mkdir -p "$OUT"
expected=0
for f in "$CASES"/*/*.md "$CASES"/*.md; do
	[ -f "$f" ] || continue
	name=$(basename "$f" .md)
	[ "$name" = "README" ] && continue
	if [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]]; then continue; fi
	expected=$((expected+1))
done
if [ "$expected" -eq 0 ]; then
	echo "INCOMPLETE: filter matched no benchmark cases" >&2
	exit 1
fi
count=0
for f in "$CASES"/*/*.md "$CASES"/*.md; do
	[ -f "$f" ] || continue
	name=$(basename "$f" .md)
	[ "$name" = "README" ] && continue
	if [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]]; then continue; fi
	# Strip ground truth: cut from the ground-truth marker to EOF
	sed '/^\*\*Ground-truth verdict:\*\*/,$d' "$f" > "$OUT/.blind-$name.md"
	# Leak guard: a blind case must not contain ground-truth material
	if grep -qiE "ground.truth|flaw type" "$OUT/.blind-$name.md"; then
		echo "    LEAK: $name still contains ground-truth material after stripping — aborting"
		rm -f "$OUT/.blind-$name.md"
		exit 1
	fi
	echo "--- running $name"
	if ! pi -p --no-session --no-tools \
		--append-system-prompt agents/verifier.md \
		"Blind verification dispatch. Verify the claimed conclusion below against its evidence items, following your verifier protocol. Ground truth is not provided. Return your report in your Output format, including the MACHINE_VERDICT line. Case:

$(cat "$OUT/.blind-$name.md")" \
		> "$OUT/$name-result.md" 2>"$OUT/.err-$name.log"; then
		echo "    PROCESS FAILED (see $OUT/.err-$name.log)"
		rm -f "$OUT/.blind-$name.md"
		exit 1
	fi
	if node scripts/score-benchmark.mjs --case "$f" "$OUT/$name-result.md" >/dev/null; then
		count=$((count+1)); echo "    ok"
	else
		echo "    INVALID MACHINE_VERDICT (see $OUT/.err-$name.log)"
	fi
	rm -f "$OUT/.blind-$name.md"
done
echo "scored runs with MACHINE_VERDICT: $count"
if [ "$count" -ne "$expected" ]; then
	echo "INCOMPLETE: expected $expected runs, scored $count" >&2
	exit 1
fi
