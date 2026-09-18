import type { AuthSignupPlatformEnum, LanguageEnum } from "@/identity/enums/auth";

export namespace Signup {
  export namespace Request {
    export interface SendVerificationCode {
      email: string;
      lang: LanguageEnum;
    }

    export interface SignupWithEmail {
      email: string;
      password: string;
      verificationCode: string;
      lang: LanguageEnum;
      deviceId: string;
      signupPlatform: AuthSignupPlatformEnum;
    }
  }

  export namespace Response {
    export interface SignupWithEmail {
      accountId: string;
      profileId: Maybe<string>;
      accessToken: string;
      refreshToken: string;
    }
  }
}
