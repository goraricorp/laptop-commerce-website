import { useState, useCallback } from "react";

// Custom hook để refresh lại thành phần
export const useRefresh = () => {
    const [refreshFlag, setRefreshFlag] = useState(false);

    const refresh = useCallback(() => {
        setRefreshFlag((prev) => !prev);
    }, []);

    return { refreshFlag, refresh };
};
