import puppeteer, { Browser } from "puppeteer-core";
import { saveApplication } from "./database";

let browser: Browser | null = null;

// Find Chrome on different OS
function getChromePath(): string {
    if (process.platform === "darwin") {
        return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }
    if (process.platform === "linux") {
        return "/usr/bin/chromium-browser";
    }
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
}

async function getBrowser(): Promise<Browser> {
    if (!browser || !browser.connected) {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.CHROME_PATH || getChromePath(),
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
    }
    return browser;
}

export interface ApplyInput {
    jobUrl: string;
    jobTitle: string;
    company: string;
    userEmail: string;
    profile: {
        name: string;
        email: string;
        phone?: string;
        location?: string;
    };
}

export interface ApplyResult {
    success: boolean;
    message: string;
    screenshot?: string;
    applicationId?: string;
}

export async function autoApply(input: ApplyInput): Promise<ApplyResult> {
    const br = await getBrowser();
    const page = await br.newPage();

    try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(input.jobUrl, { waitUntil: "networkidle2", timeout: 30000 });

        const screenshotBuffer = await page.screenshot({ encoding: "base64" });

        // Try to find and click Apply button
        const applyFound = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("a, button")) as HTMLElement[];
            const applyBtn = buttons.find(
                (btn: HTMLElement) =>
                    btn.textContent?.toLowerCase().includes("apply") ||
                    btn.textContent?.toLowerCase().includes("submit"),
            );
            if (applyBtn) {
                applyBtn.click();
                return true;
            }
            return false;
        });

        if (applyFound) {
            await new Promise((r) => setTimeout(r, 2000));

            // Fill common form fields
            await tryFillField(page, "name", input.profile.name);
            await tryFillField(page, "email", input.profile.email);
            if (input.profile.phone) await tryFillField(page, "phone", input.profile.phone);
            if (input.profile.location) await tryFillField(page, "location", input.profile.location);

            const filledScreenshot = await page.screenshot({ encoding: "base64" });

            const app = await saveApplication({
                user_email: input.userEmail,
                job_title: input.jobTitle,
                company: input.company,
                job_url: input.jobUrl,
                status: "applied",
                notes: "Auto-applied via HireKit",
            });

            return {
                success: true,
                message: `✅ Applied to ${input.company} — ${input.jobTitle}`,
                screenshot: filledScreenshot as string,
                applicationId: app.id,
            };
        }

        // No apply button — save as pending
        const app = await saveApplication({
            user_email: input.userEmail,
            job_title: input.jobTitle,
            company: input.company,
            job_url: input.jobUrl,
            status: "pending",
            notes: "Apply button not found. Manual application needed.",
        });

        return {
            success: false,
            message: `Could not find Apply button on ${input.company}. Saved to tracker — apply manually at the link.`,
            screenshot: screenshotBuffer as string,
            applicationId: app.id,
        };
    } catch (err) {
        return {
            success: false,
            message: `Error: ${(err as Error).message}`,
        };
    } finally {
        await page.close();
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryFillField(page: any, fieldType: string, value: string) {
    const selectors: Record<string, string[]> = {
        name: ['input[name="name"]', 'input[name="full_name"]', 'input[placeholder*="name" i]'],
        email: ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]'],
        phone: ['input[type="tel"]', 'input[name="phone"]', 'input[placeholder*="phone" i]'],
        location: ['input[name="location"]', 'input[name="city"]', 'input[placeholder*="location" i]'],
    };

    const sels = selectors[fieldType] || [];
    for (const sel of sels) {
        try {
            const el = await page.$(sel);
            if (el) {
                await el.click({ clickCount: 3 });
                await el.type(value, { delay: 30 });
                return;
            }
        } catch {
            continue;
        }
    }
}
