# Provenance Sidecar — Software Engineering Tests

**Generated:** 2026-09-05
**Method:** Vitruvius Engineering Research
**Generator:** opencode/mimo-v2.5-free

## Files Generated

| File | Purpose | Status |
|------|---------|--------|
| outputs/.plans/test1-oauth-pkce.md | Test 1 research plan | COMPLETED |
| outputs/.plans/test2-k8s-pod-lifecycle.md | Test 2 research plan | COMPLETED |
| outputs/.plans/test3-btree-vs-lsmtree.md | Test 3 research plan | COMPLETED |
| outputs/.drafts/test1-oauth-pkce.md | Test 1 draft findings | VERIFIED |
| outputs/.drafts/test2-k8s-pod-lifecycle.md | Test 2 draft findings | VERIFIED |
| outputs/.drafts/test3-btree-vs-lsmtree.md | Test 3 draft findings | VERIFIED |
| outputs/software-engineering-tests.md | Final consolidated output | DELIVERED |

## Source Verification Log

### Test 1: OAuth 2.0 PKCE
- RFC 7636: https://www.rfc-editor.org/rfc/rfc7636.html — VERIFIED
- RFC 6749: https://www.rfc-editor.org/rfc/rfc6749.html — VERIFIED
- Auth0 Docs: https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow — VERIFIED

### Test 2: Kubernetes Pod Lifecycle
- K8s Docs: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ — VERIFIED
- K8s v1.36: https://v1-36.docs.kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ — VERIFIED
- Pod Conditions: https://kubernetes.io/docs/concepts/workloads/pods/pod-condition/ — VERIFIED

### Test 3: B-Tree vs LSM-Tree
- RocksDB LSM Design: https://facebook-rocksdb-80.mintlify.app/concepts/lsm-design — VERIFIED
- RocksDB Compaction: https://github.com/facebook/rocksdb/wiki/Compaction — VERIFIED
- RocksDB Tuning: https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide — VERIFIED
- PostgreSQL B-Tree: https://www.postgresql.org/docs/current/btree.html — VERIFIED
- FAST'22 Paper: https://www.usenix.org/conference/fast22/presentation/qiao — VERIFIED
- Systems Explained: https://systeminternals.dev/rocksdb/lsm-tree/ — VERIFIED

## Verifier Summary

| Test | Checks Passed | Verdict |
|------|---------------|---------|
| OAuth 2.0 PKCE | 7/7 | PASS |
| K8s Pod Lifecycle | 7/7 | PASS |
| B-Tree vs LSM-Tree | 7/7 | PASS |
| **Total** | **21/21** | **ALL PASS** |

## Reliability Scores

| Test | Score | Notes |
|------|-------|-------|
| OAuth 2.0 PKCE | 5/5 | RFC citations exact |
| K8s Pod Lifecycle | 5/5 | Official docs verbatim |
| B-Tree vs LSM-Tree | 4/5 | Numbers require workload context |
| **Average** | **4.7/5** | |
