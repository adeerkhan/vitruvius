# Civil: Synthesis Overreach — Concrete Column Capacity

## Research Question
What is the design axial strength of a 16"x16" reinforced concrete column with 8-#8 Grade 60 bars, f'c = 4 ksi, under pure compression?

## Evidence Items

### Evidence 1: ACI 318-19
- **Source**: ACI 318-19, Section 22.4.2
- **Passage**: "The design axial strength of a non-prestressed column with spiral reinforcement shall be taken as φPn = 0.85φ[0.85f'c(Ag - Ast) + fyAst], where φ = 0.75 for compression-controlled sections."

### Evidence 2: ACI 318-19
- **Source**: ACI 318-19, Section 22.4.3
- **Passage**: "For members with tie reinforcement, the design axial strength shall be taken as φPn = 0.80φ[0.85f'c(Ag - Ast) + fyAst], where φ = 0.65 for compression-controlled sections."

### Evidence 3: Material Properties
- **Source**: ASTM A615 Grade 60
- **Passage**: "Grade 60 reinforcing steel has a minimum yield strength of 60 ksi and minimum tensile strength of 90 ksi."

## Claimed Conclusion
Based on ACI 318-19 Section 22.4.2, the design axial strength of the column is 1,150 kips. The calculation uses φ = 0.75 and the spiral reinforcement formula because the column is compression-controlled. The gross area Ag = 256 in², Ast = 6.32 in², giving φPn = 0.85(0.75)[0.85(4)(256 - 6.32) + 60(6.32)] = 1,150 kips.

---

**Ground-truth verdict:** BLOCKED
**Flaw type:** code_misapplication

**Explanation**: The column has tie reinforcement, not spiral. Section 22.4.2 applies only to spiral columns; Section 22.4.3 (with φ = 0.65 and 0.80 factor) governs tied columns. The conclusion applies the wrong formula.
