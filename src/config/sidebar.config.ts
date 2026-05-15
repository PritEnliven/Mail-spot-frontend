import inboxIcon from '@images/inbox-icon.svg';
import inboxIconActive from '@images/inbox-icon-active.svg';
import scheduledIcon from '@images/scheduled-icon.svg';
import scheduledIconActive from '@images/scheduled-icon-active.svg';
import draftIcon from '@images/draft-icon.svg';
import draftIconActive from '@images/draft-icon-active.svg';
import sendIcon from '@images/send-icon.svg';
import sendIconActive from '@images/send-icon-active.svg';
import junkIcon from '@images/junk-icon.svg';
import junkIconActive from '@images/junk-icon-active.svg';
import trashIcon from '@images/trash-icon.svg';
import trashIconActive from '@images/trash-icon-active.svg';
import importantIcon from '@images/important-icon.svg';
import importantIconActive from '@images/important-icon-active.svg';
import starredIcon from '@images/starred-icon.svg';
import starredIconActive from '@images/starred-icon-active.svg';
import contactIcon from '@images/contact-icon.svg';
import contactIconActive from '@images/contact-icon-active.svg';
import calendarIcon from '@images/calendar-icon.svg';
import calendarIconActive from '@images/calendar-icon-active.svg';
import settingIcon from '@images/setting-icon.svg';
import settingIconActive from '@images/setting-icon-active.svg';

const sidebarConfig = {
    menuItems: [
        {
            id: 'inbox',
            label: 'Inbox',
            originalIcon: inboxIcon,
            activeIcon: inboxIconActive,
            active: true
        },
        {
            id: 'scheduled',
            label: 'Scheduled',
            originalIcon: scheduledIcon,
            activeIcon: scheduledIconActive
        },
        {
            id: 'drafts',
            label: 'Drafts',
            originalIcon: draftIcon,
            activeIcon: draftIconActive
        },
        {
            id: 'sent',
            label: 'Sent',
            originalIcon: sendIcon,
            activeIcon: sendIconActive
        },
        {
            id: 'junk',
            label: 'Junk',
            originalIcon: junkIcon,
            activeIcon: junkIconActive
        },
        {
            id: 'spam',
            label: 'Spam',
            originalIcon: junkIcon,
            activeIcon: junkIconActive
        },
        {
            id: 'trash',
            label: 'Trash',
            originalIcon: trashIcon,
            activeIcon: trashIconActive
        },
        {
            id: 'important',
            label: 'Important',
            originalIcon: importantIcon,
            activeIcon: importantIconActive
        },
        {
            id: 'starred',
            label: 'Starred',
            originalIcon: starredIcon,
            activeIcon: starredIconActive
        },
        {
            id: 'contact',
            label: 'Contact',
            originalIcon: contactIcon,
            activeIcon: contactIconActive
        },
        {
            id: 'calendar',
            label: 'Calendar',
            originalIcon: calendarIcon,
            activeIcon: calendarIconActive
        },
        {
            id: 'settings',
            label: 'Settings',
            originalIcon: settingIcon,
            activeIcon: settingIconActive
        }
    ]
};

export default sidebarConfig;