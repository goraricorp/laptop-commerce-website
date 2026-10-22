import { Modal, Button } from 'react-bootstrap';
import { getNoticeIcon } from "../../../utils/iconHandler.jsx";

export const NotifyModal = ({ title, message, type, show, onHide }) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            aria-labelledby="contained-modal-title-vcenter"
            // centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter" className="d-flex align-items-center">
                    <div className="card-icon me-2">
                        <div className="avatar">
                            <div className={`avatar-initial rounded bg-label-${type}`}>
                                <i className={`bx ${getNoticeIcon(type)} bx-sm`}></i>
                            </div>
                        </div>
                    </div>
                    <span>{title}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{message}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant={type} onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};
