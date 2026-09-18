import type { ProfileKindEnum } from "@/identity/enums/auth";
import type { EventNamesOf } from "nfx-ui/events";

import { defineEvents, EventEmitter } from "nfx-ui/events";
import { singleton } from "nfx-ui/utils";

export const authEvents = defineEvents({
  UPDATE_ACCOUNT_SUCCESS: "AUTH:UPDATE_ACCOUNT_SUCCESS",
  LOGIN_SUCCESS: "AUTH:LOGIN_SUCCESS",
  LOGOUT: "AUTH:LOGOUT",
  INVALIDATE_EMAILS: "AUTH:INVALIDATE_EMAILS",
  INVALIDATE_PROFILES: "AUTH:INVALIDATE_PROFILES",
});

type AuthEvent = EventNamesOf<typeof authEvents>;

export type InvalidateProfilesPayload = {
  aID: string;
  kind: ProfileKindEnum;
};

class AuthEventEmitter extends EventEmitter<AuthEvent> {
  constructor() {
    super(authEvents);
  }

  invalidateEmails(aID?: string) {
    this.emit(authEvents.INVALIDATE_EMAILS, aID);
  }

  invalidateProfiles(payload: InvalidateProfilesPayload) {
    this.emit(authEvents.INVALIDATE_PROFILES, payload);
  }

  logout() {
    this.emit(authEvents.LOGOUT);
  }

  onLogout(callback: () => void) {
    this.on(authEvents.LOGOUT, callback);
  }

  offLogout(callback: () => void) {
    this.off(authEvents.LOGOUT, callback);
  }
}

export const authEventEmitter = new (singleton(AuthEventEmitter))();
