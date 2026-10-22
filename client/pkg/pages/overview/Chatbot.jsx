import React, {useEffect, useState} from "react";
import usePerfectScrollbar from "../../hooks/usePerfectScrollbar.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import axios from "axios";
import {Button} from "react-bootstrap";
import log from "eslint-plugin-react/lib/util/log.js";

const ChatbotMessage = ({chat}) => {
    usePerfectScrollbar("chat-bot")

    return (
        <>
            <li className="chat-message">
                <div className="d-flex overflow-hidden">
                    <div className="user-avatar flex-shrink-0 me-3">
                        <div className="avatar avatar-sm avatar-online">
                            <img
                                src={chat.user.avatar}
                                // src="/assets/img/avatars/8.png"
                                className="h-auto rounded-circle"
                                alt="avatar"
                                aria-label="Avatar Image"
                            />
                        </div>
                    </div>
                    <div className="chat-message-wrapper flex-grow-1">
                        <div className="chat-message-text bg-white">
                            {chat.message.split("\n").map((bot_message, index) => (
                                <p key={index} className="mb-0">{bot_message}</p>
                            ))}
                            {/*<p className="mb-0">{chat.message}</p>*/}
                        </div>
                        <div className="text-body-secondary mt-1">
                            <small>{chat.time}</small>
                        </div>
                    </div>
                </div>
            </li>
        </>
    )
}

const ChatbotUserMessage = ({chat}) => {
    usePerfectScrollbar("chat-bot")

    return (
        <>
            <li className="chat-message chat-message-right">
                <div className="d-flex overflow-hidden">
                    <div className="chat-message-wrapper flex-grow-1">
                        <div className="chat-message-text">
                            <p className="mb-0">{chat.message}</p>
                        </div>
                        <div className="text-end text-body-secondary mt-1">
                            {/*<i className="icon-base bx bx-check-double icon-16px text-success me-1"></i>*/}
                            <small>{chat.time}</small>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ms-3">
                        <div className="avatar avatar-sm avatar-online">
                            <img
                                src={chat.user.avatar}
                                // src="/assets/img/avatars/1.png"
                                className="h-auto rounded-circle"
                                alt="avatar"
                                aria-label="Avatar Image"
                            />
                        </div>
                    </div>
                </div>
            </li>
        </>
    )
}


