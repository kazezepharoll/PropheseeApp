import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { Body, Eyebrow, Heading, Muted, Title } from '../../components/Typography';
import { colors, space } from '../../constants/theme';
import { tierOrder, tierRank, tiers, trainerSession } from '../../data/tiers';
import { billingAvailable, PurchaseCancelled, purchaseTier, purchasesSimulated, restorePurchases, storePrice } from '../../services/purchases';
import { useAppState } from '../../state/AppState';
import type { TierId } from '../../types';

function show(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function Membership() {
  const { state, setTier, billingReady } = useAppState();
  const [busy, setBusy] = useState<TierId | 'restore' | null>(null);

  const choose = async (id: TierId) => {
    setBusy(id);
    try {
      const tier = await purchaseTier(id, state.tier);
      setTier(tier);
      if (billingAvailable && tier === id) show('Welcome', `You are now a ${tiers[id].name} member. Thank you for supporting PropheSee.`);
    } catch (e) {
      if (!(e instanceof PurchaseCancelled)) show('Membership', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    try {
      const tier = await restorePurchases(state.tier);
      setTier(tier);
      show('Restore purchases', tier === 'free' ? 'No active membership was found for this store account.' : `Restored your ${tiers[tier].name} membership.`);
    } catch (e) {
      show('Restore purchases', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Eyebrow>Current plan: {tiers[state.tier].name}</Eyebrow>
        <Title>Membership</Title>
        <Muted>Every plan uses the same sealed targets and the same fair comparisons. Paying never changes your scores.</Muted>
      </View>

      {purchasesSimulated && (
        <Card style={styles.notice}>
          <Muted>Test mode: switching plans is simulated so you can try what each tier unlocks. No payment is taken.</Muted>
        </Card>
      )}

      {tierOrder.map((id) => {
        const tier = tiers[id];
        const current = id === state.tier;
        const higher = tierRank(id) > tierRank(state.tier);
        // With real billing, downgrades happen in the store's subscription settings.
        const canChoose = higher || !billingAvailable;
        const price = id === 'free' ? tier.price : (storePrice(id) ?? (billingAvailable && !billingReady ? '…' : tier.price));
        return (
          <Card key={id} highlighted={current}>
            <View style={styles.between}>
              <Heading>{tier.name}</Heading>
              <Body style={styles.price}>{price}</Body>
            </View>
            <Muted style={styles.gold}>{tier.tagline}</Muted>
            {tier.perks.map((perk) => (
              <View key={perk} style={styles.perk}>
                <MaterialCommunityIcons name="check" size={18} color={colors.gold} />
                <Body style={{ flex: 1 }}>{perk}</Body>
              </View>
            ))}
            {current ? (
              <Button label="Your current plan" variant="secondary" disabled onPress={() => {}} />
            ) : !canChoose ? null : (
              <Button
                label={higher ? `Upgrade to ${tier.name}` : `Switch to ${tier.name}`}
                variant={higher ? 'primary' : 'secondary'}
                loading={busy === id}
                onPress={() => choose(id)}
              />
            )}
          </Card>
        );
      })}

      <Card>
        <View style={styles.between}>
          <Heading>{trainerSession.name}</Heading>
        </View>
        <Body style={styles.price}>{trainerSession.price}</Body>
        <Body>{trainerSession.description}</Body>
        <Button label="Request a session" onPress={() => router.push('/trainer')} />
      </Card>

      {billingAvailable && (
        <>
          <Button label="Restore purchases" variant="ghost" loading={busy === 'restore'} onPress={restore} />
          <Muted style={styles.legal}>
            Subscriptions renew automatically until cancelled. Manage or cancel any time in your store account settings. Payment is
            charged to your App Store or Google Play account.
          </Muted>
          <Button label="Privacy policy and terms" variant="ghost" onPress={() => router.push('/privacy')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { borderColor: colors.dawn },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  price: { color: colors.gold, fontWeight: '700' },
  gold: { color: colors.goldSoft },
  perk: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  legal: { textAlign: 'center', fontSize: 12 },
});
