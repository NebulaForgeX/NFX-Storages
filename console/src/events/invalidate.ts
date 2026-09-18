import { EventEmitter, defineEvents, type EventNamesOf } from "nfx-ui/events";
import { singleton } from "nfx-ui/utils";

export const invalidateEvents = defineEvents({
  USERS: "STORAGES:INVALIDATE_USERS",
  GROUPS: "STORAGES:INVALIDATE_GROUPS",
  POLICIES: "STORAGES:INVALIDATE_POLICIES",
  ACCESS_KEYS: "STORAGES:INVALIDATE_ACCESS_KEYS",
  BUCKETS: "STORAGES:INVALIDATE_BUCKETS",
  BUCKET_SETTINGS: "STORAGES:INVALIDATE_BUCKET_SETTINGS",
  OBJECTS: "STORAGES:INVALIDATE_OBJECTS",
  LIFECYCLE: "STORAGES:INVALIDATE_LIFECYCLE",
  REPLICATION: "STORAGES:INVALIDATE_REPLICATION",
  EVENTS: "STORAGES:INVALIDATE_EVENTS",
  EVENTS_TARGET: "STORAGES:INVALIDATE_EVENTS_TARGET",
  TIERS: "STORAGES:INVALIDATE_TIERS",
  KMS: "STORAGES:INVALIDATE_KMS",
  PERFORMANCE: "STORAGES:INVALIDATE_PERFORMANCE",
  LICENSE: "STORAGES:INVALIDATE_LICENSE",
});

type InvalidateEvent = EventNamesOf<typeof invalidateEvents>;

class InvalidateEventEmitter extends EventEmitter<InvalidateEvent> {
  constructor() {
    super(invalidateEvents);
  }
}

export const invalidateEventEmitter = new (singleton(InvalidateEventEmitter))();
