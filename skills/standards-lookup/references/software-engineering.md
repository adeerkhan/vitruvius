# Software Engineering Standards

## Scope

Software engineering standards are less prescriptive than structural codes —
they focus on process, quality attributes, and documentation rather than
"shall" calculations. The most relevant for research and design work are
quality models (ISO/IEC 25010), requirements (IEEE 830), and security
(OWASP, IEEE 1012). Unlike structural standards, many are freely available.

## Key standards

| Standard | Title | Access | What it covers |
|---|---|---|---|
| ISO/IEC 25010 | Systems and Software Engineering — System and Software Quality Models | Paywashed (ISO) | Quality model: functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, portability |
| ISO/IEC 25010:2011 | (same, 2011 edition) | Paywalled | The most-cited software quality model |
| IEEE 830 | Recommended Practice for Software Requirements Specifications | Paywalled (IEEE) | SRS structure, characteristics of good requirements |
| IEEE 1012 | System and Software Verification and Validation | Paywalled (IEEE) | V&V processes, integrity levels |
| IEEE 12207 | Systems and Software Engineering — Software Life Cycle Processes | Paywalled (IEEE) | Process framework for software life cycle |
| IEEE 730 | Software Quality Assurance Processes | Paywalled (IEEE) | SQA planning, activities, documentation |
| OWASP ASVS | Application Security Verification Standard | FREE (owasp.org) | Security requirements and verification levels (L1/L2/L3) |
| OWASP Top 10 | Top 10 Web Application Security Risks | FREE (owasp.org) | Most critical web application security risks |
| NIST SSDF | Secure Software Development Framework | FREE (NIST) | Secure development practices (SP 800-218) |
| NIST 800-53 | Security and Privacy Controls | FREE (NIST) | Control catalog for information systems |
| ISO/IEC 15026 | System and Software Assurance | Paywalled | Assurance cases, safety/security claims |
| IEEE 1471 / ISO/IEC 42010 | Recommended Practice for Architectural Description | Paywalled | Software architecture description |
| IEEE 829 | Software Test Documentation | Paywalled | Test plan, case, procedure, report formats |
| SWEBOK | Guide to the Software Engineering Body of Knowledge | FREE (IEEE Computer Society, some versions) | Knowledge areas of software engineering |

## Free alternatives (use these first)

| Resource | URL | What it covers |
|---|---|---|
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | Security requirements by verification level |
| OWASP Top 10 | https://owasp.org/www-project-top-ten/ | Critical web security risks |
| NIST SSDF (SP 800-218) | https://csrc.nist.gov/publications/detail/sp/800-218/final | Secure development practices |
| NIST 800-53 | https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final | Security control catalog |
| SWEBOK v3 | https://www.computer.org/education/bodies-of-knowledge/software-engineering | Software engineering knowledge areas |

## Quality model: ISO/IEC 25010

The most-cited software quality model. Eight characteristics:

| Characteristic | Sub-characteristics (examples) |
|---|---|
| Functional suitability | Functional completeness, correctness, appropriateness |
| Performance efficiency | Time behavior, resource utilization, capacity |
| Compatibility | Co-existence, interoperability |
| Usability | Appropriateness recognizability, learnability, operability, user error protection, user interface aesthetics, accessibility |
| Reliability | Maturity, availability, fault tolerance, recoverability |
| Security | Confidentiality, integrity, non-repudiation, accountability, authenticity |
| Maintainability | Modularity, reusability, analyzability, modifiability, testability |
| Portability | Adaptability, installability, replaceability |

When a claim references "software quality," verify which characteristic and
sub-characteristic is meant — "quality" is ambiguous without this.

## Security standards hierarchy

For software security research, the common hierarchy is:

1. **OWASP Top 10** — awareness-level risk list (not a requirements spec)
2. **OWASP ASVS** — verifiable security requirements (L1/L2/L3 by rigor)
3. **NIST 800-53** — control catalog for federal systems (US)
4. **NIST SSDF** — secure development process (complements 800-53)
5. **ISO/IEC 27001/27002** — information security management (international)

Do not treat the OWASP Top 10 as a requirements specification — it is a risk
awareness document. For verifiable security requirements, use OWASP ASVS or
NIST 800-53.

## Mandatory-language conventions

Software standards use the same obligation levels as other engineering
standards, but enforcement is weaker (most are process standards, not
building codes):

- **"shall"** — mandatory (in the standard's own terms)
- **"should"** — recommended
- **"may"** — permitted
- **"can"** — possible (not an obligation)

Note: compliance with ISO/IEC 25010 or IEEE 830 is rarely legally mandated
(unlike AISC 360 in US building codes). These are best-practice references,
not legal requirements, unless a contract or regulation invokes them.

## Known conflicts and cross-checks

| Conflicts with | Issue |
|---|---|
| NIST 800-53 vs ISO/IEC 27001 | Different control structures; NIST is US-federal-specific, ISO is international. Mapping exists but is not 1:1. |
| OWASP ASVS vs NIST 800-53 | ASVS is application-layer; NIST 800-53 is system/organization-layer. Complementary, not conflicting. |
| IEEE 830 vs ISO/IEC 25010 | IEEE 830 is requirements structure; ISO 25010 is quality model. Different purposes. |

## Jurisdiction notes

- **US federal software:** NIST 800-53 + NIST SSDF govern. FedRAMP for cloud.
- **US commercial software:** No single governing standard. OWASP, ISO 25010,
  and IEEE standards are best-practice references.
- **EU:** ETSI standards, GDPR for data protection (not a software engineering
  standard but constrains design).
- **Safety-critical software:** IEC 61508 (functional safety), DO-178C
  (avionics), ISO 26262 (automotive) — these ARE legally mandated in their
  domains and use strict "shall" language.
- **Medical software:** IEC 62304 (software life cycle), FDA QSR — mandated for
  medical device software.

## When to use

Use this reference when the research question involves:
- Software quality attributes or measurement
- Requirements specification structure
- Security requirements or verification levels
- Software process or life cycle
- Safety-critical software standards (IEC 61508, DO-178C, ISO 26262)

Do NOT use for: coding style (use project conventions), language syntax
(use language docs), or framework-specific questions (use framework docs).
