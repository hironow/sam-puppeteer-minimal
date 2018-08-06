const launchChrome = require("@serverless-chrome/lambda");
const CDP = require("chrome-remote-interface");
const puppeteer = require("puppeteer");

exports.lambda_handler = async (event, context, callback) => {
  let slsChrome = null;
  let browser = null;
  let page = null;

  try {
    // prepare
    slsChrome = await launchChrome();
    browser = await puppeteer.connect({
      browserWSEndpoint: (await CDP.Version()).webSocketDebuggerUrl
    });
    page = await browser.newPage();

    // browsing
    await page.goto(
      `https://www.google.co.jp/search?q=${event.pathParameters.word}`,
      {
        waitUntil: "domcontentloaded"
      }
    );
    const resultSelector = "#resultStats";
    await page.waitForSelector(resultSelector);

    const resultCount = await page.evaluate(() => {
      const result = document.querySelector("#resultStats");
      return result.textContent;
    });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        result: "OK",
        count: resultCount
      })
    });
  } catch (err) {
    console.log(err);
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        result: "NG"
      })
    });
  } finally {
    if (page) {
      await page.close();
    }

    if (browser) {
      await browser.disconnect();
    }

    if (slsChrome) {
      await slsChrome.kill();
    }
  }
};
