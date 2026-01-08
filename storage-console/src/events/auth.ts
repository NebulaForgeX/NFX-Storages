// const authEvents = [
//     'AUTH:LOGIN_SUCCESS',
//     'AUTH:VALID_EXPIRED',
// ] as const;

export const authEvents = {
    LOGIN_SUCCESS: 'AUTH:LOGIN_SUCCESS',
    VALID_EXPIRED: 'AUTH:VALID_EXPIRED',
} as const;

type AuthEvent = (typeof authEvents)[keyof typeof authEvents];

class AuthEventEmitter {
    private listeners: Record<AuthEvent,Set<Function>> = {
        [authEvents.LOGIN_SUCCESS]: new Set<Function>(),
        [authEvents.VALID_EXPIRED]: new Set<Function>(),
    };

    on(event: AuthEvent, callback: Function) {
        this.listeners[event].add(callback);
    }

    off(event: AuthEvent, callback: Function) {
        this.listeners[event].delete(callback);
    }

    emit(event: AuthEvent, ...args: unknown[]) { 
        this.listeners[event].forEach(callback => {
            callback(...args);
        });
    }
    
}

export const authEventEmitter = new AuthEventEmitter();