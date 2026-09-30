import InteractiveIcon from '@components/ui/InteractiveIcon';
import { showError } from '@components/ui/toast/toastNotification';
import {
    downloadBlobFile,
    exportContacts,
    type ContactExportFormat,
} from '@services/contact/contactService';
import arrowDownTrayIcon from '@images/arrow-down-tray-icon.svg';
import arrowDownTrayIconHover from '@images/arrow-down-tray-icon-hover.svg';
import chevronDownIcon from '@images/chevron-down-icon.svg';
import { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

interface ContactsExportMenuProps {
    /** Icon-only trigger for compact / mobile toolbars */
    compact?: boolean;
}

function ContactsExportMenu({ compact = false }: ContactsExportMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: ContactExportFormat) => {
        if (isExporting) return;
        setMenuOpen(false);
        setIsExporting(true);
        try {
            const result = await exportContacts(format);
            if (!result.success) {
                if (!result.statusCode || result.statusCode !== 401) {
                    showError(result.message || 'Failed to export contacts');
                }
                return;
            }
            downloadBlobFile(result.blob, result.filename);
        } catch {
            showError('Failed to export contacts');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dropdown
            className="contacts-export-dropdown"
            show={menuOpen}
            onToggle={(next) => {
                if (isExporting) return;
                setMenuOpen(next);
            }}
            align="end"
        >
            <Dropdown.Toggle
                as="button"
                type="button"
                className={`btn-new hover-link contacts-export-btn${compact ? ' contacts-export-btn--compact' : ''}`}
                disabled={isExporting}
                aria-label="Export contacts"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-busy={isExporting}
            >
                {isExporting ? (
                    <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                    />
                ) : (
                    <InteractiveIcon
                        defaultIcon={arrowDownTrayIcon}
                        hoverIcon={arrowDownTrayIconHover}
                        activeIcon={arrowDownTrayIconHover}
                        isActive={menuOpen}
                        alt=""
                        className="interactive-icon hover-image"
                        renderAs="img"
                        tooltip={compact ? 'Export' : ''}
                    />
                )}
                {!compact && <span>{isExporting ? 'Exporting…' : 'Export'}</span>}
                {!compact && !isExporting && (
                    <img
                        src={chevronDownIcon}
                        alt=""
                        className="contacts-export-chevron"
                        width={16}
                        height={16}
                    />
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu
                renderOnMount
                role="menu"
                aria-label="Export format"
                className="contacts-export-menu"
                popperConfig={{
                    strategy: 'fixed',
                    modifiers: [
                        { name: 'offset', options: { offset: [0, 4] } },
                        { name: 'preventOverflow', options: { boundary: 'viewport', padding: 10 } },
                    ],
                }}
            >
                <Dropdown.Item
                    as="button"
                    type="button"
                    role="menuitem"
                    disabled={isExporting}
                    onClick={() => void handleExport('csv')}
                >
                    CSV
                </Dropdown.Item>
                <Dropdown.Item
                    as="button"
                    type="button"
                    role="menuitem"
                    disabled={isExporting}
                    onClick={() => void handleExport('vcf')}
                >
                    vCard (.vcf)
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default ContactsExportMenu;
