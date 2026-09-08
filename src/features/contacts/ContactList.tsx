import InteractiveIcon from '@components/ui/InteractiveIcon';
import type { Contact } from '@models/Contact';
import editIcon from '@images/edit2-icon.svg';
import editIconHover from '@images/edit2-icon-hover.svg';
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';
// import mailIcon from '@images/mail-icon.svg';
// import mailIconHover from '@images/mail-icon-hover.svg';
// import composeIcon from '@images/compose2-icon.svg';
// import composeIconHover from '@images/compose2-icon-hover.svg';

interface ContactListProps {
    contacts: Contact[];
    isLoading: boolean;     
    startIndex: number;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    // onCompose: (contact: Contact) => void;
    // onViewEmails: (contact: Contact) => void;
}

function ContactList({
    contacts,
    isLoading,
    startIndex,
    onEdit,
    onDelete,
    // onCompose,
    // onViewEmails,
}: ContactListProps) {
    if (isLoading) {
        return (
            <tr>
                <td colSpan={5} className="text-center py-4 fs-12-commom">
                    Loading contacts...
                </td>
            </tr>
        );
    }

    if (contacts.length === 0) {
        return (
            <tr>
                <td colSpan={5} className="text-center py-4">
                    <div className="no-new-mail">
                        <div className="d-block text-center">
                            <h2 className="new-h2 mb-2">No saved contacts yet</h2>
                            <p className="fs-12-commom">
                                People you email will still appear when you compose.
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <>
            {contacts.map((contact, index) => (
                <tr className="blue-line-aft" key={contact._id}>
                    <td>{startIndex + index}</td>
                    <td>{contact.name}</td>
                    <td>{contact.email}</td>
                    <td>{contact.phone?.trim() ? contact.phone : '—'}</td>
                    <td>
                        <div className="d-flex align-items-center justify-content-end">
                            {/* <a
                                href="#"
                                className="hover-link d-flex align-items-center me-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onCompose(contact);
                                }}
                                aria-label={`Compose to ${contact.name}`}
                            >
                                <InteractiveIcon
                                    defaultIcon={composeIcon}
                                    hoverIcon={composeIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Compose"
                                />
                            </a>
                            <a
                                href="#"
                                className="hover-link d-flex align-items-center me-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onViewEmails(contact);
                                }}
                                aria-label={`View emails with ${contact.name}`}
                            >
                                <InteractiveIcon
                                    defaultIcon={mailIcon}
                                    hoverIcon={mailIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="View emails"
                                />
                            </a> */}
                            <a
                                href="#"
                                className="hover-link d-flex align-items-center me-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onEdit(contact);
                                }}
                                aria-label={`Edit ${contact.name}`}
                            >
                                <InteractiveIcon
                                    defaultIcon={editIcon}
                                    hoverIcon={editIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Edit"
                                />
                            </a>
                            <a
                                href="#"
                                className="hover-link d-flex align-items-center"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onDelete(contact);
                                }}
                                aria-label={`Delete ${contact.name}`}
                            >
                                <InteractiveIcon
                                    defaultIcon={deleteIcon}
                                    hoverIcon={deleteIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Delete"
                                />
                            </a>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}

export default ContactList;
