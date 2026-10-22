import { Button, Modal } from "react-bootstrap";
import { getNoticeIcon } from "../../../utils/iconHandler.jsx";

export const ConfirmModal = ({
    show,
    onHide,
    onSave,
    title="Save Changes",
    message="Are you sure you want to save changes?",
    type="secondary",
    button="Save"
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            aria-labelledby="contained-modal-title-vcenter"
            // centered
        >
            <Modal.Header closeButton>
                <div className="card-icon me-2">
                    <div className="avatar">
                        <div className={`avatar-initial rounded bg-label-${type}`}>
                            <i className={`bx ${getNoticeIcon(type)} bx-sm`}></i>
                        </div>
                    </div>
                </div>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant={type} onClick={onSave}>{button}</Button>
            </Modal.Footer>
        </Modal>
    );
}