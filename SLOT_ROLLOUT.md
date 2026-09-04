# Shared slot inventory rollout

The compatible `slot-gateway` is deployed and uses the existing schedule and availability RPCs. Live verification returned 21 windows without applying a database migration. The capacity and consultation schema migration below remains **not deployed**: automatic approval review rejected live database validation because it involved schema/data writes, even within a rollback transaction.

## Change to approve

Apply `supabase/migrations/20260904010000_unified_slot_inventory.sql` to project `pzaqzwmpynlqxsclbesj` after approval. Slot visibility no longer depends on this migration.

- Replace randomized 2–4 capacity with a doctor-level default of six places per 30-minute window.
- Increase existing open, future windows with capacity 2–4 to the doctor baseline; keep closed windows closed and higher capacities unchanged. Existing low-capacity windows cannot be distinguished from manually configured ones in the old schema, so this reset requires approval.
- Add consultation start/end timestamps, a single-active-consultation constraint, shared capacity validation and an aggregate inventory endpoint.
- Preserve appointment IDs and tokens; make a retry of a successful reschedule return the existing result.
- If existing duplicate active consultations prevent the unique constraint, the migration rolls back; resolve those records with the clinician before retrying.

## Runtime behavior

Booking and rescheduling use the same inventory response and refresh every five seconds while the page is visible, plus on focus and local booking/consultation events. Read requests coalesce in the client and within each edge isolate; the edge cache lasts 1.5 seconds. Final booking and rescheduling still recheck capacity atomically in PostgreSQL. Displayed availability is a snapshot, never a reservation.

The gateway forwards the caller's authorization and uses the public key, not a service-role key. It allows only inventory, booking and rescheduling calls. The in-flight limits are per edge isolate; they are not a globally distributed waiting-room service or a substitute for load testing. Authentication remains the existing authentication system.

Server failures no longer create local-only reschedules or pretend consultation changes succeeded. The deployed gateway preserves existing server capacities, generates missing schedules through the existing RPC, and combines schedule labels with live inventory for both booking flows.

## Validation

`node scripts/test-slot-database.mjs` runs the migration and synthetic SQL checks in isolated PGlite PostgreSQL, without contacting production. `node --test scripts/test-slot-gateway.mjs scripts/test-voice-stack.mjs` checks request coalescing, bounded writes, exact action dispatch and voice regressions. This is not a production throughput benchmark.

`node scripts/check-slot-languages.mjs` exercises real model interpretation of natural 9:30 AM rescheduling requests in all nine languages using synthetic actions only. Provider failures are reported separately from incorrect interpretations.

Provider references used during recovery: [Gemini models](https://ai.google.dev/gemini-api/docs/models) and [NVIDIA model catalog](https://integrate.api.nvidia.com/v1/models). Catalog presence does not guarantee access for the configured account.
