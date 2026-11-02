import InteractiveIcon from "@components/ui/InteractiveIcon";
import editIcon from "@images/edit2-icon.svg";
import editIconHover from "@images/edit2-icon-hover.svg";
import deleteIcon from "@images/trash-icon.svg";
import deleteIconHover from "@images/trash-icon-hover.svg";
import loginIcon from "@images/login-icon.svg";
import loginIconHover from "@images/login-icon-hover.svg";

interface ActionsCellProps {
    id: string;
    onClickEditUser: (id: string) => void;
    onClickDeleteUser: (id: string) => void;
    onClickLoginAsUser: (id: string) => void;
}

const ActionsCell = ({
    id,
    onClickEditUser,
    onClickDeleteUser,
    onClickLoginAsUser,
}: ActionsCellProps) => {
    return (
        <div className="d-flex align-items-center">
            <a
                href="#"
                className="hover-link d-flex align-items-center me-2"
                onClick={(e) => {
                    e.preventDefault();
                    onClickEditUser(id);
                }}
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
                onClick={(e) => {
                    e.preventDefault();
                    onClickDeleteUser(id);
                }}
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
                onClick={(e) => {
                    e.preventDefault();
                    onClickLoginAsUser(id);
                }}
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
