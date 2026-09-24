import { Linking, StyleSheet } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Body, Heading, Muted } from '../components/Typography';
import { supportEmail } from '../constants/config';
import { colors, space } from '../constants/theme';
import { privacySections, privacyUpdated, termsUrl } from '../data/legal';

export default function Privacy() {
  return (
    <Screen edges={['bottom']}>
      <Muted>Last updated {privacyUpdated}</Muted>
      {privacySections.map((s) => (
        <Card key={s.title}>
          <Heading style={styles.small}>{s.title}</Heading>
          <Body>{s.body}</Body>
        </Card>
      ))}
      {supportEmail ? (
        <Body>
          Contact:{' '}
          <Body style={styles.link} onPress={() => Linking.openURL(`mailto:${supportEmail}`)}>
            {supportEmail}
          </Body>
        </Body>
      ) : null}
      <Body style={styles.link} onPress={() => Linking.openURL(termsUrl)}>
        Terms of Use (EULA)
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 18, marginBottom: space.xs },
  link: { color: colors.gold, textDecorationLine: 'underline' },
});
