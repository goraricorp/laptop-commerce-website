import React, {useEffect, useState} from "react";
import axios from "axios";
import { Button, Col, Form, InputGroup, Modal } from "react-bootstrap";
import { ConfirmModal } from "../notice/ConfirmModal.jsx";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function RatingForm({ rate, prod, show, onHide, onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        score: 0,
        comment: '',
        product_name: '',
        rating_date: ''
    });
    const [error, setError] = useState(null);
    const [evaluate, setEvaluate] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const token = localStorage.getItem('token');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleInvalid = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            setValidated(true);
        } else {
            setShowConfirmModal(true);
        }
    };

    const handleStarClick = (index) => {
        setFormData(prevData => ({ ...prevData, score: index + 1 }));
    };

    const handleConfirmSave = async () => {
        try {
            const endpoint = rate
                ? `/products/change-rating/${rate.idrating}`
                : '/products/create-rating';
            const method = rate ? 'put' : 'post';

            // console.log(formData);

            const response = await apiHandler[method](endpoint, {...formData, idproduct: prod.idproduct}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                setShowConfirmModal(false);
                onHide();
                onReload();
            }
        } catch (err) {
            setError(err.response ? err.response.data.message : 'Failed to save rating');
        } finally {
            setShowConfirmModal(false)
        }
    };

    const handleDelete = async () => {
        try {
            await apiHandler.delete(
                `/products/remove-rating/${rate.idrating}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShowConfirmDelete(false);
            onHide();
            onReload();
        } catch (err) {
            setError(err.response ? err.response.data.message : 'Failed to delete rating');
        }
    };

    useEffect(() => {
        // Cập nhật formData khi `rate` thay đổi
        if (rate) {
            setFormData({
                score: rate.score || 0,
                comment: rate.comment || '',
                // product_name: prod.product_name || '',
                product_name: prod.name || '',
                rating_date: rate.rating_date || '',
            });
        } else {
            setFormData({
                score: 0,
                comment: '',
                // product_name: prod.product_name || '',
                product_name: prod.name || '',
                rating_date: '',
            });
        }
        onReload
    }, [rate, prod, show]);

    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header>
                    <Modal.Title id="contained-modal-title-vcenter">
                        <h5>Evaluate</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleInvalid}>
                        <div className="row mb-3">
                            <div className="d-flex align-items-start align-items-sm-center gap-4 rounded-2 col-lg-8 col-md-12 col-sm-12 mb-3">
                                <div className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                    <img
                                        src={`${prod.image}`}
                                        alt="product"
                                        className="d-block rounded"
                                        height="100"
                                        width="100"
                                        aria-label="Product image"
                                    />
                                </div>
                                <div className="d-flex flex-column">
                                    <span className="fw-medium text-nowrap text-heading">
                                        {`${prod.brand} ${prod.name}`}
                                    </span>
                                    <small>Professional</small>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-12 col-sm-12">
                                <label>Score</label>
                                <div className="d-flex">
                                    {[...Array(5)].map((_, index) => (
                                        <i
                                            key={index}
                                            className={`bx bxs-star bx-sm ${formData.score > index ? 'text-warning' : ''} cursor-pointer me-2`}
                                            onClick={() => handleStarClick(index)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <Form.Group as={Col} controlId="comment">
                                <Form.Label>Comment</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text>
                                        <i className='bx bx-comment'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        as="textarea"
                                        name="comment"
                                        value={formData.comment}
                                        onChange={handleChange}
                                        rows={3}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your comment.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </div>

                        <hr/>
                        {/*{error && <p className="text-danger">{error}</p>}*/}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onHide} variant="secondary" className="me-auto">
                        <i className='bx bx-x me-2'></i>
                        <span>Close</span>
                    </Button>
                    {rate ?
                        <>
                            <Button onClick={() => setShowConfirmDelete(true)} variant="danger" className="me-3">
                                <i className='bx bx-trash me-2'></i>
                                <span>Remove Evaluate</span>
                            </Button>
                            <Button onClick={handleInvalid} variant="info">
                                <i className='bx bx-check me-2'></i>
                                <span>Change Evaluate</span>
                            </Button>
                        </>
                        :
                        <>
                            <Button type="submit" variant="success" onClick={handleInvalid}>
                                <i className='bx bx-plus me-2'></i>
                                <span>Evaluate</span>
                            </Button>
                        </>
                    }
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                type="info"
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onSave={handleConfirmSave}
            />
            <ConfirmModal
                title="Delete Rating"
                type="danger"
                button="Delete"
                show={showConfirmDelete}
                onHide={() => setShowConfirmDelete(false)}
                onSave={handleDelete}
            />
        </>
    );
};