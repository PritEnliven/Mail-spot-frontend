// import replyIcon from "@images/arrow-uturn-left-icon.svg";
// import replyAllIcon from "@images/reply-all-icon.svg";
// import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
// import replyAllIconHover from "@images/reply-all-icon-hover.svg";
// import forwardIcon from "@images/arrow-uturn-right-icon.svg";
// import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
// import CopyEmail from "@components/ui/email/CopyEmail";
// import closeIcon from "@images/close-icon.svg";
// import closeIconHover from "@images/close-icon-hover.svg";
// import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
// import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
// import InteractiveIcon from "@components/ui/InteractiveIcon";
// import EmailRecipientList from "@components/ui/email/EmailRecipientList";
// import { Dropdown } from "react-bootstrap";
// import type { Email } from "@models/Email";
// import { formatDate, TimeFormat } from "@utils/dateUtil";

// interface EmailSendInformation {
//     initial: string;
//     fromName: string;
//     fromEmail: string;
//     isSchedule: boolean;
//     email: Email
//     onReplyForwardAction: (action: string) => void;
// }

// const EmailSendInformation = (info: EmailSendInformation) => {

//     const { initial, fromName, fromEmail, email, onReplyForwardAction } = info;
//     const emailDate = formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE);


//     return (
//         <div className="mail-message-send--information-details-box mail-message-send--information-details-box-mobile" >
//             <div className="d-block">
//                 <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
//                     <div className="d-flex align-items-center justify-content-between position-relative profile-main-box">
//                         <span className="label-sm">From</span>
//                         <div className="d-flex align-items-center profile-section">
//                             <span className="mail-profile-label ms-0">
//                                 {initial.charAt(0).toUpperCase()}
//                             </span>
//                             <div className="d-block">
//                                 <span className="mail-profile-name d-block">
//                                     {fromName}
//                                 </span>
//                                 <span className="mail-profile-id d-block">{fromEmail}</span>
//                             </div>
//                         </div>
//                         <CopyEmail name={fromName} email={fromEmail} initial={initial} />
//                     </div>



//                     {!email.isSchedule && (
//                         <div className="application-btn-multi" id="emailActionsBtn">
//                             <ul>
//                                 <li>
//                                     <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); onReplyForwardAction("reply"); }}>
//                                         <InteractiveIcon
//                                             defaultIcon={replyIcon}
//                                             hoverIcon={replyIconHover}
//                                             activeIcon=""
//                                             isActive={false}
//                                             alt=""
//                                             className="interactive-icon hover-image"
//                                             renderAs="img"
//                                             tooltip="Reply"
//                                         />
//                                     </a>
//                                 </li>
//                                 <li>
//                                     <Dropdown className="react-dropdown application-btn-multi-react-dropdown-mobile">
//                                         <Dropdown.Toggle
//                                             as="a"
//                                             className="hover-link d-flex align-items-center icon-hover-effect"
//                                         >
//                                             <InteractiveIcon
//                                                 defaultIcon={moreActionIcon}
//                                                 hoverIcon={moreActionIconHover}
//                                                 activeIcon=""
//                                                 isActive={false}
//                                                 alt=""
//                                                 className="interactive-icon hover-image"
//                                                 renderAs="img"
//                                                 tooltip="More"
//                                             />
//                                         </Dropdown.Toggle>

