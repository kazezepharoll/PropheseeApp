/**
 * Privacy policy shown in the app. Keep docs/privacy-policy.md (the hosted copy for the store
 * listings) in sync when this changes.
 */
export const privacyUpdated = '24 September 2026';

export const privacySections: { title: string; body: string }[] = [
  {
    title: 'What stays on your device',
    body: 'Your name, training sessions, scores, streaks and trainer request history are stored only on your device. We do not receive them. Deleting the app or choosing Reset progress removes them.',
  },
  {
    title: 'What the PropheSee server receives',
    body: 'To run fair blind trials, the server chooses and seals each target and receives your answer for that round so it can open the seal. Each install gets an anonymous account id; we do not ask for your email or phone number to train. Trial data is kept in memory and deleted within 6 hours.',
  },
  {
    title: 'Trainer session requests',
    body: 'If you request a 1-to-1 trainer session, the name, contact details, preferred time and notes you enter are sent to our trainers so they can contact you. They are used only to arrange and deliver that session.',
  },
  {
    title: 'Payments',
    body: 'Memberships are sold through the App Store or Google Play and managed with RevenueCat. We never see your card details. RevenueCat receives your anonymous account id and purchase history so your membership works on your devices.',
  },
  {
    title: 'What we do not do',
    body: 'We do not sell your data, show advertising, or use third-party tracking or analytics.',
  },
  {
    title: 'Children',
    body: 'PropheSee is not directed at children under 13.',
  },
  {
    title: 'Your choices',
    body: 'You can reset your progress at any time from Profile. To ask about or delete trainer request details, contact us at the address below.',
  },
];

export const termsUrl = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
