# PropheSee — Google Play listing

Everything here is ready to paste into Play Console. Graphics are in this folder:

| Asset | File | Play requirement |
| --- | --- | --- |
| App icon | `icon-512.png` | 512 × 512 PNG |
| Feature graphic | `feature-graphic.png` | 1024 × 500 |
| Phone screenshots (8) | `screenshots/01-…08-*.png` | 1080 × 1920, 9:16, 2–8 images |

The screenshots come from the real app (production build, talking to the server). Nothing is mocked. The hit in screenshot 5 happened during capture.

---

## Main store listing

**App name** (30 max)

```
PropheSee: Prophetic Training
```

**Short description** (80 max)

```
Train your spiritual perception with sealed targets and honest, fair scoring.
```

**Full description** (4000 max)

```
PropheSee is a training ground for spiritual perception, built on one principle from Scripture: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21).

Each session hides a target, such as a colour, a shape, a word, an object or a place. You quiet yourself, record your first impression, and then see the target. Over time you learn what your true impressions feel like, and whether they are growing.

WHAT MAKES PROPHESEE DIFFERENT

• Sealed targets
Before you see anything, every target is locked with a digital fingerprint (SHA-256). After the reveal, the app checks the fingerprint again, so you know the target was fixed before you answered and never swapped. You can even check it yourself.

• Fair comparisons, always
Your score is always shown next to what chance alone would score. For free-text levels, your description is also scored against a random decoy target. No plan ever inflates your results.

• Blind Test path
Want to prove your growth? In a Blind Test, every seal is shown before round one and nothing is revealed until you finish, so later answers cannot be adjusted.

• Confidence calibration
Rate how sure you are on each answer. PropheSee shows whether your confident answers are really your accurate ones.

EIGHT TRAINING LEVELS
1. Colours: one of six colours
2. Shapes: one of six shapes
3. Words: one of four words
4. Colour + Shape: both halves count
5. Objects: describe everyday objects in your own words
6. Scenes: describe places and landscapes
7. Watchman I: a sealed blind trial of scenes
8. Watchman II: a sealed blind trial of objects and scenes

ALSO INCLUDED
• Rotating King James Version verses on seeing, hearing and testing
• A tip after every round to help you train well
• Progress tracking: streaks, accuracy by level, and every result next to its fair comparison
• Request a 1-to-1 session with a trainer who prepares sealed targets for you

MEMBERSHIPS
Start free with Colours and Shapes (3 sessions a day). Upgrade any time:
• Seeker: levels 1–4 and unlimited sessions
• Advanced: levels 1–6, free-text perception with decoy comparison, and confidence calibration
• Master: all 8 levels, including the sealed Watchman trials, and a full seal ledger

Subscriptions renew automatically until cancelled. Manage or cancel any time in Google Play › Payments & subscriptions.

YOUR PRIVACY
Your sessions and progress stay on your device. No ads and no tracking. Train with an anonymous account; no email is needed.

PropheSee is a training and self-assessment tool. It shows your results honestly and makes no promises about outcomes.
```

**App category:** Education
**Tags** (pick up to 5 in Play Console): Religion & Spirituality, Education, Self-improvement, Bible, Training
**Contact email:** your support email (required, shown publicly)
**Privacy policy URL:**

```
https://prophesee-server-production.up.railway.app/privacy
```

(Set `SUPPORT_EMAIL` on the Railway service so the page shows your contact address.)

---

## App content (Policy › App content)

**Privacy policy:** the URL above.

**Ads:** No, the app does not contain ads.

**App access:** All functionality is available without special access. There is no login; an anonymous account is created automatically. Reviewers can test paid levels only by subscribing. If Google asks for access to paid levels, add a note explaining that the levels are sold as subscriptions. You can also give reviewers license-testing access (Play Console › Settings › License testing) so they can subscribe without being charged.

**Content rating (IARC questionnaire):** Category "All other app types". Answer **No** to violence, sexual content, profanity, drugs, gambling, user-to-user communication and sharing location. The app has digital purchases: **Yes**. The expected rating is Everyone / PEGI 3.

**Target audience:** 13 and over (select 13–15, 16–17 and 18+). Don't include under-13 age groups; that would require the Families program. The app isn't designed for children.

**News app:** No.
**Government app:** No.
**Financial features:** None.
**Health:** No.

### Data safety form

**Does your app collect or share any of the required user data types?** Yes.
**Is all collected data encrypted in transit?** Yes (HTTPS).
**Do you provide a way for users to request that their data is deleted?** Yes: by contacting the support email. Session data on the server is deleted automatically within 6 hours.

| Data type | Collected | Shared | Optional? | Purpose | Notes |
| --- | --- | --- | --- | --- | --- |
| Device or other IDs | Yes | No | Required | App functionality, Account management | Anonymous account ID created by the app. It is not the device's advertising ID. |
| Purchase history | Yes | No | Required for members | App functionality | Processed by Google Play and RevenueCat, which acts as our service provider. |
| Name | Yes | No | Optional | App functionality | Only when the user sends a trainer session request. |
| Email address / Phone number | Yes | No | Optional | App functionality | Only when the user sends a trainer session request. Tick whichever they may enter. |
| Other user-generated content | Yes | No | Required | App functionality | The user's answers for each training round, so the server can open the sealed target. Deleted within 6 hours. |

Everything else is **not collected**: location, contacts, photos, audio, health, financial info, web history, app activity analytics, crash logs and diagnostics.

"Shared" means passed to third parties for their own use. Service providers such as RevenueCat and the hosting provider don't count as sharing under Google's definitions.

---

## Subscriptions (Monetize › Subscriptions)

Create three subscriptions. Use these IDs so they match the RevenueCat setup in the README:

| Product ID | Name | Base plan | Suggested price | Benefits (shown on Play) |
| --- | --- | --- | --- | --- |
| `prophesee_seeker_monthly` | Seeker | `monthly`, auto-renewing, 1 month | $4.99 | Levels 1–4 · Unlimited sessions |
| `prophesee_advanced_monthly` | Advanced | `monthly`, auto-renewing, 1 month | $9.99 | Levels 1–6 · Free-text perception · Confidence calibration |
| `prophesee_master_monthly` | Master | `monthly`, auto-renewing, 1 month | $19.99 | All 8 levels · Sealed Watchman trials · Seal ledger |

Then, in RevenueCat, attach each product to the entitlement of the same tier (`seeker`, `advanced`, `master`). Add them to the current offering as packages with those identifiers.

---

## Release

**Recommended track order:** Internal testing (you plus up to 100 testers) → Closed testing → Production.

New personal developer accounts must run a closed test with at least 12 testers for 14 days before they can publish to production. Plan for this.

**Release notes for version 1.0.0:**

```
Welcome to PropheSee. Train your spiritual perception with sealed targets, fair comparisons and honest progress tracking. Eight levels, from colours to sealed blind trials.
```