//                                         <Dropdown.Menu>
//                                             <Dropdown.Item className="justify-content-start d-none">
//                                                 <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); onReplyForwardAction("reply"); }}>
//                                                     <InteractiveIcon
//                                                         defaultIcon={replyIcon}
//                                                         hoverIcon={replyIconHover}
//                                                         activeIcon=""
//                                                         isActive={false}
//                                                         alt=""
//                                                         className="interactive-icon hover-image"
//                                                         renderAs="img"
//                                                         tooltip="Reply"
//                                                     />
//                                                     <span className="d-flex align-items-center ms-3">Reply</span>
//                                                 </a>
//                                             </Dropdown.Item>
//                                             <Dropdown.Item className="justify-content-start">
//                                                 <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); onReplyForwardAction("replyAll"); }}>
//                                                     <InteractiveIcon
//                                                         defaultIcon={replyAllIcon}
//                                                         hoverIcon={replyAllIconHover}
//                                                         activeIcon=""
//                                                         isActive={false}
//                                                         alt=""
//                                                         className="interactive-icon hover-image"
//                                                         renderAs="img"
//                                                         tooltip="Reply All"
//                                                     />
//                                                     <span className="d-flex align-items-center ms-3">Reply All</span>
//                                                 </a>
//                                             </Dropdown.Item>
//                                             <Dropdown.Item className="justify-content-start">
//                                                 <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); onReplyForwardAction("forward"); }}>
//                                                     <InteractiveIcon
//                                                         defaultIcon={forwardIcon}
//                                                         hoverIcon={forwardIconHover}
//                                                         activeIcon=""
//                                                         isActive={false}
//                                                         alt=""
//                                                         className="interactive-icon hover-image"
//                                                         renderAs="img"
//                                                         tooltip="Forward"
//                                                     />
//                                                     <span className="d-flex align-items-center ms-3">Forward</span>
//                                                 </a>
//                                             </Dropdown.Item>
//                                         </Dropdown.Menu>
//                                     </Dropdown>
//                                 </li>
//                             </ul>
//                         </div>
//                     )}
//                 </div>

//                 <div className="d-flex align-items-end justify-content-between cc-bcc-to-info">
//                     <div className="d-block">
//                         {/* To */}
//                         <div className="mail-details-information-details-box  d-flex align-items-start m-0">
//                             <span className="label-sm">To</span>
//                             <div className="d-flex align-items-center tomail-list">
//                                 <EmailRecipientList emails={email.to} />
//                             </div>
//                         </div>

//                         {/* CC */}
//                         {email.cc.length > 0 && (
//                             <div className="mail-details-information-details-box d-flex align-items-center m-0">
//                                 <span className="label-sm">CC</span>
//                                 <div className="d-flex align-items-center tomail-list">
//                                     <EmailRecipientList emails={email.cc} />
//                                 </div>
//                             </div>
//                         )}

//                         {/* BCC */}
//                         {email.bcc.length > 0 && (
//                             <div className="mail-details-information-details-box d-flex align-items-center m-0">
//                                 <span className="label-sm">BCC</span>
//                                 <div className="d-flex align-items-center tomail-list">
//                                     <EmailRecipientList emails={email.bcc} />
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                     {/* Actions */}
//                     <span className="info-received-details d-block">
//                         {emailDate}
//                     </span>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default EmailSendInformation;





import { useEffect, useRef, useState } from "react";
import replyIcon from "@images/arrow-uturn-left-icon.svg";
import replyAllIcon from "@images/reply-all-icon.svg";
import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
import replyAllIconHover from "@images/reply-all-icon-hover.svg";
import forwardIcon from "@images/arrow-uturn-right-icon.svg";
import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
import CopyEmail from "@components/ui/email/CopyEmail";
import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import EmailRecipientList from "@components/ui/email/EmailRecipientList";
import { Dropdown } from "react-bootstrap";
import type { Email } from "@models/Email";
import { formatDate, TimeFormat } from "@utils/dateUtil";

interface EmailSendInformationProps {
  initial: string;
  fromName: string;
  fromEmail: string;
  isSchedule: boolean;
  email: Email;
  onReplyForwardAction: (action: string) => void;
}

