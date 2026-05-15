import type { Signature } from "@features/settings/settings.schema"
import InteractiveIcon from "@components/ui/InteractiveIcon"
import editIcon from "@images/edit2-icon.svg"
import editIconHover from "@images/edit2-icon-hover.svg"
import deleteIcon from "@images/trash-icon.svg"
import deleteIconHover from "@images/trash-icon-hover.svg"

interface SignatureListProps {
    signatures: Signature[],
    selectedSignatureId: string | null,
    onSelect: (id: string) => void,
    onEdit: (id: string) => void,
    onDelete: (id: string) => void
}

function SignatureList({
    signatures,
    selectedSignatureId,
    onSelect,
    onEdit,
    onDelete }: SignatureListProps) {
    return (
        <>
            {signatures.length > 0 ?
                signatures.map((signature, index) => (
                    <tr className={`blue-line-aft ${signature.id === selectedSignatureId ? "active" : ""}`}
                        key={signature.id}
                        onClick={(e) => {
                            if (!(e.target instanceof HTMLAnchorElement) &&
                                !(e.target instanceof HTMLImageElement) &&
                                !(e.target instanceof SVGElement)) {
                                onSelect(signature.id);
                            }
                        }}>
                        <td>{index + 1}</td>
                        <td>{signature.name}</td>
                        <td>
                            {signature.isDefault ?
                                <div className="Default-label">
                                    <span className="Default-label-dot"></span>
                                    <span>Default</span>
                                </div> : ''}
                        </td>
                        <td>
                            <div className="d-flex align-items-center justify-content-end">

                                <a
                                    onClick={() => onEdit(signature.id)}
                                    className="hover-link d-flex align-items-center me-2"
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
                                    onClick={() => onDelete(signature.id)}
                                    className="hover-link d-flex align-items-center"
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
                ))
                :
                <tr>
                    <td colSpan={4} className="text-center">
                        No signatures found
                    </td>
                </tr>
            }
        </>
    )
}

export default SignatureList;