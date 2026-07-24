import { useState } from "react";
import replyIcon from "@images/arrow-uturn-left-icon.svg";
import replyAllIcon from "@images/reply-all-icon.svg";
import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
import replyAllIconHover from "@images/reply-all-icon-hover.svg";
import forwardIcon from "@images/arrow-uturn-right-icon.svg";
import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
import CopyEmail from "@components/ui/email/CopyEmail";
import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
import chevronDownIcon from "@images/chevron-down-icon.svg";
import chevronDownIconHover from "@images/chevron-down-icon-hover.svg";
import chevronUpIcon from "@images/chevron-up-icon.svg";
import chevronUpIconHover from "@images/chevron-up-icon-hover.svg";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import EmailRecipientList from "@components/ui/email/EmailRecipientList";
import { Dropdown } from "react-bootstrap";
import type { Email } from "@models/Email";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { HighlightText } from "@components/ui/HighlightText";

interface EmailSendInformationProps {
  initial: string;
  fromName: string;
  fromEmail: string;
  isSchedule: boolean;
  email: Email;
  searchTerm?: string;
  onReplyForwardAction: (action: string) => void;
}

const EmailSendInformation = ({
  initial,
  fromName,
  fromEmail,
  email,
  searchTerm = "",
  onReplyForwardAction,
}: EmailSendInformationProps) => {
  const emailDate = formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE);
  const [isCcBccExpanded, setIsCcBccExpanded] = useState(false);
  const [toVisibleInfo, setToVisibleInfo] = useState({ visible: 0, total: 0 });

  const hasCc = email.cc?.length > 0;
  const hasBcc = email.bcc?.length > 0;
  const hasMore = hasCc || hasBcc;
  const hasHiddenTo = toVisibleInfo.total > toVisibleInfo.visible;
  const toReserveWidth = !isCcBccExpanded && hasMore ? 32 : 0;

  const toggleCcBcc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCcBccExpanded((prev) => !prev);
  };

  const ToggleChevronButton = () => (
    <button
      type="button"
      className={`btn-new toggle-recipients-btn flex-shrink-0 ${isCcBccExpanded ? "is-expanded" : ""}`}
      onClick={toggleCcBcc}
      aria-label={isCcBccExpanded ? "Hide Cc/Bcc" : "Show Cc/Bcc"}
    >
      <InteractiveIcon
        defaultIcon={isCcBccExpanded ? chevronUpIcon : chevronDownIcon}
        hoverIcon={isCcBccExpanded ? chevronUpIconHover : chevronDownIconHover}
        className="interactive-icon hover-image"
        tooltip=""
      />
    </button>
  );

  return (
    <div className="mail-message-send--information-details-box mail-message-send--information-details-box-mobile">
      <div className="d-block">
        {/* From Section */}
        <div className="mail-details-information-details-box d-flex align-items-start justify-content-between gap-2">
          <div className="d-flex align-items-center position-relative profile-main-box from-info-mobile" style={{ minWidth: 0, flex: 1 }}>
            <span className="label-sm flex-shrink-0">From</span>
            <div className="d-flex align-items-center profile-section" style={{ minWidth: 0, flex: 1 }}>
              <span className="mail-profile-label ms-0 flex-shrink-0">{initial.charAt(0).toUpperCase()}</span>
              <div className="d-block from-info-text" style={{ minWidth: 0, overflow: "hidden" }}>
                <span className="mail-profile-name d-block">
                  <HighlightText text={fromName} searchTerm={searchTerm} />
                </span>
                <span className="mail-profile-id d-block">
                  <HighlightText text={fromEmail} searchTerm={searchTerm} />
                </span>
              </div>
            </div>
            <CopyEmail name={fromName} email={fromEmail} initial={initial} />
          </div>

          {!email.isSchedule && (
            <div className="application-btn-multi flex-shrink-0" id="emailActionsBtn">
              <ul>
                <li>
                  <a
                    href="#"
                    className="hover-link icon-hover-effect"
                    onClick={(e) => {
                      e.preventDefault();
                      onReplyForwardAction("reply");
                    }}
                  >
                    <InteractiveIcon
                      defaultIcon={replyIcon}
                      hoverIcon={replyIconHover}
                      activeIcon=""
                      isActive={false}
                      alt=""
                      className="interactive-icon hover-image"
                      renderAs="img"
                      tooltip="Reply"
                    />
                  </a>
                </li>
                <li>
                  <Dropdown className="react-dropdown application-btn-multi-react-dropdown-mobile">
                    <Dropdown.Toggle as="a" className="hover-link d-flex align-items-center icon-hover-effect">
                      <InteractiveIcon
                        defaultIcon={moreActionIcon}
                        hoverIcon={moreActionIconHover}
                        activeIcon=""
                        isActive={false}
                        alt=""
                        className="interactive-icon hover-image"
                        renderAs="img"
                        tooltip="More"
                      />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item className="justify-content-start d-none">
                        <a
                          href="#"
                          className="hover-link icon-hover-effect"
                          onClick={(e) => {
                            e.preventDefault();
                            onReplyForwardAction("reply");
                          }}
                        >
                          <InteractiveIcon
                            defaultIcon={replyIcon}
                            hoverIcon={replyIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Reply"
                          />
                          <span className="d-flex align-items-center ms-3">Reply</span>
                        </a>
                      </Dropdown.Item>
                      <Dropdown.Item className="justify-content-start">
                        <a
                          href="#"
                          className="hover-link icon-hover-effect"
                          onClick={(e) => {
                            e.preventDefault();
                            onReplyForwardAction("replyAll");
                          }}
                        >
                          <InteractiveIcon
                            defaultIcon={replyAllIcon}
                            hoverIcon={replyAllIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Reply All"
                          />
                          <span className="d-flex align-items-center ms-3">Reply All</span>
                        </a>
                      </Dropdown.Item>
                      <Dropdown.Item className="justify-content-start">
                        <a
                          href="#"
                          className="hover-link icon-hover-effect"
                          onClick={(e) => {
                            e.preventDefault();
                            onReplyForwardAction("forward");
                          }}
                        >
                          <InteractiveIcon
                            defaultIcon={forwardIcon}
                            hoverIcon={forwardIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Forward"
                          />
                          <span className="d-flex align-items-center ms-3">Forward</span>
                        </a>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* To / CC / BCC — same expand/collapse as desktop */}
        <div className="d-flex align-items-end justify-content-between cc-bcc-to-info">
          <div className="d-block" style={{ minWidth: 0, width: "100%" }}>
            <div className="mail-details-information-details-box d-flex align-items-start m-0">
              <span className="label-sm flex-shrink-0">To</span>
              <div className="d-flex align-items-center flex-grow-1 tomail-list" style={{ minWidth: 0 }}>
                <EmailRecipientList
                  emails={email.to}
                  searchTerm={searchTerm}
                  reserveWidth={toReserveWidth}
                  onVisibleCountChange={(visible, total) => setToVisibleInfo({ visible, total })}
                  trailingElement={!isCcBccExpanded && hasMore ? <ToggleChevronButton /> : null}
                  expanded={isCcBccExpanded}
                />
                {!isCcBccExpanded && !hasMore && hasHiddenTo && (
                  <span className="hidden-count-badge flex-shrink-0">
                    +{toVisibleInfo.total - toVisibleInfo.visible}
                  </span>
                )}
              </div>
            </div>

            {isCcBccExpanded && hasCc && (
              <div className="mail-details-information-details-box d-flex align-items-start m-0">
                <span className="label-sm flex-shrink-0">CC</span>
                <div className="d-flex align-items-center flex-grow-1 tomail-list" style={{ minWidth: 0 }}>
                  <EmailRecipientList
                    emails={email.cc}
                    searchTerm={searchTerm}
                    reserveWidth={!hasBcc ? 32 : 0}
                    trailingElement={!hasBcc ? <ToggleChevronButton /> : null}
                    expanded
                  />
                </div>
              </div>
            )}

            {isCcBccExpanded && hasBcc && (
              <div className="mail-details-information-details-box d-flex align-items-start m-0">
                <span className="label-sm flex-shrink-0">BCC</span>
                <div className="d-flex align-items-center flex-grow-1 tomail-list" style={{ minWidth: 0 }}>
                  <EmailRecipientList
                    emails={email.bcc}
                    searchTerm={searchTerm}
                    reserveWidth={32}
                    trailingElement={<ToggleChevronButton />}
                    expanded
                  />
                </div>
              </div>
            )}
          </div>

          <span className="info-received-details d-block flex-shrink-0">{emailDate}</span>
        </div>
      </div>
    </div>
  );
};

export default EmailSendInformation;
