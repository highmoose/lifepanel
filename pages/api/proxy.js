import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";

// Add stealth and recaptcha plugins to Puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(
    RecaptchaPlugin({
        provider: {
            id: "2captcha", // CAPTCHA solving provider (you can use '2captcha' or similar)
            token: "your-2captcha-api-key", // Replace with your API key from 2captcha or any solving service
        },
        visualFeedback: true, // Shows a visual indication in the browser that a CAPTCHA was solved
    })
);

export default async function handler(req, res) {
    const url = req.query.url; // Get the target URL from query params

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // Launch Puppeteer browser with stealth mode and CAPTCHA solver enabled
        const browser = await puppeteer.launch({
            headless: false, // Run in headful mode to avoid detection
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        // Navigate to the target URL
        await page.goto(url, { waitUntil: "networkidle2" });

        // Solve reCAPTCHA (if detected)
        const { captchas, solutions, solved } = await page.solveRecaptchas();
        console.log("CAPTCHAS SOLVED:", solved);

        // Optionally wait for a specific element that indicates full content load
        await page.waitForSelector("body");

        // Get the HTML content of the page
        const content = await page.content();

        // Close the browser instance
        await browser.close();

        await page.setRequestInterception(true);
        page.on("request", (request) => {
            if (request.url().includes("cdn-cgi")) {
                console.log("Allowing Cloudflare challenge:", request.url());
                request.continue();
            } else {
                request.continue();
            }
        });

        // Send the HTML content as the response
        res.setHeader("Content-Type", "text/html");
        return res.status(200).send(content);
    } catch (error) {
        console.error("Error fetching the page:", error);
        return res.status(500).json({ error: "Failed to fetch page" });
    }
}
