/**
 * @jest-environment node
 */

/**
 * Regression guard for the handle_new_user() signup trigger.
 *
 * Background: migration 20260423000000 rewrote handle_new_user() to persist
 * invited_at but accidentally hardcoded role='client', which mis-stamped every
 * self-registered challenger as a client (they then showed up as "Active
 * clients" in the admin Clients list). Fixed in 20260620000000.
 *
 * The Postgres trigger can't be exercised by the mocked-Supabase integration
 * suite, so this guards the migration contract statically: whichever migration
 * defines handle_new_user() LAST must (a) default the role to 'challenger' via
 * COALESCE over user_metadata, and (b) keep persisting invited_at. Either being
 * dropped by a future edit is the exact class of regression that caused the bug.
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const DEFINES_TRIGGER = /CREATE OR REPLACE FUNCTION public\.handle_new_user/;

/** The migration file (latest by timestamp-prefixed name) that last defines handle_new_user(). */
function latestTriggerMigration(): { file: string; sql: string } {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // timestamp prefix => lexical sort is chronological

  const defining = files
    .map((file) => ({ file, sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8") }))
    .filter(({ sql }) => DEFINES_TRIGGER.test(sql));

  if (defining.length === 0) {
    throw new Error("No migration defines public.handle_new_user()");
  }
  return defining[defining.length - 1];
}

describe("handle_new_user() trigger migration contract", () => {
  // Whitespace-normalized SQL of the winning definition, so the assertions
  // are robust to formatting/indentation changes.
  const { file, sql } = latestTriggerMigration();
  const normalized = sql.replace(/\s+/g, " ");

  it("is defined by the expected latest migration", () => {
    expect(file).toBe("20260620000000_restore_challenger_default_role_in_trigger.sql");
  });

  it("defaults new self-signups to the challenger role", () => {
    // The whole point: a signup with no role in metadata must become a challenger.
    expect(normalized).toContain("COALESCE(NEW.raw_user_meta_data->>'role', 'challenger')");
  });

  it("does not pass a hardcoded role literal as the inserted role", () => {
    // Guards against a future rewrite reintroducing `..., 'client',` (or
    // `'challenger'`) as the role argument instead of the COALESCE default.
    expect(normalized).not.toMatch(
      /raw_user_meta_data->>'full_name', 'User'\s*\),?\s*'(client|challenger)'/
    );
  });

  it("still persists invited_at from user_metadata (keeps the invite-race fix)", () => {
    expect(normalized).toContain("NEW.raw_user_meta_data ? 'invited_at'");
    expect(normalized).toContain("(NEW.raw_user_meta_data->>'invited_at')::timestamptz");
  });
});
