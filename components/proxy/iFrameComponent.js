const IframeComponent = ({ targetUrl }) => {
    return (
        <div className="w-full h-screen">
            <iframe
                src={`api/proxy?url=${encodeURIComponent(targetUrl)}`}
                title="Proxied Content"
                className="w-full h-full border-none"
            />
        </div>
    );
};

export default IframeComponent;
