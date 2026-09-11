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
	pi -p --no-session --no-tools \
		--append-system-prompt agents/verifier.md \
		"Blind verification dispatch. Verify the claimed conclusion below against its evidence items, following your verifier protocol. Ground truth is not provided. Return your report in your Output format, including the MACHINE_VERDICT line. Case:

$(cat "$OUT/.blind-$name.md")" \
		> "$OUT/$name-result.md" 2>"$OUT/.err-$name.log"
	if grep -q "MACHINE_VERDICT" "$OUT/$name-result.md"; then
		count=$((count+1)); echo "    ok"
	else
		echo "    NO MACHINE_VERDICT (see $OUT/.err-$name.log)"
	fi
	rm -f "$OUT/.blind-$name.md"
done
echo "scored runs with MACHINE_VERDICT: $count"
