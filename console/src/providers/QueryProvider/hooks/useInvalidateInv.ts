import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";

export function useInvalidateInv() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const map: Array<[string, readonly unknown[]]> = [
      [invalidateEvents.USERS, STORAGES_QUERY_KEYS.users],
      [invalidateEvents.GROUPS, STORAGES_QUERY_KEYS.groups],
      [invalidateEvents.POLICIES, STORAGES_QUERY_KEYS.policies],
      [invalidateEvents.ACCESS_KEYS, STORAGES_QUERY_KEYS.accessKeys],
      [invalidateEvents.BUCKETS, STORAGES_QUERY_KEYS.buckets],
      [invalidateEvents.BUCKET_SETTINGS, STORAGES_QUERY_KEYS.bucketSettings("")],
      [invalidateEvents.OBJECTS, STORAGES_QUERY_KEYS.objects("", "")],
      [invalidateEvents.LIFECYCLE, STORAGES_QUERY_KEYS.lifecycle("")],
      [invalidateEvents.REPLICATION, STORAGES_QUERY_KEYS.replication("")],
      [invalidateEvents.EVENTS, STORAGES_QUERY_KEYS.events("")],
      [invalidateEvents.EVENTS_TARGET, STORAGES_QUERY_KEYS.eventsTarget],
      [invalidateEvents.TIERS, STORAGES_QUERY_KEYS.tiers],
      [invalidateEvents.KMS, STORAGES_QUERY_KEYS.kmsStatus],
      [invalidateEvents.PERFORMANCE, STORAGES_QUERY_KEYS.performance],
      [invalidateEvents.LICENSE, STORAGES_QUERY_KEYS.license],
    ];

    const handlers = map.map(([event, key]) => {
      const cb = () => {
        void queryClient.invalidateQueries({ queryKey: [key[0]] });
        if (event === invalidateEvents.KMS) {
          void queryClient.invalidateQueries({ queryKey: STORAGES_QUERY_KEYS.kmsKeys });
        }
      };
      invalidateEventEmitter.on(event, cb);
      return { event, cb };
    });

    return () => {
      for (const { event, cb } of handlers) {
        invalidateEventEmitter.off(event, cb);
      }
    };
  }, [queryClient]);
}
