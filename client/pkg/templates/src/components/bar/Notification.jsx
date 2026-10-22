import React from "react";

const Notification = ({ notify, variant = "primary" }) => {
    return (
        <>
            <li className="list-group-item list-group-item-action dropdown-notifications-item">
                <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                            <span className={`avatar-initial rounded-circle bg-label-${variant}`}>
                                JG
                            </span>
                        </div>
                    </div>
                    <div className="flex-grow-1">
                        <h6 className="small mb-0">{notify.title}</h6>
                        <small className="mb-1 d-block text-body">
                            {notify.content}
                        </small>
                        <small className="text-muted">{notify.time}</small>
                    </div>
                    <div className="flex-shrink-0 dropdown-notifications-actions">
                        <a href="#" className="dropdown-notifications-read">
                            <span className="badge badge-dot"></span>
                        </a>
                        <a href="#" className="dropdown-notifications-archive">
                            <span className="bx bx-x"></span>
                        </a>
                    </div>
                </div>
            </li>
        </>
    )
}

export default Notification;