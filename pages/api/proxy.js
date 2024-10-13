import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Add stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

export default async function handler(req, res) {
    const url = req.query.url; // Get the target URL from query params

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // Launch Puppeteer browser with stealth mode enabled
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        // Navigate to the target URL
        await page.goto(url, {
            waitUntil: "networkidle2",
        });

        // Optionally wait for a specific element that indicates full content load
        await page.waitForSelector("body");

        // Get the HTML content of the page
        const content = await page.content();

        // Close the browser instance
        await browser.close();

        // Send the HTML content as the response
        res.setHeader("Content-Type", "text/html");
        return res.status(200).send(content);
    } catch (error) {
        console.error("Error fetching the page:", error);
        return res.status(500).json({ error: "Failed to fetch page" });
    }
}
