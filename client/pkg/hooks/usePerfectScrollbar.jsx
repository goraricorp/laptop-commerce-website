import { useEffect } from 'react';
import PerfectScrollbar from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

export default function usePerfectScrollbar(elementId) {
    useEffect(() => {
        const element = document.getElementById(elementId);
        if (element) {
            new PerfectScrollbar(element, {
                wheelPropagation: false,
            });
        }
    }, [elementId]);
};
