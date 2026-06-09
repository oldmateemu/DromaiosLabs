import React from "react";
import {
  Button,
  Card,
  Caption,
  DisclaimerBanner,
  Heading,
  Screen,
  Stack,
  Text,
  Title,
  spacing
} from "@dromaios/ui";
import { EDUCATIONAL_DISCLAIMER, type Role } from "@dromaios/core";
import { useRecord } from "../lib/record.js";

const PRIVACY_POINTS = [
  "Your learning record is yours. It lives on this device and is not shared with your employer.",
  "We collect as little as possible. You can use the app without an account.",
  "We never sell your data.",
  "Your data is stored in Australia when you sync (account sync is coming later).",
  "This app is educational. It is not surveillance and not a compliance check on you."
];

const ROLE_LABEL: Record<Role, string> = {
  "disability-support": "Disability support",
  "aged-care": "Aged care",
  nurse: "Nurse",
  other: "Other"
};

export function AboutScreen() {
  const { role, setRole } = useRecord();

  return (
    <Screen>
      <Title>About</Title>
      <Text>
        Dromaios Safer Practice gives frontline disability, aged-care and nursing workers short,
        practical lessons and quick references on de-escalation and behaviour support.
      </Text>

      <Card>
        <Heading>Your privacy</Heading>
        <Stack gap={spacing.sm}>
          {PRIVACY_POINTS.map((p, i) => (
            <Text key={i}>• {p}</Text>
          ))}
        </Stack>
        <Caption>See the full privacy policy at dromaios.com/safer-practice/privacy.</Caption>
      </Card>

      <Heading>Important</Heading>
      <DisclaimerBanner text={EDUCATIONAL_DISCLAIMER} />

      <Heading>Your role</Heading>
      <Caption>Currently: {role ? ROLE_LABEL[role] : "not set"}</Caption>
      <Stack gap={spacing.sm}>
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <Button
            key={r}
            label={ROLE_LABEL[r]}
            variant={r === role ? "primary" : "secondary"}
            onPress={() => setRole(r)}
          />
        ))}
      </Stack>

      <Caption>Dromaios Labs · Australia · v0.1.0</Caption>
    </Screen>
  );
}
