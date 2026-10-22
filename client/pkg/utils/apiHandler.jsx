import axios from "axios";

const apiHandler = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    // headers: {
    //     "Content-Type": "application/json",
    // },
    // `${import.meta.env.SERVER_URL}${import.meta.env.SERVER_PORT}`
    timeout: 10000,
});

export default apiHandler;