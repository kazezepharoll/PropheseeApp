import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Body, Heading, Muted } from '../components/Typography';
import { colors, fonts, radius, space } from '../constants/theme';
import { trainerSession } from '../data/tiers';
import { bookingChannel, sendBooking } from '../services/bookings';
import { newId } from '../services/entropy';
import { useAppState } from '../state/AppState';

export default function Trainer() {
  const { state, addBooking } = useAppState();
  const [name, setName] = useState(state.displayName);
  const [contact, setContact] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const valid = name.trim().length > 1 && contact.trim().length > 4 && preferredTime.trim().length > 1;

  const submit = async () => {
    setError('');
    const booking = {
      id: newId(),
      name: name.trim(),
      contact: contact.trim(),
      preferredTime: preferredTime.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setSending(true);
    try {
      await sendBooking(booking, state.tier);
      addBooking(booking);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (bookingChannel === 'none') {
    return (
      <Screen edges={[]}>
        <Heading>{trainerSession.name}</Heading>
        <Body>{trainerSession.description}</Body>
        <Card>
          <Body>Trainer bookings open soon. Check back after the next update.</Body>
        </Card>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (sent) {
    return (
      <Screen edges={[]}>
        <Heading>{bookingChannel === 'server' ? 'Request sent' : 'Request ready to send'}</Heading>
        <Body>
          {bookingChannel === 'server'
            ? 'Thank you. A trainer will contact you to arrange a time and payment.'
            : 'Your email app opened with the request filled in. Once you send it, a trainer will reply to arrange a time and payment.'}
        </Body>
        <Button label="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Heading>{trainerSession.name}</Heading>
      <Body>{trainerSession.description}</Body>
      <Muted style={{ color: colors.gold }}>{trainerSession.price}</Muted>

      <Field label="Your name" value={name} onChange={setName} />
      <Field label="Email or phone" value={contact} onChange={setContact} keyboard="email-address" />
      <Field label="Preferred days and times (with your time zone)" value={preferredTime} onChange={setPreferredTime} />
      <Field label="Anything the trainer should know (optional)" value={notes} onChange={setNotes} multiline />

      {error ? <Body style={{ color: colors.danger }}>{error}</Body> : null}
      <Button label="Send request" onPress={submit} disabled={!valid} loading={sending} />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboard?: 'email-address';
}) {
  return (
    <>
      <Muted>{label}</Muted>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        autoCapitalize={keyboard ? 'none' : 'sentences'}
        style={[styles.input, multiline && styles.multiline]}
        accessibilityLabel={label}
        placeholderTextColor={colors.textFaint}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    backgroundColor: colors.indigoRaised,
    color: colors.text,
    padding: space.md,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginTop: -space.sm,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});
