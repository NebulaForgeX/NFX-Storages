import { AddTeaViewCount } from "@/apis/tea.api";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const addTeaViewCountService = async (id: string) => {
  await AddTeaViewCount(id);
  cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEAS);
  cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEA, id);
};