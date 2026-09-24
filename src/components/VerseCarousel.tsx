import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, space } from '../constants/theme';
import { verses } from '../data/verses';

const INTERVAL_MS = 7000;

export function VerseCarousel() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * verses.length));
  const [opacity] = useState(() => new Animated.Value(1));

  const go = (next: number) => {
    Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
      setIndex((next + verses.length) % verses.length);
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    const t = setInterval(() => go(index + 1), INTERVAL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const verse = verses[index];
  return (
    <Pressable onPress={() => go(index + 1)} accessibilityHint="Shows the next verse" style={styles.wrap}>
      <Animated.View style={{ opacity, gap: space.md }}>
        <Text style={styles.text}>“{verse.text}”</Text>
        <Text style={styles.ref}>{verse.reference} · KJV</Text>
      </Animated.View>
      <View style={styles.dots}>
        {verses.map((v, i) => (
          <View key={v.reference} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg, minHeight: 190, justifyContent: 'center' },
  text: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 21, lineHeight: 31, color: colors.text, textAlign: 'center' },
  ref: { fontFamily: fonts.sans, fontSize: 13, letterSpacing: 1, color: colors.gold, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.indigoLine },
  dotActive: { backgroundColor: colors.gold, width: 16 },
});
