import React, {Component, useState} from "react";
import {Container, Button, Form, Row, Col, Image, Card, InputGroup} from "react-bootstrap";
import AddressForm from "../modal/form/AddressForm.jsx";

const AddressItem = ({ item, onReload }) => {
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    // const { item } = props;

    const handleCardClick = (address) => {
        setSelectedAddress(address);
        setModalShow(true);
    };

    const handleModalClose = () => {
        setModalShow(false);
        setSelectedAddress(null);
    };

    return (
        <>
            <div className="card-header d-flex justify-content-between p-3 pb-0">
                <h5 className="card-title m-0 p-2">{item.type}</h5>
                <Button variant="warning" onClick={() => handleCardClick(item)}>
                    <i className='bx bxs-edit me-2'></i>
                    <span>Edit Address</span>
                </Button>
            </div>
            <div className="card-body p-3 pt-0">
                <p className="mb-0 p-2 pt-0">
                    {item.tower}
                    <br/>
                    {item.street}
                    <br/>
                    {item.district}
                    <br/>
                    {item.city}
                    <br/>
                    {item.state}
                    <br/>
                    {item.country}
                </p>
            </div>
            <AddressForm
                show={modalShow}
                // onHide={() => setModalShow(false)}
                onHide={handleModalClose}
                onReload={onReload}
                address={selectedAddress}
            />
        </>
    );
}

// class AddressItem extends Component {
//     constructor(props) {
//         super(props);
//         this.state = {};
//     }
//
//     render() {
//
//     }
// }

export default AddressItem;
