const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 1000));
  
  // Check if middleContent is visible
  const opacity = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return 'no nav';
    const middle = nav.children[0].children[1];
    return window.getComputedStyle(middle).opacity;
  });
  console.log('Opacity of middleContent after scroll:', opacity);
  
  await browser.close();
})();
