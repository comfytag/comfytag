import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { retryOnPortContention } from '../../foundation/test-support/retry-port-contention.js';
import { resetAppConfigForTests } from '../../../config/index.js';

/**
 * Connects the AMBIENT default `mongoose.connection` (not an isolated
 * `mongoose.createConnection()`) to an in-memory replica set.
 *
 * This is deliberately different from the Phase 1 foundation tests'
 * isolated-connection pattern: the legacy `apps/api/models/User.js`
 * registers its model via `mongoose.model("User", UserSchema)` against
 * the ambient default connection only, and `withTransaction()` also
 * defaults to `mongoose.connection`. Phase 2's identity/organization code
 * needs both, so tests connect the ambient default instead — the same
 * approach the pre-existing legacy tests use via `test-utils/db.ts`,
 * just backed by an in-memory replica set instead of requiring Docker.
 *
 * A replica set (not a single `MongoMemoryServer`) is required because
 * `createOrganizationWithOwner` uses a multi-document transaction.
 */
let replSet: MongoMemoryReplSet | undefined;

export async function connectAmbientMemoryDb(): Promise<void> {
  replSet = await retryOnPortContention(() => MongoMemoryReplSet.create({ replSet: { count: 1 } }));
  const uri = replSet.getUri();
  await mongoose.connect(uri);
  // Phase 4B's domain services call getAppConfig() (e.g. for
  // reservationHoldMinutes), whose Joi schema requires a valid
  // MONGODB_URI/MONGO to validate at all — set it to the real, live test
  // URI (not a dummy placeholder) so config validation reflects reality,
  // and reset the memoized singleton so each test file's own env is picked
  // up fresh rather than a stale value from a previous process reuse.
  process.env.MONGO = uri;
  resetAppConfigForTests();
}

export async function disconnectAmbientMemoryDb(): Promise<void> {
  if (!replSet) return; // connectAmbientMemoryDb never succeeded — nothing to tear down
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await replSet.stop();
  replSet = undefined;
  resetAppConfigForTests();
}

export async function clearAmbientCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
