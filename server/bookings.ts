import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface BookingRequest {
  userId: string;
  name: string;
  contact: string;
  preferredTime: string;
  notes: string;
  tier: string;
  createdAt: string;
}

const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
const webhook = process.env.TRAINER_WEBHOOK_URL;

/**
 * Saves the request to DATA_DIR/bookings.jsonl and, if TRAINER_WEBHOOK_URL is set,
 * posts it there (Slack, Discord, Zapier and Make all accept `{ text }`).
 */
export async function saveBooking(b: BookingRequest): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await appendFile(join(dataDir, 'bookings.jsonl'), `${JSON.stringify(b)}\n`);
  if (webhook) {
    const text = `New PropheSee trainer request\nName: ${b.name}\nContact: ${b.contact}\nPreferred time: ${b.preferredTime}\nPlan: ${b.tier}\n${b.notes}`;
    const res = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    if (!res.ok) console.error(`Trainer webhook failed with ${res.status}`);
  }
}
