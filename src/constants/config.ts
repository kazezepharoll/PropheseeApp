import Constants from 'expo-constants';

/** Where 1-to-1 trainer booking requests are emailed. Set EXPO_PUBLIC_TRAINER_EMAIL before release. */
export const trainerEmail = process.env.EXPO_PUBLIC_TRAINER_EMAIL ?? '';

export const appVersion = Constants.expoConfig?.version ?? '1.0.0';
