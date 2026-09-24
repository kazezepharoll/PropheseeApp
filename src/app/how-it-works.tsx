import { StyleSheet } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Body, Heading, Muted } from '../components/Typography';
import { space } from '../constants/theme';
import { isServerMode } from '../services/api';

const sections = [
  {
    title: 'Sealed targets',
    body: 'Before you see anything, each target is locked with a SHA-256 fingerprint of the target plus a secret random salt. After the reveal, the app recomputes the fingerprint from the target and salt and checks it matches the seal you saw. If anyone swapped the target after you answered, the fingerprint would not match. You can also recompute it yourself with any SHA-256 tool.',
  },
  {
    title: 'Fair comparisons',
    body: 'Choice levels show what chance alone would score: 1 in 6 for colours and shapes, 1 in 4 for words. For describe levels, your words are also scored against a random decoy target of the same kind, chosen when the target was sealed. Your results always sit next to that comparison, and no plan inflates them.',
  },
  {
    title: 'Blind Test path',
    body: 'In a Blind Test every seal is shown before round one and nothing is revealed until you finish. You cannot adjust later answers based on earlier reveals.',
  },
  {
    title: 'Confidence calibration',
    body: 'Advanced and Master members rate their confidence on each answer. Over time the app checks whether your confident answers are actually your accurate ones.',
  },
  {
    title: 'Describe scoring',
    body: 'Descriptions are matched against each target’s attributes and their common synonyms. Words right after “not” or “no” are ignored. Listing many words matches more attributes on both the target and the decoy, which is why the decoy score is always shown.',
  },
];

export default function HowItWorks() {
  return (
    <Screen edges={['bottom']}>
      {sections.map((s) => (
        <Card key={s.title}>
          <Heading style={styles.small}>{s.title}</Heading>
          <Body>{s.body}</Body>
        </Card>
      ))}
      <Muted>
        {isServerMode
          ? 'Targets are chosen and sealed on the PropheSee server, so the target is never on your device until you have answered.'
          : 'This build seals targets on your device. That proves targets are not swapped, but a determined user could inspect the device. Server sealing is used for fully blind trials.'}
      </Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 18, marginBottom: space.xs },
});
