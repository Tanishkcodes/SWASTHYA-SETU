import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
try {
  await db.exec("CREATE TABLE appointments(status text CHECK(status IN ('confirmed','completed','cancelled','no_show')))");
  await db.exec(await fs.readFile('supabase/migrations/20260904020000_allow_consultation_status.sql','utf8'));
  await db.exec("INSERT INTO appointments VALUES ('confirmed'),('completed'),('cancelled'),('no_show')");
  await db.exec("UPDATE appointments SET status='in_consultation' WHERE status='confirmed'");
  assert.equal((await db.query("SELECT count(*) FROM appointments WHERE status='in_consultation'")).rows[0].count, 1);
  await assert.rejects(db.exec("INSERT INTO appointments VALUES ('invalid')"));
  console.log('PASS: consultation starts, previous statuses preserved, invalid status rejected');
} finally { await db.close(); }
