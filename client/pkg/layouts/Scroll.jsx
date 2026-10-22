import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Scroll() {
    // const { pathname } = useLocation();
    //
    // useEffect(() => {
    //     window.scrollTo(0, 0);
    // }, [pathname]);
    //
    // return null;
    const location = useLocation();

    useEffect(() => {
        window.history.scrollRestoration = "manual";
        window.scrollTo({ top: 0, behavior: "smooth" });
        // window.scrollTo(0, 0);
    }, [location]);

    return null;
}
