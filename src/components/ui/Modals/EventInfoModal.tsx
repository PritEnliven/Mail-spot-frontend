import InteractiveIcon from "../InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import trashIcon from "@images/trash-icon.svg";
import trashIconHover from "@images/trash-icon-hover.svg";
import edit2Icon from "@images/edit-icon.svg";
import edit2IconHover from "@images/edit-icon.svg";
import descriptionIcon16 from "@images/description-icon-16.svg";
import locationIcon16 from "@images/location-icon-16.svg";
import linkIcon16 from "@images/link-icon-16.svg";
import addPesionIcon from "@images/add-pesion-icon.svg"
import BaseModal from "@components/ui/BaseModal";
import GuestTag, { type Guest } from "@components/ui/calendar/GuestTag";
import { useMailUI } from "@context/MailUIContext";
import { normalizeGuests } from "@utils/guestUtil";
import { removeFocusEvent } from "@utils/calendarUtil";
import type { EventDetail } from "@models/CalendarModels";
import { useCalendar } from "@context/CalendarContext";
import { deleteEvent } from "@services/calendar/calendarService";
import { showError, showSuccess } from "../toast/toastNotification";
import { copyEmailToClipBoard } from "@utils/generalUtil";
import SimpleBar from 'simplebar-react';

interface EventInfoModalProps {
    modalId: string;
    zIndex: number;
    event: EventDetail;
}

function EventInfoModal({ modalId, zIndex, event }: EventInfoModalProps) {
    const { closeModal, openModal } = useMailUI();
    const { selectedEvent, getAllEventList } = useCalendar();

    const onClose = () => {
        removeFocusEvent();
        closeModal(modalId);
    };

    console.log(event);

    const guests: Guest[] = normalizeGuests(event.guestList);

    const editEventHandler = () => {
        event.isEdit = true;
        openModal('calendarEvent', { ...event, parentModalId: modalId });
    };

    const deleteEventOnConfirm = async (deleteEventType: 'thisEvent' | 'thisAndFollowingEvent' | 'allEvent') => {
        const selectedEventDateValue = selectedEvent?.selectedEventDate;

        const eventDate = selectedEventDateValue
            ? (() => {
                const d = new Date(selectedEventDateValue as any);
                return isNaN(d.getTime()) ? undefined : d;
            })()
            : undefined;

        const payload = {
            eventDate,
            eventId: selectedEvent?.id || '',
            recurringEventType: deleteEventType
        }
        const response = await deleteEvent(payload);
        if (response.statusCode === 200) {
            getAllEventList()
            showSuccess('Event deleted successfully')
            onClose();
        }
        else {
            showError('Error while delete event');
        }

    }

    const deleteEventHandler = () => {
        openModal('recurrenceModal', {
            onConfirm: deleteEventOnConfirm
        });
    }

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className=""
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 640px)"
        >
            <div className="event-info-modal"
                id="eventInfoModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-w-640 modal-box-shadow-c1">
                        <div className="modal-header drag-handle">
                            <button className="btn hover-link icon-hover-effect drag-handle-btn">
                                <InteractiveIcon
                                    defaultIcon={arrowPointingOutIcon}
                                    hoverIcon={arrowPointingOutIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Move"
                                />
                            </button>
                            <h1 className="modal-title modal-title-center" id="eventInfoModalLabel"></h1>
                            <div className="d-flex align-items-center modal-btn-group">
                                <button type="button" className="hover-link btn  icon-hover-effect" onClick={editEventHandler}>
                                    <InteractiveIcon
                                        defaultIcon={edit2Icon}
                                        hoverIcon={edit2IconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Edit"
                                    />
                                </button>
                                <button type="button" className="hover-link btn  icon-hover-effect" onClick={deleteEventHandler}>
                                    <InteractiveIcon
                                        defaultIcon={trashIcon}
                                        hoverIcon={trashIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Delete"
                                    />
                                </button>
                                <button type="button" className="btn-close hover-link btn  icon-hover-effect" onClick={onClose}>
                                    <InteractiveIcon
                                        defaultIcon={closeIcon}
                                        hoverIcon={closeIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Close"
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="modal-body p-0">
                            <SimpleBar
                                className="eventInfoModalSimpleBar"
                                autoHide={false}
                                forceVisible="y"
                            >
                               <div className="event-info-modal-body pb-0">
                                    <div className="blue-line-aft single-event-detail-box" >
                                        <p id="eventInfoTitle" className="m-0 box-title mb-3">{event.title}</p>
                                        <ul className="time-information-event-sec mb-1">
                                            <li>
                                                <p id="eventInfoStartDate" className="mb-0">{event.startDate}</p>
                                                <p className="break-point mx-1 mb-0">to</p>
                                                <p id="eventInfoEndDate" className="mb-0">{event.endDate}</p>
                                            </li>
                                            {!event.allDay && (
                                                <li id="eventTimeSection">
                                                    <p id="eventInfoStartTime" className="mb-0">{event.startTime}</p>
                                                    <p className="break-point mx-1 mb-0">to</p>
                                                    <p id="eventInfoEndTime" className="mb-0">{event.endTime}</p>
                                                </li>
                                            )}
                                        </ul>
                                        <p id="eventInfoRecurrence" className="week-name-detail-evetn"></p>
                                    </div>
                                    <div className="single-event-detail-box">
                                        <span className="single-event-detail-title">
                                            <img src={descriptionIcon16} alt="" className="me-2" />
                                            Description
                                        </span>
                                        <div>
                                            <p id="eventInfoDescription" className="m-0">{event.eventDescription || 'No Description'}</p>
                                        </div>
                                    </div>

                                    <div className="single-event-detail-box">
                                        <span className="single-event-detail-title">
                                            <img src={locationIcon16} alt="" className="me-2" />
                                            Location
                                        </span>
                                        <div>
                                            <p id="eventInfoLocation" className="m-0">{event.location || 'No Location'}</p>
                                        </div>
                                    </div>

                                    <div className="single-event-detail-box">
                                        <span className="single-event-detail-title">
                                            <img src={linkIcon16} alt="" className="me-2" />
                                            Meeting link
                                        </span>
                                        <div>
                                            <a href={event.meetingLink} id="eventInfoMeeting" className="link-ap" target="_blank" rel="noopener noreferrer">{event.meetingLink || 'No Meeting Link'}</a>
                                        </div>
                                    </div>

                                    <div className="single-event-detail-box">
                                        <span className="single-event-detail-title">
                                            <img src={addPesionIcon} alt="" className="me-2" />
                                            Guests
                                        </span>
                                        <div className="tag-addmail-box-main-t mb-3" id="eventInfoGuestList">
                                            <SimpleBar
                                                    className="gustsTagsScrollbar"
                                                    autoHide={false}
                                                    forceVisible="y"
                                                >
                                            {guests.length > 0
                                                ? guests.map((guest, index) => (
                                                    <GuestTag
                                                        key={`${guest.email}-${index}`}
                                                        guest={guest}
                                                        mode="view"
                                                        onCopy={copyEmailToClipBoard}
                                                    />
                                                ))
                                                : <p className="m-0">No Guests</p>
                                            }
                                            </SimpleBar>
                                        </div>
                                    </div>
                               </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default EventInfoModal;