const EmailSendInformation = ({
  initial,
  fromName,
  fromEmail,
  email,
  onReplyForwardAction,
}: EmailSendInformationProps) => {
  const emailDate = formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE);

  const emailListRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const debounce = (func: () => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(func, delay);
    };
  };

  const updateTogglePosition = () => {
    if (!emailListRef.current || !toggleBtnRef.current) return;

    const emailList = emailListRef.current;
    const toggleBtn = toggleBtnRef.current;
    const allEmails = Array.from(emailList.querySelectorAll<HTMLElement>(".from-cc-details"));

    if (isExpanded) {
      toggleBtn.style.display = "inline-block";
      toggleBtn.querySelector("img")!.style.transform = "rotate(180deg)";
      toggleBtn.querySelector("img")!.alt = "Show Less";
      return;
    }

    // Collapse: show only first email and place toggle button next to it
    allEmails.forEach((email, index) => {
      email.style.display = index === 0 ? "inline-block" : "none";
    });

    const firstEmail = allEmails[0];
    if (firstEmail) {
      firstEmail.after(toggleBtn);
      toggleBtn.style.display = "inline-block";
      toggleBtn.querySelector("img")!.style.transform = "rotate(0deg)";
      toggleBtn.querySelector("img")!.alt = "Show More";
    }
  };

  useEffect(() => {
    updateTogglePosition();
  }, [isExpanded]);

  useEffect(() => {
    const handleResize = debounce(() => {
      if (!isExpanded) updateTogglePosition();
    }, 250);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  const handleToggleClick = () => setIsExpanded(prev => !prev);

  return (
    <div className="mail-message-send--information-details-box mail-message-send--information-details-box-mobile">
      <div className="d-block">
        {/* From Section */}
        <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
          <div className="d-flex align-items-center justify-content-between position-relative profile-main-box">
            <span className="label-sm">From</span>
            <div className="d-flex align-items-center profile-section">
              <span className="mail-profile-label ms-0">{initial.charAt(0).toUpperCase()}</span>
              <div className="d-block">
                <span className="mail-profile-name d-block">{fromName}</span>
                <span className="mail-profile-id d-block">{fromEmail}</span>
              </div>
            </div>
            <CopyEmail name={fromName} email={fromEmail} initial={initial} />
          </div>

          {!email.isSchedule && (
            <div className="application-btn-multi" id="emailActionsBtn">
              <ul>
                <li>
                  <a
                    href="#"
                    className="hover-link icon-hover-effect"
                    onClick={e => {
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
                          onClick={e => {
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
                          onClick={e => {
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
                          onClick={e => {
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

        {/* To / CC / BCC */}
        <div className="d-flex align-items-end justify-content-between cc-bcc-to-info">
          <div className="d-block" ref={emailListRef}>
            {/* To */}
            <div className="mail-details-information-details-box d-flex align-items-start m-0">
              <span className="label-sm">To</span>
              <div className="d-flex align-items-center tomail-list">
                <EmailRecipientList emails={email.to} />
              </div>
            </div>

            {/* CC */}
            {email.cc.length > 0 && (
              <div className="mail-details-information-details-box d-flex align-items-center m-0">
                <span className="label-sm">CC</span>
                <div className="d-flex align-items-center tomail-list from-cc-details">
                  <EmailRecipientList emails={email.cc} />
                </div>
              </div>
            )}

            {/* BCC */}
            {email.bcc.length > 0 && (
              <div className="mail-details-information-details-box d-flex align-items-center m-0">
                <span className="label-sm">BCC</span>
                <div className="d-flex align-items-center tomail-list from-cc-details">
                  <EmailRecipientList emails={email.bcc} />
                </div>
              </div>
            )}

            {/* Toggle Button */}
            {(email.cc.length > 0 || email.bcc.length > 0) && (
              <button
                ref={toggleBtnRef}
                className="toggle-more-btn ms-2"
                onClick={handleToggleClick}
              >
                <img src={moreActionIcon} alt="Show More" />
              </button>
            )}
          </div>

          {/* Date */}
          <span className="info-received-details d-block">{emailDate}</span>
        </div>
      </div>
    </div>
  );
};

export default EmailSendInformation;