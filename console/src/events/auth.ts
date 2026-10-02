import { EventEmitter, defineEvents, type EventNamesOf } from "nfx-ui/events";
import { singleton } from "nfx-ui/utils";

export const authEvents = defineEvents({
  LOGIN_SUCCESS: "AUTH:LOGIN_SUCCESS",
  LOGOUT: "AUTH:LOGOUT",
});

type AuthEvent = EventNamesOf<typeof authEvents>;

class AuthEventEmitter extends EventEmitter<AuthEvent> {
  constructor() {
    super(authEvents);
  }
}

export const authEventEmitter = new (singleton(AuthEventEmitter))();
