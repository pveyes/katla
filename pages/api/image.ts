import chrome from "chrome-aws-lambda";
import absoluteUrl from "next-absolute-url";
import querystring from "querystring";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let browser = null;
  const { origin } = absoluteUrl(req);

  try {
    const gameNumber = req.query.gameNumber;
    const answer = req.query.answer;
    const userAnswer = req.query.userAnswer;
    const score = req.query.score;
    const theme = req.query.theme;
    const query = querystring.stringify({
      gameNumber,
      answer,
      userAnswer,
      score,
      theme,
    });
    const url = `${origin}/image?${query}`;

    browser = await chrome.puppeteer.launch({
      args: [],
      defaultViewport: chrome.defaultViewport,
      headless: chrome.headless,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();

    await page.setViewport({
      width: 450,
      height: 700,
    });

    await page.goto(url, {
      waitUntil: "load",
    });

    const screenshot = await page.screenshot({
      encoding: "binary",
    });

    res.setHeader("content-type", "image/png");
    res.setHeader("cache-control", "public, max-age=120");
    res.send(screenshot);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default handler;
