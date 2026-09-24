import { Linking } from 'react-native';

import { trainerEmail } from '../constants/config';
import type { TierId, TrainerBooking } from '../types';
import { ensureSignedIn } from './account';
import { api, isServerMode } from './api';

/** How trainer requests are delivered: to the server, by email, or not yet available. */
export const bookingChannel: 'server' | 'email' | 'none' = isServerMode ? 'server' : trainerEmail ? 'email' : 'none';

export async function sendBooking(booking: TrainerBooking, tier: TierId): Promise<void> {
  if (bookingChannel === 'server') {
    await ensureSignedIn();
    await api.post('/trainer/bookings', {
      name: booking.name,
      contact: booking.contact,
      preferredTime: booking.preferredTime,
      notes: booking.notes,
    });
    return;
  }
  if (bookingChannel === 'email') {
    const subject = encodeURIComponent('PropheSee 1-to-1 trainer session request');
    const body = encodeURIComponent(
      `Name: ${booking.name}\nContact: ${booking.contact}\nPreferred time: ${booking.preferredTime}\nPlan: ${tier}\n\n${booking.notes}`,
    );
    try {
      await Linking.openURL(`mailto:${trainerEmail}?subject=${subject}&body=${body}`);
    } catch {
      throw new Error(`No email app is available on this device. Please email your request to ${trainerEmail}.`);
    }
    return;
  }
  throw new Error('Trainer bookings open soon.');
}
