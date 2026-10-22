import React, {useEffect} from "react";

export default function Overview({ children, mt }) {
    useEffect(() => {
        Main();
    }, [])

    return (
        <>
            <div className={`container flex-grow-1 mb-4 mt-${mt}`}>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-body">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}