export default function Chatbot() {
    const dataDemo = [
        {
            id: 1,
            type: "bot",
            user: {
                idaccount: 0,
                username: "chatbot",
                avatar: "/assets/img/avatars/8.png",
                firstname: "Bill",
                lastname: "Cipher"
            },
            message: "How can we help? here for you! 😄",
            time: "10:00 AM",
        },
        {
            id: 2,
            type: "user",
            user: {
                idaccount: 1,
                username: "username",
                avatar: "/assets/img/avatars/2.png",
                firstname: "Japtor",
                lastname: "Gorthenburg",
            },
            message: "Yeah, I am looking for the best admin template. Could you please help me to find it out? 🤔",
            time: "10:02 AM",
        },
        {
            id: 3,
            type: "bot",
            user: {
                idaccount: 0,
                username: "chatbot",
                avatar: "/assets/img/avatars/8.png",
                firstname: "Bill",
                lastname: "Cipher"
            },
            message: "Hmm, You can also contact us via email at https://github.com/goraria",
            time: "10:03 AM",
        },
        {
            id: 4,
            type: "user",
            user: {
                idaccount: 1,
                username: "username",
                avatar: "/assets/img/avatars/2.png",
                firstname: "Japtor",
                lastname: "Gorthenburg",
            },
            message: "Something went wrong!",
            time: "10:04 AM",
        },
        {
            id: 1,
            type: "bot",
            user: {
                idaccount: 0,
                username: "chatbot",
                avatar: "/assets/img/avatars/8.png",
                firstname: "Bill",
                lastname: "Cipher"
            },
            message: "How can we help? here for you! 😄",
            time: "10:00 AM",
        },
        {
            id: 2,
            type: "user",
            user: {
                idaccount: 1,
                username: "username",
                avatar: "/assets/img/avatars/2.png",
                firstname: "Japtor",
                lastname: "Gorthenburg",
            },
            message: "Yeah, I am looking for the best admin template. Could you please help me to find it out? 🤔",
            time: "10:02 AM",
        },
        {
            id: 3,
            type: "bot",
            user: {
                idaccount: 0,
                username: "chatbot",
                avatar: "/assets/img/avatars/8.png",
                firstname: "Bill",
                lastname: "Cipher"
            },
            message: "Hmm, You can also contact us via email at https://github.com/goraria",
            time: "10:03 AM",
        },
        {
            id: 4,
            type: "user",
            user: {
                idaccount: 1,
                username: "username",
                avatar: "/assets/img/avatars/2.png",
                firstname: "Japtor",
                lastname: "Gorthenburg",
            },
            message: "Something went wrong!",
            time: "10:04 AM",
        },
        {
            id: 1,
            type: "bot",
            user: {
                idaccount: 0,
                username: "chatbot",
                avatar: "/assets/img/avatars/8.png",
                firstname: "Bill",
                lastname: "Cipher"
            },
            message: "How can we help? here for you! 😄",
            time: "10:00 AM",
        },
        {
            idchatbot: 2,
            type: "user",
            user: {
                idaccount: 1,
                username: "username",
                avatar: "/assets/img/avatars/2.png",
                firstname: "Japtor",
                lastname: "Gorthenburg",
            },
            message: "Yeah, I am looking for the best admin template. Could you please help me to find it out? 🤔",
            time: "10:02 AM",
        },
        {
            idchatbot: 3,
            type: "bot",
            user: {
                idaccount: 0,
                username: "chatbot",
                avatar: "/assets/img/avatars/8.png",
                firstname: "Bill",
                lastname: "Cipher"
            },
            message: "Hmm, You can also contact us via email at https://github.com/goraria",
            time: "10:03 AM",
        },
        {
            id: 4,
            type: "user",
            user: {
                idaccount: 1,
                username: "username",
                avatar: "/assets/img/avatars/2.png",
                firstname: "Japtor",
                lastname: "Gorthenburg",
            },
            message: "Something went wrong!\nPro",
            time: "10:04 AM",
        },
    ]

    usePerfectScrollbar("chat-bot")
    const [rasaResponse, setRasaResponse] = useState("");
    const [message, setMessage] = useState("");
    const [data, setData] = useState([]);

    const token = localStorage.getItem("token");

    const loadConversationHistory = async () => {
        try {
            const response = await apiHandler.get('/chatbot/get-history', {
                headers: {Authorization: `Bearer ${token}`},
            })
            setData(response.data);
        } catch (e) {
            console.log(e)
        }
    }

    const refeshSendMessage = async () => {
        try {
            const response = await apiHandler.post('/chatbot/send-message', {message: "clear"}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // "Content-Type": "application/json"
                },
            })
            // console.log(response.data)
            setRasaResponse(response.data);
            // console.log("Chatbot reply:", data);

            console.log(response.data);
            // console.log(response.data.split("\n"));
            await loadConversationHistory();
        } catch (e) {
        }
        setMessage(""); // Xóa input sau khi gửi
    };

    const handleSendMessage = async () => {
        if (message.trim() !== "") {
            try {
                const response = await apiHandler.post('/chatbot/send-message', {message: message}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // "Content-Type": "application/json"
                    },
                })
                // console.log(response.data)
                setRasaResponse(response.data);
                // console.log("Chatbot reply:", data);

                console.log(response.data);
                // console.log(response.data.split("\n"));
                await loadConversationHistory();
            } catch (e) {
            }
            setMessage(""); // Xóa input sau khi gửi
        } else {
            setMessage("")
        }
    };


    useEffect(() => {
        loadConversationHistory();
    }, [])

    usePerfectScrollbar("chat-bot")

    return (
        <>
            <div className="content-wrapper mb-4">
                <div className="container-xxl flex-grow-1">
                    <div className="app-chat card overflow-hidden">
                        <div className="row g-0">
                            <div className="col app-chat-history d-block" id="app-chat-history">
                                <div className="chat-history-wrapper">
                                    <div className="chat-history-header border-bottom">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex overflow-hidden align-items-center">
                                                <i className="icon-base bx bx-menu icon-lg cursor-pointer d-lg-none d-block me-3"
                                                   data-bs-toggle="sidebar" data-overlay=""
                                                   data-target="#app-chat-contacts"></i>
                                                <div className="flex-shrink-0 avatar avatar-online">
                                                    <img
                                                        src="/assets/img/avatars/8.png"
                                                        className="h-auto rounded-circle"
                                                        alt="avatar"
                                                        aria-label="Avatar Image"
                                                    />
                                                </div>
                                                <div className="chat-contact-info flex-grow-1 ms-3">
                                                    <h6 className="m-0 fw-normal">Japtor Gorthenburg</h6>
                                                    <small className="user-status text-body">Administrator</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span
                                                    className="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill">
                                                    <i className="bx bx-phone bx-sm"></i>
                                                </span>
                                                <span
                                                    className="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill">
                                                    <i className="bx bx-video bx-sm"></i>
                                                </span>
                                                <span
                                                    className="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill">
                                                    <i className="bx bx-search bx-sm"></i>
                                                </span>
                                                <div className="dropdown">
                                                    <button
                                                        className="btn btn-icon btn-text-secondary text-secondary rounded-pill dropdown-toggle hide-arrow"
                                                        data-bs-toggle="dropdown" aria-expanded="false"
                                                        id="chat-header-actions"><i
                                                        className="bx bx-dots-vertical-rounded bx-sm"></i>
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-end"
                                                         aria-labelledby="chat-header-actions">
                                                        <a className="dropdown-item">
                                                            View Contact</a>
                                                        <a className="dropdown-item">
                                                            Mute Notifications</a>
                                                        <a className="dropdown-item">
                                                            Block Contact</a>
                                                        <a className="dropdown-item">
                                                            Clear Chat</a>
                                                        <a className="dropdown-item">
                                                            Report</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="chat-bot" className="chat-history-body ps ps--active-y">
                                        <ul className="list-unstyled chat-history">
                                            {dataDemo.length > 0 && data.map((chat, index) => (
                                                chat.type === "bot"
                                                    ? <ChatbotMessage chat={chat} key={index}/>
                                                    : <ChatbotUserMessage chat={chat} key={index}/>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="chat-history-footer shadow-xs bg-white">
                                        <form
                                            className="form-send-message d-flex justify-content-between align-items-center ">
                                            <input
                                                className="form-control message-input border-0 me-3 shadow-none"
                                                placeholder="Type your message here..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                            />
                                            <div className="message-actions d-flex align-items-center">
                                                <span
                                                    className="btn btn-text-secondary btn-icon rounded-pill cursor-pointer">
                                                    <i className="bx bx-microphone bx-sm text-heading"></i>
                                                </span>
                                                <span
                                                    className="btn btn-text-secondary btn-icon rounded-pill cursor-pointer mx-1">
                                                    <i className="bx bx-paperclip bx-sm text-heading"></i>
                                                </span>
                                                {/*<label htmlFor="attach-doc" className="form-label mb-0">*/}
                                                {/*    <span className="btn btn-text-secondary btn-icon rounded-pill cursor-pointer mx-1">*/}
                                                {/*        <i className="bx bx-paperclip bx-sm text-heading"></i>*/}
                                                {/*    </span>*/}
                                                {/*    <input type="file" id="attach-doc" hidden=""/>*/}
                                                {/*</label>*/}
                                                <Button className="btn btn-primary d-flex send-msg-btn me-2"
                                                        onClick={refeshSendMessage}
                                                >
                                                    {/*<span className="align-middle d-md-inline-block d-none"></span>*/}
                                                    <i className="bx bx-refresh ms-0"></i>
                                                </Button>
                                                <Button className="btn btn-primary d-flex send-msg-btn"
                                                        onClick={handleSendMessage}
                                                >
                                                    <span className="align-middle d-md-inline-block d-none">Send</span>
                                                    <i className="bx bxs-paper-plane ms-md-2 ms-0"></i>
                                                </Button>


                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="app-overlay"></div>
                        </div>
                    </div>
                </div>
                <div className="content-backdrop fade"></div>
            </div>
        </>
    )
}

function ChatbotDefault() {
    return (
        <>
            <div className="content-wrapper mb-4">
                <div className="container-xxl flex-grow-1">

                    <div className="app-chat card overflow-hidden">
                        <div className="row g-0">

                            {/*<div*/}
                            {/*    className="col app-chat-conversation d-none align-items-center justify-content-center flex-column"*/}
                            {/*    id="app-chat-conversation">*/}
                            {/*    <div className="bg-label-primary p-8 rounded-circle">*/}
                            {/*        <i className="icon-base bx bx-message-alt-detail icon-48px"></i>*/}
                            {/*    </div>*/}
                            {/*    <p className="my-4">Select a contact to start a conversation.</p>*/}
                            {/*    <button*/}
                            {/*        className="btn btn-primary app-chat-conversation-btn"*/}
                            {/*        id="app-chat-conversation-btn">Select Contact*/}
                            {/*    </button>*/}
                            {/*</div>*/}

                            <div className="col app-chat-history d-block" id="app-chat-history">
                                <div className="chat-history-wrapper">
                                    <div className="chat-history-header border-bottom">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex overflow-hidden align-items-center">
                                                <i className="icon-base bx bx-menu icon-lg cursor-pointer d-lg-none d-block me-3"
                                                   data-bs-toggle="sidebar" data-overlay=""
                                                   data-target="#app-chat-contacts"></i>
                                                <div className="flex-shrink-0 avatar avatar-online">
                                                    <img
                                                        src="/assets/img/avatars/8.png"
                                                        className="h-auto rounded-circle"
                                                        alt="avatar"
                                                        aria-label="Avatar Image"
                                                    />
                                                </div>
                                                <div className="chat-contact-info flex-grow-1 ms-3">
                                                    <h6 className="m-0 fw-normal">Japtor Gorthenburg</h6>
                                                    <small className="user-status text-body">Administrator</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span
                                                    className="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill">
                                                    <i className="bx bx-phone bx-sm"></i>
                                                </span>
                                                <span
                                                    className="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill">
                                                    <i className="bx bx-video bx-sm"></i>
                                                </span>
                                                <span
                                                    className="btn btn-text-secondary text-secondary cursor-pointer d-sm-inline-flex d-none me-1 btn-icon rounded-pill">
                                                    <i className="bx bx-search bx-sm"></i>
                                                </span>
                                                <div className="dropdown">
                                                    <button
                                                        className="btn btn-icon btn-text-secondary text-secondary rounded-pill dropdown-toggle hide-arrow"
                                                        data-bs-toggle="dropdown" aria-expanded="false"
                                                        id="chat-header-actions"><i
                                                        className="bx bx-dots-vertical-rounded bx-sm"></i>
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-end"
                                                         aria-labelledby="chat-header-actions">
                                                        <a className="dropdown-item">
                                                            View Contact</a>
                                                        <a className="dropdown-item">
                                                            Mute Notifications</a>
                                                        <a className="dropdown-item">
                                                            Block Contact</a>
                                                        <a className="dropdown-item">
                                                            Clear Chat</a>
                                                        <a className="dropdown-item">
                                                            Report</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="chat-bot" className="chat-history-body ps ps--active-y">
                                        <ul className="list-unstyled chat-history">
                                            <li className="chat-message chat-message-right">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text">
                                                            <p className="mb-0">How can we help? here for you!
                                                                😄</p>
                                                        </div>
                                                        <div className="text-end text-body-secondary mt-1">
                                                            <i className="icon-base bx bx-check-double icon-16px text-success me-1"></i>
                                                            <small>10:00 AM</small>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 ms-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/1.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="user-avatar flex-shrink-0 me-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/8.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text bg-white">
                                                            <p className="mb-0">Hey John, I am looking for the best
                                                                admin template.</p>
                                                            <p className="mb-0">Could you please help me to find it out?
                                                                🤔</p>
                                                        </div>
                                                        <div className="chat-message-text bg-white mt-2">
                                                            <p className="mb-0">It should be Bootstrap 5 compatible.</p>
                                                        </div>
                                                        <div className="text-body-secondary mt-1">
                                                            <small>10:02 AM</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message chat-message-right">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text">
                                                            <p className="mb-0">
                                                                Sneat has all the components you&#39;ll ever need in a
                                                                app.
                                                            </p>
                                                        </div>
                                                        <div className="text-end text-body-secondary mt-1">
                                                            <i className="icon-base bx bx-check-double icon-16px text-success me-1"></i>
                                                            <small>10:03 AM</small>
                                                        </div>
                                                    </div>
                                                    <div className="user-avatar flex-shrink-0 ms-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/1.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="user-avatar flex-shrink-0 me-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/8.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text bg-white">
                                                            <p className="mb-0">Looks clean and fresh UI. 😃</p>
                                                        </div>
                                                        <div className="chat-message-text bg-white mt-2">
                                                            <p className="mb-0"> perfect for my next project.</p>
                                                        </div>
                                                        <div className="chat-message-text bg-white mt-2">
                                                            <p className="mb-0">How can I purchase it?</p>
                                                        </div>
                                                        <div className="text-body-secondary mt-1">
                                                            <small>10:05 AM</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message chat-message-right">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text">
                                                            <p className="mb-0">Thanks, you can purchase it.</p>
                                                        </div>
                                                        <div className="text-end text-body-secondary mt-1">
                                                            <i className="icon-base bx bx-check-double icon-16px text-success me-1"></i>
                                                            <small>10:06 AM</small>
                                                        </div>
                                                    </div>
                                                    <div className="user-avatar flex-shrink-0 ms-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/1.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="user-avatar flex-shrink-0 me-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/8.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text bg-white">
                                                            <p className="mb-0">I will purchase it for sure. 👍</p>
                                                        </div>
                                                        <div className="chat-message-text bg-white mt-2">
                                                            <p className="mb-0">Thanks.</p>
                                                        </div>
                                                        <div className="text-body-secondary mt-1">
                                                            <small>10:08 AM</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message chat-message-right">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text">
                                                            <p className="mb-0">Great, Feel free to get in touch.</p>
                                                        </div>
                                                        <div className="text-end text-body-secondary mt-1">
                                                            <i className="icon-base bx bx-check-double icon-16px text-success me-1"></i>
                                                            <small>10:10 AM</small>
                                                        </div>
                                                    </div>
                                                    <div className="user-avatar flex-shrink-0 ms-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/1.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="user-avatar flex-shrink-0 me-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/8.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="chat-message-wrapper flex-grow-1">
                                                        <div className="chat-message-text bg-white">
                                                            <p className="mb-0">Do you have design files for Cipher?</p>
                                                        </div>
                                                        <div className="text-body-secondary mt-1">
                                                            <small>10:15 AM</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="chat-message chat-message-right">
                                                <div className="d-flex overflow-hidden">
                                                    <div className="chat-message-wrapper flex-grow-1 w-50">
                                                        <div className="chat-message-text">
                                                            <p className="mb-0">Yes correct documentation file,
                                                                Design files are included with the template.</p>
                                                        </div>
                                                        <div className="text-end text-body-secondary mt-1">
                                                            <i className="icon-base bx bx-check-double icon-16px me-1"></i>
                                                            <small>10:15 AM</small>
                                                        </div>
                                                    </div>
                                                    <div className="user-avatar flex-shrink-0 ms-3">
                                                        <div className="avatar avatar-sm avatar-online">
                                                            <img
                                                                src="/assets/img/avatars/1.png"
                                                                className="h-auto rounded-circle"
                                                                alt="avatar"
                                                                aria-label="Avatar Image"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="chat-history-footer shadow-xs bg-white">
                                        <form
                                            className="form-send-message d-flex justify-content-between align-items-center ">
                                            <input className="form-control message-input border-0 me-3 shadow-none"
                                                   placeholder="Type your message here..."/>
                                            <div className="message-actions d-flex align-items-center">
                                                <span
                                                    className="btn btn-text-secondary btn-icon rounded-pill cursor-pointer">
                                                    <i className="bx bx-microphone bx-sm text-heading"></i>
                                                </span>
                                                <span
                                                    className="btn btn-text-secondary btn-icon rounded-pill cursor-pointer mx-1">
                                                    <i className="bx bx-paperclip bx-sm text-heading"></i>
                                                </span>
                                                {/*<label htmlFor="attach-doc" className="form-label mb-0">*/}
                                                {/*    <span className="btn btn-text-secondary btn-icon rounded-pill cursor-pointer mx-1">*/}
                                                {/*        <i className="bx bx-paperclip bx-sm text-heading"></i>*/}
                                                {/*    </span>*/}
                                                {/*    <input type="file" id="attach-doc" hidden=""/>*/}
                                                {/*</label>*/}
                                                <button className="btn btn-primary d-flex send-msg-btn">
                                                    <span className="align-middle d-md-inline-block d-none">Send</span>
                                                    <i className="bx bx-paper-plane ms-md-2 ms-0"></i>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="app-overlay"></div>
                        </div>
                    </div>
                </div>
                <div className="content-backdrop fade"></div>
            </div>
        </>
    )
}