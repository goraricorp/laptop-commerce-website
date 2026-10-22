const Statusbar = () => {
    const { status } = useStatus();
    return (
        <div className="statusbar">
            <p>{status}</p>
        </div>
    );
}

export default Statusbar;