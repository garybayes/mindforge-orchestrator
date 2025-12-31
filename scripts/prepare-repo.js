#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import yaml from "yaml";

/* ──────────────────────────────
   CLI args
   ────────────────────────────── */
const args = process.argv.slice(2);
const repo = args.find(a => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");

if (!repo) {
  console.error("Usage: prepare-repo <owner/repo> [--dry-run]");
  process.exit(1);
}

/* ──────────────────────────────
   Command helpers
   ────────────────────────────── */
const runRead = (cmd) => {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
};

const runWrite = (cmd) => {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return "";
  }
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
};

/* ──────────────────────────────
   Banner
   ────────────────────────────── */
console.log("\nTask Assistant Repo Preparation");
console.log(`Repo: ${repo}`);
console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}\n`);

/* ──────────────────────────────
   Clone repo to temp dir
   ────────────────────────────── */
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ta-prep-"));
runRead(`gh repo clone ${repo} ${tmpDir}`);

const configPath = path.join(tmpDir, ".github", "task-assistant.yml");
if (!fs.existsSync(configPath)) {
  throw new Error("Missing .github/task-assistant.yml");
}

const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

/* ──────────────────────────────
   Labels — Phase 3 Enforcement
   ────────────────────────────── */

// ── System labels (hard invariants; NOT in config)
const SYSTEM_LABELS = [
  { name: "state/stale", color: "CCCCCC", description: "Issue is stale" },
  { name: "state/pinned", color: "0052CC", description: "Issue is pinned" },
  { name: "priority/high", color: "D93F0B", description: "High priority" },
  { name: "priority/medium", color: "FBCA04", description: "Medium priority" },
  { name: "priority/low", color: "0E8A16", description: "Low priority" }
];

// ── Track labels (authoritative; derived from existing tracks schema)
const TRACK_LABELS = Array.isArray(config.tracks)
  ? config.tracks
      .filter(t => t && typeof t.label === "string" && t.label.trim().length > 0)
      .map(t => ({
        name: t.label,
        color: "0052CC",
        description:
          typeof t.description === "string" && t.description.trim().length > 0
            ? t.description.trim()
            : `Track: ${t.id ?? t.label}`
      }))
  : [];

// ── Project / phase / outcome labels (from config; EXACTLY as declared)
const CONFIG_LABELS = Array.isArray(config.labels) ? config.labels : [];

// ── Merge all declared labels (later sources override earlier ones by name)
const declaredLabelsMap = new Map();
for (const l of SYSTEM_LABELS) declaredLabelsMap.set(l.name, l);
for (const l of TRACK_LABELS) declaredLabelsMap.set(l.name, l);
for (const l of CONFIG_LABELS) declaredLabelsMap.set(l.name, l);

const declaredLabels = [...declaredLabelsMap.values()];

// ── Existing labels from repo
const existingLabels = JSON.parse(
  runRead(`gh label list --repo ${repo} --json name,color,description`) || "[]"
);

const existingByName = Object.fromEntries(
  existingLabels.map(l => [
    l.name,
    {
      color: l.color?.toUpperCase(),
      description: l.description || ""
    }
  ])
);

// ── Build reconciliation plan
const labelPlan = { create: [], update: [], skip: [] };

for (const label of declaredLabels) {
  const { name, color, description } = label;

  if (!name || !color || !description) {
    throw new Error(`Invalid label declaration: ${JSON.stringify(label)}`);
  }

  const existing = existingByName[name];

  if (!existing) {
    labelPlan.create.push(label);
    continue;
  }

  const isConfigLabel = CONFIG_LABELS.some(l => l.name === name);

  const colorDrift =
    isConfigLabel && existing.color !== color.toUpperCase();

// Only enforce description drift for config-declared labels
  const descriptionDrift =
    isConfigLabel && existing.description !== description;

  if (colorDrift || descriptionDrift) {
    labelPlan.update.push({ ...label, existing });
  } else {
    labelPlan.skip.push(name);
  }
}

// ── Report plan (always)
console.log("\nLabel reconciliation plan:");

if (labelPlan.create.length) {
  console.log("  Labels to create:");
  labelPlan.create.forEach(l => console.log(`   + ${l.name}`));
}

if (labelPlan.update.length) {
  console.log("  Labels to update:");
  labelPlan.update.forEach(l => console.log(`   ~ ${l.name}`));
}

if (labelPlan.skip.length) {
  console.log("  Labels already matching:");
  labelPlan.skip.forEach(name => console.log(`   = ${name}`));
}

if (!labelPlan.create.length && !labelPlan.update.length) {
  console.log("  ✓ All declared labels already match config");
}

// ── Apply changes (real mode only)
if (!dryRun) {
  for (const l of labelPlan.create) {
    runWrite(
      `gh label create "${l.name}" --repo ${repo} --color "${l.color}" --description "${l.description}"`
    );
  }

  for (const l of labelPlan.update) {
    runWrite(
      `gh label edit "${l.name}" --repo ${repo} --color "${l.color}" --description "${l.description}"`
    );
  }
} else {
  console.log("\nDRY-RUN: No label changes were applied.");
}

/* ──────────────────────────────
   Milestones (STRICT / DECLARATIVE)
   ────────────────────────────── */
const [owner, repoName] = repo.split("/");

const desiredMilestones = Array.isArray(config.milestones)
  ? config.milestones
  : [];

if (!Array.isArray(config.milestones)) {
  console.warn("No milestone definitions found; skipping milestone creation");
}

const existingMilestones = JSON.parse(
  runRead(`gh api repos/${owner}/${repoName}/milestones --paginate`) || "[]"
);

const existingTitles = new Set(existingMilestones.map(m => m.title));

const createdMilestones = [];
const skippedMilestones = [];

for (const m of desiredMilestones) {
  if (!m.id || !m.title || m.due_offset_days == null) {
    console.warn(
      `Skipping invalid milestone (missing id/title/due_offset_days): ${m.title || "unknown"}`
    );
    continue;
  }

  if (existingTitles.has(m.title)) {
    skippedMilestones.push(m.id);
    console.log(`Milestone exists: ${m.title}`);
    continue;
  }

  const dueDate = new Date(
    Date.now() + m.due_offset_days * 24 * 60 * 60 * 1000
  ).toISOString();

  runWrite(
    `gh api repos/${owner}/${repoName}/milestones ` +
    `-f title="${m.title}" ` +
    `-f description="${m.description || ""}" ` +
    `-f due_on="${dueDate}"`
  );

  createdMilestones.push(m.id);
}

/* ──────────────────────────────
   Cleanup
   ────────────────────────────── */
fs.rmSync(tmpDir, { recursive: true, force: true });
