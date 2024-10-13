import IframeComponent from "./../../../components/proxy/iFrameComponent";
export default function Home() {
    const targetUrl = "https://www.chatgpt.com/"; // The target URL

    return (
        <div className="bg-white">
            <h1>Proxied ChatGPT Website</h1>
            <IframeComponent targetUrl={targetUrl} />
        </div>
    );
}
