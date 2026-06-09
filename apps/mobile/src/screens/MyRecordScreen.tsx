import React from "react";
import {
  Button,
  Card,
  Caption,
  Heading,
  Screen,
  Stack,
  Text,
  Title,
  colors,
  spacing
} from "@dromaios/ui";
import { useRecord } from "../lib/record.js";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

export function MyRecordScreen() {
  const { certificates, totalHours, reset, ready } = useRecord();

  if (!ready) {
    return (
      <Screen>
        <Text muted>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>My record</Title>
      <Card>
        <Caption>Total recorded</Caption>
        <Title>{totalHours} hours</Title>
        <Text muted>
          Yours, on this device. Not shared with your employer. You can use it as evidence toward
          CPD where you have a CPD obligation.
        </Text>
      </Card>

      <Heading>Certificates</Heading>
      {certificates.length === 0 ? (
        <Text muted>No certificates yet. Finish a lesson to earn your first.</Text>
      ) : (
        <Stack gap={spacing.md}>
          {certificates.map((c) => (
            <Card key={c.id}>
              <Text variant="bodyStrong">{c.lessonTitle}</Text>
              <Caption>
                {c.hoursCredited} hrs · issued {formatDate(c.issuedAt)}
              </Caption>
            </Card>
          ))}
        </Stack>
      )}

      {certificates.length > 0 ? (
        <Button label="Clear my record" variant="secondary" onPress={reset} />
      ) : null}
      <Caption>Export and account sync are coming. For now your record stays on this device.</Caption>
    </Screen>
  );
}
