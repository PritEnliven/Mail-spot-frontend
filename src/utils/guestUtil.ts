import { parseEmailAddress } from './emailUtil';
import type { Guest } from '@components/ui/calendar/GuestTag';

/**
 * Normalizes guest data from various formats into Guest objects
 * Handles strings, objects, and arrays consistently
 */
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
                
                const parsed = parseEmailAddress(email);
                if (!parsed.email) return null;
                
                return { 
                    name: name || parsed.name, 
                    email: parsed.email 
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
