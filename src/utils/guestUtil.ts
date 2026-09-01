import type { Guest } from '@components/ui/calendar/GuestTag';
import { parseEmailAddress } from './emailUtil';

export const normalizeGuests = (guestList: any): Guest[] => {
    if (!Array.isArray(guestList)) return [];

    return guestList
        .map((guest: any): Guest | null => {
            if (!guest) return null;

            // Handle string format
            if (typeof guest === 'string') {
                const parsed = parseEmailAddress(guest);
                if (!parsed.email) return null;
                return { name: parsed.name, email: parsed.email };
            }

            // Handle object format
            if (typeof guest === 'object') {
                const email = guest.email || '';
                const name = guest.name || '';
                const partstat = guest.partstat || guest.status || guest.responseStatus || guest.rsvp;

                const parsed = parseEmailAddress(email);
                if (!parsed.email) return null;

                return {
                    name: name || parsed.name,
                    email: parsed.email,
                    partstat,
                };
            }

            return null;
        })
        .filter(Boolean) as Guest[];
};

/**
 * Filters guests by email for removal operations
 */
export const filterGuestByEmail = (guests: string[], emailToRemove: string): string[] => {
    return guests.filter((guest: string) => {
        const parsed = parseEmailAddress(guest);
        return parsed.email !== emailToRemove;
    });
};
