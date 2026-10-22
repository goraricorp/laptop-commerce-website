import React from "react";
import { Link } from "react-router-dom";
import {
    Container, DropdownButton, Dropdown, Stack, Navbar, Form, Button
} from 'react-bootstrap';
import { TransitionButton } from "../components/button/TransitionButton.jsx";

export default function Transitionbar() {
    const classifications = [
        { category: "Laptop", box: "bx-laptop", items: ['#a', '#b', '#c',] },
        { category: "Mouse", box: "bx-mouse-alt", items: ['#action1', '#action1', '#action1',] },
        { category: "Keyboard", box: "bxs-keyboard", items: ['#action1', '#action1', '#action1',] },
    ]

    const cates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

    return (
        <>
            <nav
                className="light bg-body-tertiary layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme mb-4 z-1"
                id="layout-navbar">

                <div className="navbar-nav-left d-flex align-items-center" id="navbar-collapse">
                    <ul className="navbar-nav flex-row align-items-center ms-auto">
                        {classifications.map((cate, index) => (
                            <TransitionButton icon={cate.box} href="#" key={index}/>
                        ))}
                    </ul>
                </div>

                <div className="d-none navbar-nav-left d-flex align-items-center" id="navbar-collapse">
                    <ul className="navbar-nav flex-row align-items-center ms-auto">
                        {cates.map((cate, index) => (
                            <div className="d-flex align-items-center" key={index}>
                                <div className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                    <div className="avatar"><img
                                        src={`/assets/img/categories/product-${cate}.png`}
                                        alt="Product-8"
                                        className="rounded" /></div>
                                </div>
                                <div className="d-flex flex-column justify-content-center"><span
                                    className="text-heading text-wrap fw-medium"></span><span
                                    className="text-truncate mb-0 d-none d-sm-block"><small></small></span>
                                </div>
                            </div>
                        ))}
                    </ul>
                </div>

                {/*<div className="container p-0 d-none">*/}
                {/*    <div className="demo-inline-spacing">*/}

                {/*    </div>*/}
                {/*    <Stack direction="horizontal" gap={3}>*/}
                {/*        {classifications.map((cate, index) => (*/}
                {/*            <DropdownButton*/}
                {/*                key={index}*/}
                {/*                id="dropdown-basic-button"*/}
                {/*                title={<><i className={`${cate.box} bx me-2`}></i><span>{cate.category}</span></>}*/}
                {/*                variant="outline-primary"*/}
                {/*            >*/}
                {/*                {cate.items.map((item, index) => (*/}
                {/*                    <Dropdown.Item as="a" href="#action1" key={index}>{item}</Dropdown.Item>*/}
                {/*                ))}*/}
                {/*            </DropdownButton>*/}
                {/*        ))}*/}
                {/*    </Stack>*/}
                {/*    <div className="demo-inline-spacing">*/}
                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-primary dropdown-toggle hide-arrow"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Hidden arrow*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <div className="demo-inline-spacing">*/}
                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-primary dropdown-toggle"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Primary*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item disabled" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}

                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-secondary dropdown-toggle"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Secondary*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}

                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-success dropdown-toggle"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Success*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}

                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-danger dropdown-toggle"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Danger*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}

                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-warning dropdown-toggle"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Warning*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}

                {/*        <div className="btn-group">*/}
                {/*            <button aria-label='Click me'*/}
                {/*                    type="button"*/}
                {/*                    className="btn btn-info dropdown-toggle"*/}
                {/*                    data-bs-toggle="dropdown"*/}
                {/*                    aria-expanded="false">*/}
                {/*                Info*/}
                {/*            </button>*/}
                {/*            <ul className="dropdown-menu">*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                {/*                <li>*/}
                {/*                    <hr className="dropdown-divider" />*/}
                {/*                </li>*/}
                {/*                <li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                {/*            </ul>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </nav>
        </>
    )
}