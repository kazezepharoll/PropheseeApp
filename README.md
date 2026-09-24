# PropheSee

A mobile app for training spiritual perception with honest, blind-tested targets.
Built with Expo (SDK 57), Expo Router and TypeScript.

## Run it

```bash
npm install
npm start          # scan the QR code with Expo Go on your phone
npm run web        # or open it in a browser
```

Checks:

```bash
npm run typecheck  # app + server
npm test           # scoring, sealing and server tests
```

## What's in the app

| Screen | File |
| --- | --- |
| Landing with rotating KJV verses | `src/app/index.tsx` |
| Choose Your Path + Training Levels | `src/app/(tabs)/train.tsx` |
| Session: concealed target → perception + confidence → reveal, feedback, tip | `src/app/session/[levelId].tsx` |
| Session results | `src/app/results.tsx` |
| Progress (streak, per-level accuracy vs baseline, calibration, seal ledger) | `src/app/(tabs)/progress.tsx` |
| Membership (4 tiers + 1-to-1 trainer session) | `src/app/(tabs)/membership.tsx`, `src/app/trainer.tsx` |
| Profile, how blind testing works | `src/app/(tabs)/profile.tsx`, `src/app/how-it-works.tsx` |

```
src/
  app/          routes (Expo Router)
  components/   shared UI
  constants/    theme, config
  data/         verses, levels, targets, tips, tiers
  services/     targetService (getTarget/startSession/revealTarget), scoring, storage, purchases
  state/        AppState provider (progress + tier, saved with AsyncStorage)
  types/
server/         target sealing server (same trial code as the app)
tests/
```

### Honest blind testing

- **Sealed targets.** Each target is fingerprinted with SHA-256 over `targetKey|salt` before the user sees anything. After the reveal the app recomputes it and shows the result. Users can also check it with any SHA-256 tool.
- **Fair baselines.** Choice levels show chance (1/6 colours and shapes, 1/4 words, 1/6 colour + shape). Describe levels score the same text against a random decoy chosen when the target was sealed.
- **Blind Test path.** All seals are shown up front and nothing is revealed until the end. Levels 7–8 are always blind. In server mode the server refuses any reveal until every round is committed.
- **Confidence calibration** for Advanced and Master.
- **Describe scoring** is keyword and synonym matching. It ignores negated words ("not red", "no people") up to the end of the clause. The AI analysis step would replace `scoreDescription()` in `src/services/scoring.ts`.

## Two modes for sealing targets

**Device mode** (default, no setup): targets are sealed on the phone. That proves targets aren't swapped, but a determined user could inspect the device, so this is practice-grade.

**Server mode** (for launch): the server picks and seals targets, and the answer never reaches the phone until the user has committed a perception.

```bash
npm run server                                   # listens on :8787
EXPO_PUBLIC_API_URL=http://<your-ip>:8787 npm start
```

The server keeps state in memory (6-hour expiry). Run a single instance, or move it to Redis or Postgres before you scale out. It installs with dev dependencies (`tsx`), so on a host like Railway or Render don't set `NODE_ENV=production` during install. Start command: `npm run server`. Set `CORS_ORIGIN` if you ship the web build.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Target server URL. Unset = device mode. |
| `EXPO_PUBLIC_TRAINER_EMAIL` | Where trainer booking requests are emailed. Unset = bookings show "opening soon". |
| `EXPO_PUBLIC_SIMULATE_PURCHASES` | `true` lets anyone switch plans for free (on in dev and in the `preview` EAS profile). **Must be unset in production.** |

`EXPO_PUBLIC_*` values are baked in at build time. After changing one, run with `--clear` (`npx expo start --clear`) or the old value can stick.

## Launch checklist

Done in the code:
- [x] Full training loop, all 8 levels, both paths, results, progress, membership, trainer request
- [x] Server sealing with blind-session enforcement
- [x] App identifiers (`com.prophesee.app`), dark splash, EAS build profiles (`eas.json`)
- [x] Unit and server tests

Still needed before the stores:
1. **Accounts.** Create an [Expo](https://expo.dev) account, an Apple Developer account ($99/year) and a Google Play Console account ($25 one-time). Change `com.prophesee.app` in `app.json` if you want a different ID. It can't be changed after the first store release.
2. **Payments.** App Store and Play rules require in-app purchase for digital subscriptions. Connect RevenueCat or `expo-iap` inside `src/services/purchases.ts` (the only file that changes plans). Create the three subscriptions in App Store Connect and Play Console. Then the server should check the user's plan before serving levels 3–8, which needs user accounts.
3. **Host the server** (Railway, Render, Fly.io) and set `EXPO_PUBLIC_API_URL` in the production EAS profile.
4. **Trainer sessions.** Set `EXPO_PUBLIC_TRAINER_EMAIL`. A live paid session is a real-world service, so it can be paid outside in-app purchase. Take payment by invoice or a payment link when the trainer replies.
5. **Branding.** Replace the icon and splash images in `assets/` (they are the Expo defaults).
6. **Store listing.** Privacy policy URL (progress stays on the device; server mode sends answers to your server), screenshots, description, age rating.
7. **Build and submit:**
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --profile preview --platform android   # installable test APK
   npx eas-cli@latest build --profile production --platform all
   npx eas-cli@latest submit --platform all
   ```

Prices in `src/data/tiers.ts` are display placeholders. Once billing is connected, show the store's localized prices instead.
