const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("CONSOLE", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGEERROR", err.message));
  page.on("requestfailed", (req) =>
    console.log(
      "REQUESTFAILED",
      req.url(),
      req.failure() && req.failure().errorText,
    ),
  );
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  const html = await page.content();
  console.log("CONTENT-LENGTH", html.length);
  await browser.close();
})();
