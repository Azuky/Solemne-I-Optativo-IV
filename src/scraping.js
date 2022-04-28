const puppeteer = require('puppeteer');
const HTMLParser = require('node-html-parser');
const fs = require('fs');

const filename = './out/animes.json';
// const filename = './out/animes-v2.json';

const scraping = async () => {
    const browser = await puppeteer.launch({
        // headless: false,
    });
    const mainPage = await browser.newPage();
    await mainPage.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.50',
    );
    await mainPage.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,es-CL;q=0.8,es;q=0.7',
    });
    await mainPage.goto('https://myanimelist.net/topanime.php?limit=1850', { timeout: 60000 });
    // await mainPage.screenshot({ path: './out/screenshot.png' });
    const animeList = await mainPage.$$('tr.ranking-list');
    await getData(browser, animeList);
    await nextPage(mainPage, browser);

    await mainPage.close();
};

const nextPage = async (mainPage, browser) => {
    await Promise.all([mainPage.waitForNavigation({ timeout: 60000 }), mainPage.click('a.link-blue-box.next')]);
    const animeList = await mainPage.$$('tr.ranking-list');
    await getData(browser, animeList);
    await nextPage(mainPage, browser);
};

const getData = async (browser, animeList) => {
    const animesData = [];
    for (const anime of animeList) {
        const newPage = await browser.newPage();
        try {
            const url = await anime.$eval('div.detail a', (node) => node.getAttribute('href'));
            await newPage.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.50',
            );
            await newPage.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9,es-CL;q=0.8,es;q=0.7',
            });
            await newPage.goto(url, { timeout: 60000 });
            const data = await newPage.evaluate(() => document.querySelector('*').outerHTML);
            const document = HTMLParser.parse(data);
            if (document.querySelector('span.information.type')?.textContent.includes('Music')) {
                await newPage.close();
                continue;
            }
            while (
                document
                    .querySelector('div.display-submit div.caption')
                    ?.textContent.includes('We are temporarily restricting site connections due to heavy access.') &&
                (await newPage.$eval('button.g-recaptcha', () => true).catch(() => false))
            ) {
                await Promise.all([newPage.waitForNavigation({ timeout: 60000 }), newPage.click('button.g-recaptcha')]);
                // await newPage.waitForSelector('h1.title-name.h1_bold_none strong',{ timeout: 0 });
            }
            console.log(document.querySelector('span.numbers.ranked strong').textContent);
            animesData.push({
                title: document.querySelector('h1.title-name.h1_bold_none strong').textContent,
                score: document.querySelector('div.score-label').textContent,
                season: document.querySelector('span.information.season a')?.textContent ?? null,
                synopsis: document.querySelector('p[itemprop="description"]').textContent,
                characters:
                    document.querySelector('div.detail-characters-list')?.previousElementSibling.querySelector('h2')
                        .textContent === 'Characters & Voice Actors'
                        ? document
                              .querySelector('div.detail-characters-list')
                              .querySelectorAll('table[width="100%"]')
                              .map((character) => ({
                                  character: {
                                      name: character.querySelector('td.borderClass h3 a').textContent,
                                      image: character
                                          .querySelector('td.borderClass div.picSurround img')
                                          .getAttribute('data-src'),
                                  },
                                  voiceActor: {
                                      name: character.querySelector('td.va-t a')?.textContent ?? null,
                                      image:
                                          character
                                              .querySelector('table div.picSurround img')
                                              ?.getAttribute('data-src') ?? null,
                                  },
                              }))
                        : null,
                genres:
                    document
                        .querySelectorAll('div.spaceit_pad')
                        .find((el) => el.innerText.includes('Genre'))
                        ?.querySelectorAll('a')
                        .map((element) => element.innerText) ?? null,
                demographic:
                    document
                        .querySelectorAll('div.spaceit_pad')
                        .find((el) => el.innerText.includes('Demographic'))
                        ?.querySelector('a').innerText ?? null,
            });
            await newPage.close();
        } catch (e) {
            console.log(e);
            await newPage.close();
        }
    }

    if (fs.existsSync(filename)) {
        const json = fs.readFileSync(filename);
        let animes = JSON.parse(json);
        animes = animes.concat(animesData);
        fs.writeFileSync(filename, JSON.stringify(animes));
    } else {
        fs.writeFileSync(filename, JSON.stringify(animesData));
    }
};
module.exports = scraping;
