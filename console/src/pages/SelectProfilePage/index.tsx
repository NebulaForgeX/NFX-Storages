import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthRepository } from "nfx-ui/apis";
import { AuthStore, ensureDeviceIdStorage } from "nfx-ui/stores";
import { LanguageEnum, ProfileKind, ProfileKindEnum } from "nfx-ui/enums";
import type { Login, Profile } from "nfx-ui/types";

import AuthShell from "@/pages/LoginPage/AuthShell";

export default function SelectProfilePage() {
  const auth = useAuthRepository();
  const forgers = useQuery({
    queryKey: ["me-forger-profiles"],
    queryFn: () => auth.ListProfiles(ProfileKindEnum.FORGER, { limit: 50, offset: 0 }),
  });
  const authorities = useQuery({
    queryKey: ["me-authority-profiles"],
    queryFn: () => auth.ListProfiles(ProfileKindEnum.AUTHORITY, { limit: 50, offset: 0 }),
  });

  const profiles: Login.ProfileItem[] = [
    ...((forgers.data?.items ?? []) as Profile.Response.ForgerProfileItem[]).map((item) => ({
      profileId: item.profileId,
      kind: ProfileKindEnum.FORGER,
      roles: item.forgerRoles ?? [],
      displayName: item.displayName,
      avatarImageId: item.avatarImageId,
      city: item.city,
      country: item.country,
    })),
    ...((authorities.data?.items ?? []) as Profile.Response.AuthorityProfileItem[]).map((item) => ({
      profileId: item.profileId,
      kind: ProfileKindEnum.AUTHORITY,
      roles: item.authorityRoles ?? [],
      displayName: item.displayName,
      avatarImageId: item.avatarImageId,
      city: item.city,
      country: item.country,
    })),
  ];

  const select = useMutation({
    mutationFn: async (profile: Login.ProfileItem) => {
      const deviceId = await ensureDeviceIdStorage();
      const out = await auth.SelectProfile({ profileId: profile.profileId, kind: ProfileKind(profile.kind), deviceId });
      AuthStore.getState().setTokens({ accessToken: out.accessToken, refreshToken: out.refreshToken });
      AuthStore.getState().setCurrentAccountId(out.accountId);
      AuthStore.getState().setCurrentProfileId(out.profileId);
      AuthStore.getState().setCurrentProfileKind(ProfileKind(profile.kind));
      AuthStore.getState().setIsAuthValid(true);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const created = await auth.CreateForgerProfile({ displayName: "Forger", profileLanguage: LanguageEnum.ZH });
      const deviceId = await ensureDeviceIdStorage();
      const out = await auth.SelectProfile({ profileId: created.profileId, kind: ProfileKind(ProfileKindEnum.FORGER), deviceId });
      AuthStore.getState().setTokens({ accessToken: out.accessToken, refreshToken: out.refreshToken });
      AuthStore.getState().setCurrentAccountId(out.accountId);
      AuthStore.getState().setCurrentProfileId(out.profileId);
      AuthStore.getState().setCurrentProfileKind(ProfileKind(ProfileKindEnum.FORGER));
      AuthStore.getState().setIsAuthValid(true);
    },
  });

  const error = (select.error || create.error) as Error | null;

  return (
    <AuthShell brandEyebrow="NFX Storages" brandTitle="Name the dock clerk" heroFooter="Session keys are minted per Identity profile. Empty accounts create a Forger before the bay opens.">
      <Flex direction="column" gap="4">
        <Heading as="h2" size="5">
          Profiles
        </Heading>
        {profiles.map((profile) => (
          <Button key={profile.profileId} variant="soft" onClick={() => select.mutate(profile)} loading={select.isPending}>
            {profile.displayName || profile.profileId} ({profile.kind})
          </Button>
        ))}
        {profiles.length === 0 ? (
          <Button onClick={() => create.mutate()} loading={create.isPending}>
            Create Forger profile
          </Button>
        ) : null}
        {error ? (
          <Text size="2" color="red">
            {error.message}
          </Text>
        ) : null}
      </Flex>
    </AuthShell>
  );
}
