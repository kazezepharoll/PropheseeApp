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
npm run lint
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
| Profile, how blind testing works, privacy policy | `src/app/(tabs)/profile.tsx`, `src/app/how-it-works.tsx`, `src/app/privacy.tsx` |

```
src/
  app/          routes (Expo Router)
  components/   shared UI
  constants/    theme, config
  data/         verses, levels, targets, tips, tiers
  services/     targetService (getTarget/startSession/revealTarget), scoring, storage,
                account, purchases (RevenueCat), bookings
  state/        AppState provider (progress + tier, saved with AsyncStorage)
  types/
server/         target server: sealing, accounts, plan checks, bookings (same trial code as the app)
tests/
```

### Honest blind testing

- **Sealed targets.** Each target is fingerprinted with SHA-256 over `targetKey|salt` before the user sees anything. After the reveal the app recomputes it and shows the result. Users can also check it with any SHA-256 tool.
- **Fair baselines.** Choice levels show chance (1/6 colours and shapes, 1/4 words, 1/6 colour + shape). Describe levels score the same text against a random decoy chosen when the target was sealed.
- **Blind Test path.** All seals are shown up front and nothing is revealed until the end. Levels 7–8 are always blind. In server mode the server refuses any reveal until every round is committed.
- **Confidence calibration** for Advanced and Master.
- **Describe scoring** is keyword and synonym matching. It ignores negated words ("not red", "no people") up to the end of the clause. The AI analysis step would replace `scoreDescription()` in `src/services/scoring.ts`.

## Two modes for sealing targets

**Device mode** (no `EXPO_PUBLIC_API_URL`): targets are sealed on the phone. That proves targets aren't swapped, but a determined user could inspect the device, so this is practice-grade.

**Server mode** (for launch): the server picks and seals targets, and the answer never reaches the phone until the user has committed a perception. It also:
- gives each install an anonymous account (`/auth/device`, token kept in the device's secure storage),
- checks the user's plan with RevenueCat before starting any level, and enforces the free tier's 3 sessions a day (a session counts once its first target is opened),
- receives trainer booking requests.

```bash
npm run server                                   # dev, listens on :8787
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8787 npx expo start --clear
```

### Deploying the server

`npm run build:server` bundles it into one dependency-free file, `dist-server/index.mjs`. The `Dockerfile` builds and runs that file. Any Docker host works (Railway, Render, Fly.io).

| Server variable | Purpose |
| --- | --- |
| `SERVER_SECRET` | **Required in production.** Signs device tokens. Any long random string (`openssl rand -hex 32`). Changing it signs everyone out. |
| `REVENUECAT_SECRET_KEY` | RevenueCat secret API key (v1). Without it the server runs "open" and treats every user as `OPEN_MODE_TIER` (default `master`). |
| `TRAINER_WEBHOOK_URL` | Optional. Booking requests are posted here as `{ text }` (Slack, Discord, Zapier, Make). They are always saved to `DATA_DIR/bookings.jsonl` too. |
| `DATA_DIR` | Where bookings are saved (`/data` in Docker). Mount a volume there. |
| `SUPPORT_EMAIL` | Contact address shown on the public privacy policy page (`/privacy`). |
| `CORS_ORIGIN` | Restrict browser access if you ship the web build. |
| `PORT` | Default 8787. |

Trial state is kept in memory for 6 hours, so run one instance. Move it to Redis or Postgres before you scale out.

## App environment variables

Set these as EAS environment variables (`npx eas-cli@latest env:create`) for the `production` environment.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Target server URL. Unset = device mode. |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat public SDK keys. Turn on real purchases. |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Shown in the privacy policy. |
| `EXPO_PUBLIC_TRAINER_EMAIL` | Only used in device mode: trainer requests open the user's email app addressed here. |
| `EXPO_PUBLIC_SIMULATE_PURCHASES` | `true` lets anyone switch plans for free (on in dev and in the `development` and `preview` profiles). **Never set it for production.** |

`EXPO_PUBLIC_*` values are baked in at build time. After changing one, run with `--clear` or the old value can stick.

## Payments (RevenueCat)

1. Create the subscriptions in App Store Connect and Google Play Console (e.g. `prophesee_seeker_monthly`, `prophesee_advanced_monthly`, `prophesee_master_monthly`).
2. In RevenueCat, add both apps, then create entitlements named exactly `seeker`, `advanced` and `master` and attach each product.
3. Make an offering, mark it current, and add three packages with custom identifiers `seeker`, `advanced` and `master`.
4. Put the public SDK keys in the app env vars and the secret key in `REVENUECAT_SECRET_KEY` on the server.

The app shows the store's localized prices once products load. Real purchases need a development or store build. Expo Go runs RevenueCat in preview mode. Downgrades and cancellations happen in the store's subscription settings, and the app links users there.

## Launch checklist

Done in the code:
- [x] Full training loop, all 8 levels, both paths, results, progress, membership, trainer requests
- [x] Server sealing, blind-session enforcement, anonymous accounts, plan checks, free daily limit, rate limiting
- [x] RevenueCat subscriptions with restore, plus simulated plans for testing
- [x] Privacy policy (in app under Profile, and `docs/privacy-policy.md` to host for the store listings), subscription terms text, EULA link
- [x] App icon, adaptive Android icon, splash screen
- [x] App identifiers (`com.prophesee.app`), EAS profiles, Dockerfile
- [x] Typecheck, lint, unit and server tests

What you need to do:
1. **Accounts:** [Expo](https://expo.dev), Apple Developer ($99/year), Google Play Console ($25 once), [RevenueCat](https://www.revenuecat.com) (free until revenue grows). If you want a different app ID than `com.prophesee.app`, change it in `app.json` before the first release.
2. **Set up products** in the stores and RevenueCat as described above. Set your prices there. The prices in `src/data/tiers.ts` are only a fallback.
3. **Deploy the server** with `SERVER_SECRET` and `REVENUECAT_SECRET_KEY`. Put its URL in `EXPO_PUBLIC_API_URL`.
4. **Privacy policy:** the server publishes it at `/privacy` (live: https://prophesee-server-production.up.railway.app/privacy). Set `SUPPORT_EMAIL` on the server and `EXPO_PUBLIC_SUPPORT_EMAIL` in the app.
5. **Google Play listing:** text, form answers, screenshots and graphics are ready in `docs/play-store/` (start with `listing.md`).
6. **Test on a phone:** `npx eas-cli@latest build --profile preview --platform android` gives an installable APK with simulated plans.
7. **Release:**
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --profile production --platform all
   npx eas-cli@latest submit --platform all
   ```
   Then fill in the store listings (screenshots, description, age rating, data safety form: anonymous id, trainer contact details, purchase history).
