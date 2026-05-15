import InteractiveIcon from "@components/ui/InteractiveIcon";
import changePasswordIcon from "@images/change-password-new-icon.svg";
import changePasswordIconHover from "@images/change-password-new-icon-hover.svg";
import editIcon from "@images/edit2-icon.svg";
import editIconHover from "@images/edit2-icon-hover.svg";
import deleteIcon from "@images/trash-icon.svg";
import deleteIconHover from "@images/trash-icon-hover.svg";
import loginIcon from "@images/login-icon.svg";
import loginIconHover from "@images/login-icon-hover.svg"

// ActionsCell.tsx
interface ActionsCellProps {
    id: string;
    onClickChangePassword: (id: string) => void;
    onClickEditUser: (id: string) => void;
    onClickDeleteUser: (id: string) => void;
    onClickLoginAsUser: (id: string) => void;
}

const ActionsCell = ({ id, onClickChangePassword, onClickEditUser, onClickDeleteUser, onClickLoginAsUser }: ActionsCellProps) => {

    return (
        <div className="d-flex align-items-center">
            <a
                href="#"
                className="hover-link d-flex align-items-center me-2"
                onClick={() => onClickChangePassword(id)}
            >
                <InteractiveIcon
                    defaultIcon={changePasswordIcon}
                    hoverIcon={changePasswordIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Change Password"
                />
            </a>

            <a
                href="#"
                className="hover-link d-flex align-items-center me-2"
                onClick={() => onClickEditUser(id)}
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
                className="hover-link d-flex align-items-center me-2"
                onClick={() => onClickDeleteUser(id)}
            >
                <InteractiveIcon
                    defaultIcon={deleteIcon}
                    hoverIcon={deleteIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Delete user"
                />
            </a>

            <a
                href="#"
                className="hover-link d-flex align-items-center me-2"
                onClick={() => onClickLoginAsUser(id)}
            >
                <InteractiveIcon
                    defaultIcon={loginIcon}
                    hoverIcon={loginIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Login as user"
                />
            </a>
        </div>
    );
};

export default ActionsCell;
