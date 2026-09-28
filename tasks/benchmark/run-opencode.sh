#!/usr/bin/env bash
# Run the verifier benchmark via opencode run (inside OpenCode).
# Usage: bash tasks/benchmark/run-opencode.sh [case-name-filter] [cases-dir] [model]
set -u
cd "$(dirname "$0")/../.."
FILTER="${1-}"
CASES="${2:-tasks/benchmark/cases}"
MODEL="${3:-opencode-go/longcat-2.5-preview-free}"
OUT="tasks/benchmark/results-opencode"
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
	# Write to a temp file, then move into place only after the run produced
	# output. Shell `>` truncates the target to 0 bytes *before* the command
	# runs, so a crashed or killed run used to leave an empty result file where
	# a tracked result belongs — indistinguishable from a real empty answer.
	tmp="$OUT/.tmp-$name-result.md"
	rm -f "$tmp"
	if ! cmd.exe /c "opencode run --agent verifier --model $MODEL --format json -f $OUT/.blind-$name.md \"Blind verification dispatch. Verify the claimed conclusion below against its evidence items, following your verifier protocol. Ground truth is not provided. Return your report in your Output format, including the MACHINE_VERDICT line. Case:\"" \
		> "$tmp" 2>"$OUT/.err-$name.log"; then
		echo "    PROCESS FAILED (see $OUT/.err-$name.log)"
		rm -f "$OUT/.blind-$name.md" "$tmp"
		exit 1
	fi
	if [ ! -s "$tmp" ]; then
		echo "    EMPTY OUTPUT: run produced no bytes (see $OUT/.err-$name.log)"
		rm -f "$OUT/.blind-$name.md" "$tmp"
		exit 1
	fi
	mv "$tmp" "$OUT/$name-result.md"
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
