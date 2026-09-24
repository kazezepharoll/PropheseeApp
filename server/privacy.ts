import { privacySections, privacyUpdated, termsUrl } from '../src/data/legal';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Public privacy policy page for the store listings, rendered from the same text the app shows. */
export function privacyPage(): string {
  const email = process.env.SUPPORT_EMAIL;
  const sections = privacySections.map((s) => `<h2>${esc(s.title)}</h2>\n<p>${esc(s.body)}</p>`).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PropheSee Privacy Policy</title>
<style>
  body { margin: 0; background: #12102E; color: #F4F1FF; font: 17px/1.6 system-ui, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  h1, h2 { font-family: Georgia, serif; } h1 { font-size: 32px; margin-bottom: 4px; } h2 { font-size: 21px; margin-top: 32px; color: #E9B949; }
  a { color: #E9B949; } .muted { color: #B7B2DD; }
</style></head>
<body><main>
<h1>PropheSee Privacy Policy</h1>
<p class="muted">Last updated ${esc(privacyUpdated)}</p>
${sections}
<h2>Contact</h2>
<p>${email ? `Questions or data requests: <a href="mailto:${esc(email)}">${esc(email)}</a>` : 'Questions or data requests: use the contact details on our store listing.'}</p>
<p><a href="${termsUrl}">Terms of Use (EULA)</a></p>
</main></body></html>`;
}
