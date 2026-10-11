// ws.mjs — whitespace-insensitive matcher shared by the behavioural suites.
//
// A skill's rule is prose that re-wraps on every edit, so a suite that pins it
// with a literal-whitespace regex goes green the moment the line breaks move.
// `ws("make sure that the file exists")` matches that phrase across any line
// break or indentation. Fifteen suites each carried their own copy; this is the
// one definition, so a fix to the escaping lands everywhere.
export function ws(s) {
  return new RegExp(
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(/\s+/).join("\\s+"),
    "i",
  );
}
