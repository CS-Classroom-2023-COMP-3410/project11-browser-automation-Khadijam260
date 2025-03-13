import puppeteer from "puppeteer";
import fs from "fs";

// Load JSON manually
const credentials = JSON.parse(fs.readFileSync("./credentials.json", "utf-8"));

async function searchRepositories(query) {
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            defaultViewport: null,
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox',
                '--ignore-certificate-errors',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
        });    
        const page = await browser.newPage();


        //Log in
        await page.goto('https://github.com/login');
        await page.type('#login_field', credentials.username);
        await page.type('#password', credentials.password);
        await Promise.all([
            page.click('.btn.btn-primary.btn-block.js-sign-in-button'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);

        //Setting the width of the page
        await page.setViewport({ width: 1920, height: 1080 });
        await page.bringToFront(); // Make sure the page is in front

        // Pressing the / key to trigger the search button
        await page.keyboard.press('/');

        // Searching fro the repository
        const searchExists = await page.evaluate(() => {
            return !!document.querySelector("#query-builder-test")
        });
        await page.waitForSelector('#query-builder-test', { visible: true });
        await page.click('#query-builder-test'); // Clicking th input field
        await page.type('#query-builder-test', query, { delay: 100 }); // Type the search query
        await page.keyboard.press('Enter'); // Press Enter to trigger search
        // Wait for search results to load dynamically (GitHub doesn't navigate)
        await page.waitForSelector('.Box-sc-g0xbh4-0', { visible: true, timeout: 10000 });

        // First checking whether the repo is already starred
        const isStarred = await page.evaluate(() => {
            const starButton = document.querySelector("body > div.logged-in.env-production.page-responsive > div.application-main > main > react-app > div > div > div.Box-sc-g0xbh4-0.dKXtYX > div > div > div.Box-sc-g0xbh4-0.dsxbXg > div.Box-sc-g0xbh4-0.FxAyp > div > div.Box-sc-g0xbh4-0.insNpl > div.Box-sc-g0xbh4-0.JcuiZ > div > div > div:nth-child(1) > div > div.Box-sc-g0xbh4-0.gtlRHe > div.Box-sc-g0xbh4-0.fvaNTI > button > span > span.prc-Button-Label-pTQ3x");
            return starButton && starButton.innerText.includes("Unstar");
        });

        // Star the repo
        if (!isStarred) { 
            await page.evaluate(() => {
                document.querySelector("body > div.logged-in.env-production.page-responsive > div.application-main > main > react-app > div > div > div.Box-sc-g0xbh4-0.dKXtYX > div > div > div.Box-sc-g0xbh4-0.dsxbXg > div.Box-sc-g0xbh4-0.FxAyp > div > div.Box-sc-g0xbh4-0.insNpl > div.Box-sc-g0xbh4-0.JcuiZ > div > div > div:nth-child(1) > div > div.Box-sc-g0xbh4-0.gtlRHe > div.Box-sc-g0xbh4-0.fvaNTI > button").click()
            });
        }

        // Navigate to profile page
        await page.waitForSelector('.AppHeader-user', { visible: true });
        await page.click('.AppHeader-user');  // Click the profile icon
        // Wait for the dropdown menu to appear
        await page.waitForSelector('a[href*="tab=stars"]', { visible: true });
        // Click the "Your stars" link inside the dropdown
        await page.click('a[href*="tab=stars"]');
        await page.waitForSelector('#user-profile-frame', {visible: true});

        // waiting for the create list button to show up
        const followListButton = await page.$(".details-reset.details-overlay.details-overlay-dark.js-follow-list");
        if (followListButton) {
            await followListButton.click();
        } else {
            console.error("Follow list button not found!");
        }


        // checking if the node libraries list is already created
        await page.waitForSelector('.form-control.js-user-list-input.js-characters-remaining-field', {visible: true});
        const listCreated = await page.evaluate(() => {
            const listTitle = document.querySelector("#profile-lists-container > div > a > div > h3");
            return listTitle.innerText.includes("Node Libraries");
        });

        //creating the node libraries list
        if (!listCreated) {
            await page.type('.form-control.js-user-list-input.js-characters-remaining-field', "Node Libraries", { delay: 1000 });
            await page.click('.Button--primary.Button--medium.Button.Button--fullWidth.mt-2');
            console.log("Node Libraries does not exist");
        }

        // looping through the starred repos to add them to the list
        await page.waitForSelector("#user-starred-repos");
        const repoStarred = await page.evaluate((query) => {
            const repos = Array.from(document.querySelectorAll("h3 a"));
        
            for (let repo of repos) {        
                let fullText = repo.innerText.trim().replace(/\s*\/\s*/, "/"); 

                //if the current repo matches our query
                if (fullText.toLowerCase() === query.toLowerCase()) {
                    let container = repo.parentElement;
                    let starDropdown = null;
                    while (container && !starDropdown) {
                        starDropdown = container.querySelector('summary[aria-haspopup="menu"]');
                        container = container.parentElement;
                    }

                    //click the drop down button for the current repo
                    if (starDropdown) {
                        starDropdown.click();
                        matchedRepo = fullText;
                        break;
                    }

                    return { found: fullText};
    
                }
            }
            return { found: null};
        }, query);

        // Find and click the "Node Libraries" checkbox
        await page.waitForSelector('details[open] .SelectMenu-list', { visible: true, timeout: 10000 });
        const listClicked = await page.evaluate(() => {
            const listItem = Array.from(document.querySelectorAll(".SelectMenu-list label"))
                .find(label => label.innerText.trim() === "Node Libraries");

            if (listItem) {                
                const checkbox = listItem.querySelector("input[type='checkbox']");
                if (checkbox) {
                    checkbox.click();
                    return true;
                } else {
                    console.log("❌ Checkbox inside 'Node Libraries' not found!");
                }
            } else {
                console.log("❌ 'Node Libraries' list item not found!");
            }
            return false;
        });

        if (listClicked) {
            
            // click outside to save the selection
            await page.evaluate(() => {
                const body = document.querySelector("body");
                if (body) {
                    body.click();
                }
            });

            // close the dropdown button
            const closeButton = await page.$('.SelectMenu-closeButton');
            if (closeButton) {
                // screenshot to debug
                await closeButton.evaluate(btn => btn.click());
                console.log("Added repo to Node Libraries list!")
            } else {
                await page.keyboard.press("Escape");
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            const safeQuery = query.replace(/[\/\\:*?"<>|]/g, "_"); // Replace invalid filename characters
            await page.screenshot({ path: `${safeQuery}_final_screenshot.png` });
        } 



        await browser.close();
 
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

searchRepositories("cheeriojs/cheerio")
searchRepositories("axios/axios")
searchRepositories("puppeteer/puppeteer")