import { z } from 'zod';

export const SHARE_PERMISSION_OPTIONS = [
    { value: 'view', label: 'View' },
    { value: 'edit', label: 'Edit' },
    { value: 'manage', label: 'Manage' },
] as const;

export const shareCalendarInviteSchema = z.object({
    emails: z
        .array(z.string().email('Invalid email address'))
        .min(1, 'Add at least one email'),
    permission: z.enum(['view', 'edit', 'manage']),
});

export type ShareCalendarInviteValues = z.infer<typeof shareCalendarInviteSchema>;
