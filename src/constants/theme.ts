import { Platform } from 'react-native';

export const colors = {
  night: '#12102E',
  indigo: '#1E1B4B',
  indigoRaised: '#2A2665',
  indigoLine: '#3B3680',
  violet: '#6D63D8',
  gold: '#E9B949',
  goldSoft: '#F5D78E',
  dawn: '#F59E6B',
  text: '#F4F1FF',
  textMuted: '#B7B2DD',
  textFaint: '#8781BF',
  success: '#5CC98A',
  danger: '#EE6A6A',
  overlay: 'rgba(18, 16, 46, 0.85)',
};

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, sans-serif' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, monospace' }),
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
