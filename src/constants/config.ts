import Constants from 'expo-constants';

/** Where 1-to-1 trainer booking requests are emailed. Set EXPO_PUBLIC_TRAINER_EMAIL before release. */
export const trainerEmail = process.env.EXPO_PUBLIC_TRAINER_EMAIL ?? '';

export const appVersion = Constants.expoConfig?.version ?? '1.0.0';

/** Shown in the privacy policy for questions and data requests. Set EXPO_PUBLIC_SUPPORT_EMAIL before release. */
export const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '';
