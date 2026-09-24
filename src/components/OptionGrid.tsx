import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';
import type { Option } from '../types';
import { Glyph } from './Glyph';

interface Props {
  options: Option[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Hide labels for colours so the user responds to the colour, not the word. */
  showLabels?: boolean;
  columns?: number;
}

export function OptionGrid({ options, selectedId, onSelect, showLabels = true, columns = 3 }: Props) {
  const width = `${100 / columns - 2}%` as const;
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.id === selectedId;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onSelect(o.id)}
            style={[styles.cell, { width }, selected && styles.selected]}
          >
            {o.category === 'word' ? (
              <Text style={styles.word}>{o.label}</Text>
            ) : (
              <>
                <Glyph category={o.category} glyph={o.glyph} size={40} />
                {showLabels && <Text style={styles.label}>{o.label}</Text>}
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  cell: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.indigoLine,
    backgroundColor: colors.indigoRaised,
    padding: space.sm,
  },
  selected: { borderColor: colors.gold, backgroundColor: 'rgba(233,185,73,0.15)' },
  label: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  word: { fontFamily: fonts.serif, fontSize: 20, color: colors.text, textAlign: 'center' },
});
