import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Copyright from './Copyright.jsx';
import getGreetingMessage from "../utils/greetingHandler.jsx";

const menu = [
    {
        "header": "",
        "items": [
            {
                "text": "Dashboard",
                "icon": "bx bx-home",
                "available": true,
                "link": "/admin"
            },
            {
                "text": "Layouts",
                "icon": "bx bx-layout",
                "available": true,
                "link": "/admin/ui",
                "submenu": [
                    {
                        "text": "Without menu",
                        "available": true,
                        "link": "/admin/layout/without-menu"
                    },
                    {
                        "text": "Without navbar",
                        "available": true,
                        "link": "/admin/layout/without-navbar"
                    },
                    {
                        "text": "Container",
                        "available": true,
                        "link": "/admin/layout/container"
                    },
                    {
                        "text": "Fluid",
                        "available": true,
                        "link": "/admin/layout/fluid"
                    },
                    {
                        "text": "Blank",
                        "available": true,
                        "link": "/admin/layout/blank"
                    }
                ]
            }
        ]
    },
    {
        "header": "MANAGEMENTS",
        "items": [
            {
                "text": "Account Setting",
                "icon": "bx bx-user",
                "available": true,
                "link": "/admin/profile"
            },
            {
                "text": "User Management",
                "icon": "bx bx-layout",
                "available": true,
                "link": "/admin/users"
            },
            {
                "text": "Category",
                "icon": "bx bx-category",
                "available": true,
                "link": "/admin/categories"
            },
            {
                "text": "Product",
                "icon": "bx bx-layer",
                "available": true,
                "link": "/admin/product",
                "submenu": [
                    {
                        "text": "Name",
                        "available": true,
                        "link": "/admin/product/name"
                    },
                    // {
                    //     "text": "Accessory",
                    //     "available": true,
                    //     "link": "/admin/product/accessory"
                    // },
                    {
                        "text": "Configuration",
                        "available": true,
                        "link": "/admin/product/configurarion"
                    },
                    {
                        "text": "Color",
                        "available": true,
                        "link": "/admin/product/color"
                    },
                    {
                        "text": "Description",
                        "available": true,
                        "link": "/admin/product/description"
                    }
                ]
            },
            {
                "text": "Voucher",
                "icon": "bx bxs-discount",
                "available": true,
                "link": "/admin/voucher"
            },
            // {
            //     "text": "Tables",
            //     "icon": "bx bx-table",
            //     "available": true,
            //     "link": "/admin/tables"
            // }
        ]
    },
    {
        "header": "AUTHORS",
        "items": [
            {
                "text": "Author",
                "icon": "bx bxl-git",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "Japtor",
                        "available": true,
                        "link": "https://github.com/goraria"
                    },
                    {
                        "text": "Payhd",
                        "available": true,
                        "link": "https://github.com/pa106"
                    },
                    {
                        "text": "Locst",
                        "available": true,
                        "link": "https://github.com/LocPhamn"
                    },
                    {
                        "text": "Meifang",
                        "available": true,
                        "link": "https://github.com/maiphuong22103"
                    },
                    {
                        "text": "Zamcha",
                        "available": true,
                        "link": "https://github.com/zamchar"
                    },
                    {
                        "text": "Ichibulup",
                        "available": true,
                        "link": "https://github.com/ichibulup"
                    },
                    {
                        "text": "Goraria",
                        "available": true,
                        "link": "https://github.com/goraria"
                    },
                    {
                        "text": "Schweitzenburg",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "Braunschweig",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Branches",
                "icon": "bx bx-git-branch",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "master",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "main",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "japtor",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "payhd",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "locst",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "meifang",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "zamcha",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "ichibulup",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "goraria",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Commit",
                "icon": "bx bx-git-commit",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "main",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "japtor",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "payhd",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "locst",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "meifang",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Merge",
                "icon": "bx bx-git-merge",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "master",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Compare",
                "icon": "bx bx-git-compare",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "master",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Pull Request",
                "icon": "bx bx-git-pull-request",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "master",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Repo Forked",
                "icon": "bx bx-git-repo-forked",
                "available": true,
                "link": "#",
                "submenu": [
                    {
                        "text": "master",
                        "available": true,
                        "link": "#"
                    },
                    {
                        "text": "main",
                        "available": true,
                        "link": "#"
                    }
                ]
            },
            {
                "text": "Support",
                "icon": "bx bx-support",
                "available": true,
                "link": "#"
            },
            {
                "text": "Document",
                "icon": "bx bx-file",
                "available": true,
                "link": "#"
            }
        ]
    }
]

export default function Layout({ children }) {
    useEffect(() => {
        Main();
    }, [])

    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-container">
                <Sidebar menu={menu} source={"/"} />
                <div className="layout-page">
                    <Navbar>
                        {getGreetingMessage('from Bill')}
                    </Navbar>
                    <div className="content-wrapper">
                        <div className="container-xxl flex-grow-1 container-p-y">
                            {children}
                        </div>
                        <Copyright />
                    </div>
                </div>
                <div className="layout-overlay layout-menu-toggle"></div>
            </div>
        </div>
    );
};
