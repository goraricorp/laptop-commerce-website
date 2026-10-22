import React, { useEffect, useState } from 'react';
import { Button, Col, Row, Toast } from "react-bootstrap";


export default function ToastDemo() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Toast();
    },[])

    return (
        <Row>
            <Col xs={6}>
                <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
                    <div className="toast-header">
                        {/*<img*/}
                        {/*    src="holder.js/20x20?text=%20"*/}
                        {/*    className="rounded me-2"*/}
                        {/*    alt=""*/}
                        {/*/>*/}
                        <strong className="me-auto">Bootstrap</strong>
                        <small>11 mins ago</small>
                    </div>
                    <div className="toast-body">Woohoo, you're reading this text in a Toast!</div>
                </Toast>
            </Col>
            <Col xs={6}>
                <Button onClick={() => setShow(true)}>Show Toast</Button>
            </Col>
        </Row>
    );
}