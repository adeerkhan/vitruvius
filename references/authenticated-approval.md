# Authenticated Approval Interface

The habit skill captures standing research conventions. The proposal skill
captures user preferences. Both need an approval workflow that is:
- **Authenticated** — the approver's identity is verified
- **Retentive** — the approval has a defined retention period
- **Integrated** — the approval is loaded and applied in future runs

This document defines the interface. The host enforces it.

## Approval States

| State | Meaning |
|-------|---------|
| `PENDING` | The approval request has been created but not yet approved |
| `APPROVED` | The approval has been granted by an authenticated user |
| `REJECTED` | The approval has been denied by an authenticated user |
| `EXPIRED` | The approval has passed its retention period |
| `REVOKED` | The approval was revoked by the approver or an admin |

## Approval Record

```json
{
  "schema": "vitruvius-approval.v1",
  "id": "appr_001",
  "type": "habit|proposal|standing-retention",
  "target": "outputs/.habits/concise-tables.json",
  "target_sha256": "...",
  "target_bytes": 1234,
  "requested_by": "agent:engineering-research",
  "requested_at": "2026-09-27T12:00:00Z",
  "status": "PENDING",
  "approved_by": null,
  "approved_at": null,
  "expires_at": null,
  "retention_days": 90,
  "revoked_by": null,
  "revoked_at": null,
  "notes": ""
}
```

## Authentication

The approver's identity is verified by the host. The approval record captures:
- **Who** approved (user identity, not agent identity)
- **When** they approved (timestamp)
- **What** they approved (target artifact + SHA-256 + byte count)
- **How long** it remains valid (retention period)

## Retention Policy

| Approval type | Default retention | Extension |
|---------------|-------------------|-----------|
| Habit | 90 days | User can extend or revoke |
| Proposal | 30 days | User can extend or revoke |
| Standing retention | 365 days | Requires re-approval after 1 year |

An expired approval is treated as PENDING — it does not auto-approve. The
user must re-approve.

## Workflow Integration

1. **Request** — the agent creates an approval record and notifies the user
2. **Approve** — the user approves via the host (authenticated)
3. **Apply** — the approval is loaded and applied in future runs
4. **Expire** — the approval expires after the retention period
5. **Revoke** — the user or an admin revokes the approval

## Host Enforcement

The host enforces:
- **Authentication** — only authenticated users can approve or revoke
- **Retention** — expired approvals are not applied
- **Integrity** — the target artifact's SHA-256 and byte count must match
- **Isolation** — one user's approvals do not affect another user's runs

## Open Questions

- How does the host authenticate users? (OAuth, API key, local identity?)
- How are approval requests surfaced to the user? (Notification, dashboard, email?)
- How are expiring approvals renewed? (Auto-renew, manual re-approval, grace period?)

These are host policy decisions. The interface above is host-agnostic.
