Task Assistant Configuration Schema — v1 (DRAFT)

Status: Draft (Phase 3.1)
Version: 1.0.0-draft
Last Updated: 2025-12-29
Scope: Repo preparation, enforcement determinism, telemetry explainability, Marketplace safety

1. Purpose of This Document

This document defines the authoritative configuration schema for the Task Assistant GitHub App.

The configuration schema is a public contract that governs:

Repo preparation (prepare-repo)

Enforcement behavior

Telemetry generation and explanation

Marketplace-safe installation behavior

No Task Assistant behavior may rely on undocumented configuration assumptions.

2. Design Principles (Normative)

The configuration schema follows these principles:

Config is the single source of truth

Declared intent must be enforced

All behavior must be explainable from config

No silent defaults

No undocumented normalization

Marketplace-safe by default

3. Versioning
version: 1


version is required

Schema-breaking changes require a new major version

Runtime behavior must match the declared schema version exactly

4. Top-Level Structure
version: 1

labels: []
milestones: []
tracks: {}
enforcement: {}
telemetry: {}


All top-level keys are explicit.
Unknown keys are ignored only if documented as extensible.

5. Labels
5.1 Purpose

Labels declared in config are authoritative.

If a label is declared:

prepare-repo must ensure it exists

Enforcement logic may rely on it

Telemetry may reference it as an input

Labels not declared in config are considered unmanaged.

5.2 Schema
labels:
  - name: string            # required, exact match
    color: string           # required, hex without '#'
    description: string     # required

5.3 Guarantees

For every label declared:

In --dry-run:

Missing labels must be reported

Drift (color/description) must be reported

In normal mode:

Missing labels must be created

Drift must be reconciled

Labels must never be silently ignored

Labels are considered “managed” by declaration, not by hierarchy.

5.4 Example (Current Phase 3)
labels:
  - name: phase-3
    description: Phase 3 work
    color: "0E8A16"

  - name: phase-3.1
    description: Phase 3.1 Telemetry Enhancements
    color: "1D76DB"

  - name: telemetry
    description: Telemetry and evidence
    color: "5319E7"

  - name: enforcement
    description: Enforcement logic
    color: "B60205"

  - name: quality-gate
    description: Quality enforcement gates
    color: "7057FF"

  - name: marketplace
    description: Marketplace readiness
    color: "D93F0B"

6. Milestones
6.1 Purpose

Milestones represent capability phases, not sprints.

They are used for:

Enforcement scoping

Telemetry aggregation

Marketplace validation readiness

6.2 Schema
milestones:
  - name: string        # human-readable, canonical
    slug: string        # optional, explicit if different
    description: string

6.3 Rules

name is the canonical reference

slug is optional but must be explicit if used

Implicit slugification is not allowed

Telemetry must reference the canonical name

6.4 Example
milestones:
  - name: "Phase 3.1 – Telemetry Enhancements"
    slug: "phase-3-1"
    description: Telemetry determinism and evidence capture

7. Tracks
7.1 Purpose

Tracks define work classification, not priority.

7.2 Schema
tracks:
    - name: string
      label: string
      description: string
      default_milestone_pattern: string

7.3 Example
tracks:
  - id: sprint
    label: track/sprint
    description: Active sprint work
    default_milestone_pattern: "Sprint {{sprint}}"

  - id: backlog
    label: track/backlog
    description: Planned but unscheduled work

  - id: support
    label: track/support
    description: User-facing or operational support work

  - id: ops
    label: track/ops
    description: Infrastructure and maintenance tasks

8. Enforcement
8.1 Purpose

Enforcement rules define what Task Assistant is allowed to do.

No enforcement may occur without:

A config rule

A telemetry decision record

8.2 Schema (Illustrative)
enforcement:
  require_track: true
  require_milestone: true
  block_untracked_issues: false


Enforcement rules are opt-in and explicit.

9. Telemetry
9.1 Purpose

Telemetry exists to explain behavior, not just record events.

9.2 Schema (High-Level)
telemetry:
  enabled: true
  decision_records: true
  correlation_ids: true

9.3 Guarantees

Every enforcement action must emit a decision record

Decision records must reference config inputs

Missing telemetry is a safe failure

10. Validation Rules
10.1 Schema Validation

Missing required fields → hard failure

Unknown keys → warning unless documented

Type mismatch → hard failure

10.2 Runtime Validation

Declared labels not enforced → Phase 3 violation

Undocumented normalization → invalid behavior

Enforcement without telemetry → invalid behavior

11. Non-Goals (Explicit)

This schema does not define:

Performance tuning

Scaling behavior

Stress thresholds

Adoption heuristics

These belong to Phase 4+.

12. Phase 3 Lock Conditions

Schema v1 must be locked before:

Phase 3.2 (Hygiene & Enforcement)

Marketplace submission

Public documentation release

13. Open Questions (Tracked)

Label deletion policy (future)

Schema extensibility mechanism

Multi-config support

These are explicitly deferred.

Summary (Normative)

If behavior cannot be explained from this schema, the behavior is invalid.

This draft now:

Matches observed validation evidence

Explains prepare-repo expectations

Removes implicit behavior

Minimizes schema complexity

Is Phase-3-correct

