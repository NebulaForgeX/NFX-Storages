import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";

import { ROUTES } from "@/navigations";
import { useHostConfigStore } from "@/stores/hostConfigStore";

import AuthShell from "../LoginPage/AuthShell";

export default function ConfigPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const storedHost = useHostConfigStore((s) => s.serverHost);
  const setServerHost = useHostConfigStore((s) => s.setServerHost);
  const resetServerHost = useHostConfigStore((s) => s.resetServerHost);
  const [value, setValue] = useState(storedHost);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(storedHost);
  }, [storedHost]);

  const save = () => {
    try {
      let next = value.trim();
      if (next && !/^https?:\/\//.test(next)) next = `https://${next}`;
      if (next) new URL(next);
      if (next) setServerHost(next);
      else resetServerHost();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      setError(t("Invalid server address format"));
    }
  };

  return (
    <AuthShell brandEyebrow="NFX Storage" brandTitle={t("Server Configuration")} heroFooter={t("Please configure your NFX Storages server address")}>
      <Flex direction="column" gap="4">
        <Heading as="h2" size="5">
          {t("Server Address")}
        </Heading>
        <TextField.Root
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("Please enter server address (e.g., http://localhost:9000)")}
        />
        {error ? (
          <Text size="2" color="red">
            {error}
          </Text>
        ) : null}
        <Flex gap="2">
          <Button onClick={save}>{t("Save Configuration")}</Button>
          <Button type="button" variant="outline" onClick={() => { resetServerHost(); setValue(""); }}>
            {t("Reset")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.LOGIN)}>
            {t("Skip")}
          </Button>
        </Flex>
      </Flex>
    </AuthShell>
  );
}
