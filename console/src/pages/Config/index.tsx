import { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { PreferencesPopover } from "@/components";
import { ROUTES } from "@/navigations";
import { AuthMotionRoot } from "@/pages/Account/shared/AuthChrome";
import { useHostConfigStore } from "@/stores/hostConfigStore";

import styles from "./s.module.css";

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
    <AuthMotionRoot className={styles.page}>
      <Box className={styles.bar}>
        <Box className={styles.barPx}>
          <Box className={styles.barPy}>
            <Flex asChild align="center" justify="between" gap="4">
              <header>
                <span className={styles.mount} data-auth-motion>
                  {t("Mount endpoint")}
                </span>
                <PreferencesPopover />
              </header>
            </Flex>
          </Box>
        </Box>
      </Box>
      <Box className={styles.body}>
        <Box className={styles.bodyPx}>
          <Box className={styles.bodyPy}>
            <Flex direction="column" gap="4" className={styles.endpoint} data-auth-motion>
          <Heading as="h1" size="5">
            {t("Server Configuration")}
          </Heading>
          <Text size="2" color="gray">
            {t("Please configure your NFX Storages server address")}
          </Text>
          <span className={styles.prefix}>s3://endpoint</span>
          <TextField.Root
            size="3"
            radius="none"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("Please enter server address (e.g., http://localhost:9000)")}
          />
          {error ? (
            <Text size="2" color="red">
              {error}
            </Text>
          ) : null}
            <Flex gap="2" wrap="wrap">
              <Button onClick={save} radius="none">
                {t("Save Configuration")}
              </Button>
              <Button
                type="button"
                variant="outline"
                radius="none"
                onClick={() => {
                  resetServerHost();
                  setValue("");
                }}
              >
                {t("Reset")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.LOGIN)}>
                {t("Skip")}
              </Button>
            </Flex>
            </Flex>
          </Box>
        </Box>
      </Box>
    </AuthMotionRoot>
  );
}
