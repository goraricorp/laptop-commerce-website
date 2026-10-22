import React, {useEffect, useState} from "react";
import VoucherItem from "../../components/voucher/VoucherItem.jsx";
import {Button} from "react-bootstrap";
import axios from "axios";

export const VoucherWallet = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [reloadAddressManagement, setReloadAddressManagement] = useState(0);
    const [reloadTrigger, setReloadTrigger] = useState(false);

    const handleReload = () => {
        setReloadTrigger(!reloadTrigger);
    };

    useEffect(() => {
        // const fetchAddresses = async () => {
        //     try {
        //         // setLoading(true);
        //         const token = localStorage.getItem('token');
        //         const response = await axios.get('http://localhost:5172/address/list', {
        //             headers: {
        //                 Authorization: `Bearer ${token}`
        //             }
        //         });
        //         setAddresses(response.data);
        //     } catch (error) {
        //         console.error('Lỗi khi lấy dữ liệu:', error);
        //     } finally {
        //         // setLoading(false);
        //     }
        // };

        // fetchAddresses();
    }, []);  // Khi reloadTrigger thay đổi, useEffect sẽ gọi lại API //

    return (
        <>
            <div className="row">
                <div className="col-12 mb-4">
                    <div
                        className="card px-3 py-3 light bg-body-tertiary align-items-center bg-navbar-theme">
                        {/*<AddressList key={reloadTrigger} onReload={handleReload}/>*/}
                        <div className="container d-flex ps-2 p-0 align-items-center">
                            <h5 className="m-0">Voucher Wallet</h5>
                            <Button disabled variant="light" className="ms-auto">
                                <i className='bx bx-plus text-white me-2'></i>
                                <span></span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/*<div className="row g-6">*/}
            {/*    <div className="col col-md-6 col-sm-12"> /!* col col-xl-3 col-lg-4 col-md-6 col-sm-12 *!/*/}
            {/*        <VoucherItem/>*/}
            {/*    </div>*/}
            {/*    <div className="col-md"> /!* col col-xl-3 col-lg-4 col-md-6 col-sm-12 *!/*/}
            {/*        <VoucherItem/>*/}
            {/*    </div>*/}
            {/*</div>*/}
            {/*<div className="row mb-4">*/}
            {/*    <VoucherCard left={1} right={2}/>*/}
            {/*</div>*/}
            {[[1, 2], [3, 4], [5, 7], [11, 12], [13, 17], [18, 19], [20, 21], [22, 23], [24, 25]].map((item, index) => (
                <div className="row mb-4" key={index}>
                    <VoucherCard left={item[0]} right={item[1]}/>
                </div>
            ))}
            <div className="row mb-4">
                <div className="col-md">
                    <VoucherItem/>
                </div>
                <div className="col-md">
                    <VoucherItem/>
                </div>
            </div>
        </>
    )
}

const VoucherCard = ({ left, right}) => {
    return (
        <>
            <div className="col-md">
                <div className="card">
                    <div className="row g-0">
                        <div className="col-md-4">
                            <img aria-label='card image' className="card-img card-img-left" src={`/assets/img/elements/${left}.png`} alt="Card image" />
                        </div>
                        <div className="col-md-8">
                            <div className="card-body">
                                <h5 className="card-title">Card title</h5>
                                <p className="card-text">
                                    Japtor
                                </p>
                                <p className="card-text"><small className="text-muted">Last updated 3 mins ago</small></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md">
                <div className="card">
                    <div className="row g-0">
                        <div className="col-md-8">
                            <div className="card-body">
                                <h5 className="card-title">Card title</h5>
                                <p className="card-text">
                                    Goraria
                                </p>
                                <p className="card-text"><small className="text-muted">Last updated 3 mins ago</small></p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <img aria-label='card image' className="card-img card-img-right" src={`/assets/img/elements/${right}.png`} alt="Card image" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}