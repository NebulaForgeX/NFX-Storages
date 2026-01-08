import type { InfoItem } from "@/elements/profile";

import { useMemo } from "react";
import { Clock, DollarSign, Globe, Languages } from "@/assets/icons/lucide";

import { useSelfProfile } from "@/hooks/useProfile";

export const useLocationPrefs = () => {
  const { data: profile } = useSelfProfile();

  const country = profile?.country;
  const language = profile?.language;
  const timezone = profile?.timezone;
  const currency = profile?.currency;

  return useMemo<InfoItem[]>(
    () => [
      {
        icon: <Globe size={20} />,
        label: "Country",
        value: country || "Not set",
      },
      {
        icon: <Languages size={20} />,
        label: "Language",
        value: language || "Not set",
      },
      {
        icon: <Clock size={20} />,
        label: "Timezone",
        value: timezone || "Not set",
      },
      {
        icon: <DollarSign size={20} />,
        label: "Currency",
        value: currency || "Not set",
      },
    ],
    [country, language, timezone, currency],
  );
};
