import "dotenv/config";
import puppeteer from "puppeteer";

const URL = "https://store.totaline.ar/fin-comp-1-5hp-r22-c-valv-220v-m-hbp.html";
const TOTALINE_EMAIL = process.env.TOTALINE_EMAIL || "";
const TOTALINE_PASSWORD = process.env.TOTALINE_PASSWORD || "";

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  console.log("Login...");
  await page.goto("https://store.totaline.ar/customer/account/login/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.type("#email", TOTALINE_EMAIL, { delay: 20 });
  await page.type("#pass", TOTALINE_PASSWORD, { delay: 20 });
  await page.evaluate(() => {
    const btn = document.querySelector("#send2") as HTMLButtonElement;
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 5000));

  console.log("Visiting product...");
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 4000));

  // Find the element containing "Entrega inmediata"
  const html = await page.evaluate(() => {
    function findElementByText(searchText: string): string | null {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.includes(searchText)) {
          let parent = node.parentElement;
          // Walk up 3 levels for context
          for (let i = 0; i < 3 && parent?.parentElement; i++) parent = parent.parentElement;
          return parent?.outerHTML.substring(0, 1500) || null;
        }
      }
      return null;
    }
    return findElementByText("Entrega inmediata");
  });

  console.log("HTML around 'Entrega inmediata':\n", html);

  await browser.close();
}

main().catch(console.error);
