/**
 * @jest-environment node
 */

/**
 * Regression guard for the handle_new_user() signup trigger.
 *
 * Two regressions this guards against:
 *  1. Role mis-stamping (the original bug): migration 20260423000000 rewrote
 *     handle_new_user() and hardcoded role='client', mis-stamping every
 *     self-registered challenger as a client (they showed up as "Active
 *     clients" in the admin Clients list). The default role must be 'challenger'.
 *  2. Privilege escalation: user_metadata is client-controllable via
 *     supabase.auth.signUp({ options: { data: {...} } }) with the public anon
 *     key. The trigger must NEVER derive `role` from raw_user_meta_data, or a
 *     self-registrant could pass role='admin' and gain admin access (admin is
 *     gated solely on profiles.role). Role must be a hardcoded literal.
 *
 * The Postgres trigger can't be exercised by the mocked-Supabase integration
 * suite, so this guards the migration contract statically against whichever
 * migration defines handle_new_user() LAST (by timestamp-prefixed filename).
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const DEFINES_TRIGGER = /CREATE OR REPLACE FUNCTION public\.handle_new_user/;

/** The migration (latest by timestamp-prefixed name) that last defines handle_new_user(). */
function latestTriggerMigration(): { file: string; sql: string } {
  const defining = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort() // timestamp prefix => lexical sort is chronological
    .map((file) => ({ file, sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8") }))
    .filter(({ sql }) => DEFINES_TRIGGER.test(sql));

  if (defining.length === 0) {
    throw new Error("No migration defines public.handle_new_user()");
  }
  return defining[defining.length - 1];
}

describe("handle_new_user() trigger migration contract", () => {
  // Executable SQL of the winning definition with `--` line comments stripped
  // (so assertions inspect the actual logic, not prose in comments) and
  // whitespace normalized (so they're robust to formatting/indentation).
  const { sql } = latestTriggerMigration();
  const normalized = sql
    .replace(/--.*$/gm, "") // drop SQL line comments
    .replace(/\s+/g, " ");

  it("defaults new self-signups to the challenger role", () => {
    // A signup with no role in metadata must become a challenger, not a client.
    // The role argument is the 4th column (after id, email, full_name) in the INSERT.
    expect(normalized).toMatch(/raw_user_meta_data->>'full_name', 'User'\s*\),?\s*'challenger'/);
  });

  it("never derives role from client-controllable user_metadata (no privilege escalation)", () => {
    // user_metadata is attacker-controllable at signup; reading role from it
    // would let a self-registrant claim role='admin'. The role must be a
    // hardcoded literal, so raw_user_meta_data->>'role' must NOT appear.
    expect(normalized).not.toContain("raw_user_meta_data->>'role'");
  });

  it("still persists invited_at from user_metadata (keeps the invite-race fix)", () => {
    expect(normalized).toContain("NEW.raw_user_meta_data ? 'invited_at'");
    expect(normalized).toContain("(NEW.raw_user_meta_data->>'invited_at')::timestamptz");
  });
});
