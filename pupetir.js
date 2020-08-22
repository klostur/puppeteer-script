const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const request = require('request');
const arrayToTxtFile = require('array-to-txt-file')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin());
const _ = require('lodash');
let arrayURLS = [
  
  
  
  // "https://justimagine-ddoc.com/crafts/lined-canvas-bins-from-diaper-boxes/",
  // "https://justimagine-ddoc.com/crafts/how-to-fold-paper-flowers/",
  // "https://justimagine-ddoc.com/crafts/diy-mini-resurrection-garden/",
  // "https://justimagine-ddoc.com/holidays-and-events/gift-ideas-for-mothers-day/",
    // "https://justimagine-ddoc.com/crafts/crafty-goodness/",
 
  
  "https://justimagine-ddoc.com/home-and-decor/20-creative-color-schemes-inspired-by-the-color-wheel/",
  "https://justimagine-ddoc.com/crafts/creative-and-awesome-do-it-yourself-project-ideas/",
  "https://justimagine-ddoc.com/crafts/exploding-box-tutorial/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-scrapbook-ideas/",
  "https://justimagine-ddoc.com/holidays-and-events/zombie-brain-halloween-cake/",
  "https://justimagine-ddoc.com/food-and-drink/witchs-brew-iced-tea-halloween-drink/",
  "https://justimagine-ddoc.com/food-and-drink/bloody-cauldron-halloween-cocktail/",
  "https://justimagine-ddoc.com/food-and-drink/crystal-skull-halloween-martini-recipe/",
  "https://justimagine-ddoc.com/food-and-drink/fall-tradition-pumpkin-pie/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-is-getting-closer-are-you-ready/",
  "https://justimagine-ddoc.com/food-and-drink/halloween-party-food/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-party-drinks/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-party-invitation-cards/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-wreath-inspiration/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-pumpkin-ideas/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-home-decoration-ideas/",
  "https://justimagine-ddoc.com/food-and-drink/halloween-food-and-drink-tips/",
  "https://justimagine-ddoc.com/holidays-and-events/creepy-red-eyed-crow-halloween-cocktail/",
  "https://justimagine-ddoc.com/holidays-and-events/halloween-makeup-and-costumes/",
  "https://justimagine-ddoc.com/crafts/painted-rocks-tips-and-inspiration/",
  "https://justimagine-ddoc.com/crafts/cool-and-creative-ideas-to-keep-your-shiny-jewelry/"
];
(async () => {

  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    })
  }
  for (let index = 0; index < arrayURLS.length; index++) {

    
  
  /* variables*/
  // const parameter = process.argv.slice(1);
  const url = arrayURLS[index];
  let urlSet = new Set();
  let blogLinksAndHeadings = {heading: "", link: ""};
  let objArr = [];
  let urlCurrent;
  /* Test */
  let arrayOfSources = [];
  let ImageTitles = new Set();
  let goingReverse = false;
  var stringSimilarity = require('string-similarity');
  let best_matches = new Set();
  
  
  async function clickNext() {
    const selectorNext = 'a.ngg-browser-next';
    await page.waitForFunction(
      selectorNext => document.querySelector(selectorNext).innerText.length > 0,
      {},
      selectorNext);
    console.log("naso selektor next");
    await page.click(selectorNext);
  }

  async function clickPrev() {
    const selectorPrev = 'a.ngg-browser-prev';
    await page.waitForFunction(
      selectorPrev => document.querySelector(selectorPrev).innerText.length > 0,
      {},
      selectorPrev);
    console.log("naso selektor prev");
    await page.click(selectorPrev);
  }
  async function getGallery(beggining) {
    try {
      const element = await page.$(".counter");
      const text = await page.evaluate(element => element.textContent, element);
      var last2 = parseInt(text.slice(beggining));
      return last2;
    } catch (error) {
      return null;
    }
    
  }
  async function getHeading() {
    let elementHeading = await page.$(".ngg-imagebrowser h4");
    let heading = await page.evaluate(elementHeading => elementHeading.textContent, elementHeading);
    let imageTitle = await page.$$eval('.ngg-fancybox img[title]', imageTitle => imageTitle.map(img => img.getAttribute('title')));
    if (heading !== " ") {
      return heading;
    } else {
      return imageTitle[0];
    }
  }
  async function getSource() {
    let elementLink = await page.$$eval(".ngg-imagebrowser-desc p a", element => element.map(a => a.getAttribute('href')));
    let elementLinkHTML = '<a href="'+elementLink+'">Source</a>';
    return elementLinkHTML;
  }
  async function downloadImage() {
    let imageUrl = await page.$$eval('a.ngg-fancybox img[src]', a => a.map(img => img.getAttribute('src')));
    let imageTitle = await page.$$eval('.ngg-fancybox img[title]', imageTitle => imageTitle.map(img => img.getAttribute('title')));
    if (typeof imageTitle !== 'undefined') {
      ImageTitles.add(imageTitle[0]);
    }
    imageTitle = imageTitle[0];
    if(imageTitle.length > 80 ) {
      imageTitle = imageTitle.slice(0, 80);
    }
    imageTitle = sanitizeString(imageTitle);
    imageTitle = folderName + "/fotke/" + imageTitle + ".jpg";
    download(imageUrl[0], imageTitle, () => {
      console.log('✅ '+ imageTitle + " saved!")
    })
  }
  async function scrollToBottom(page) {
    const distance = 100; // should be less than or equal to window.innerHeight
    const delay = 100;
    while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
      await page.evaluate((y) => { document.scrollingElement.scrollBy(0, y); }, distance);
      await page.waitFor(delay);
    }
  }
  async function createFolder() {
    let folder = await page.$("h1");
    let folderName = await page.evaluate(folder => folder.textContent, folder);
    folderName = sanitizeString(folderName);
    console.log(folderName);
    if (!fs.existsSync(folderName)){
      fs.mkdirSync(folderName);
      
    }
    let fotkeFolder = folderName + "\\fotke\\";
    if (!fs.existsSync(fotkeFolder)){
      fs.mkdirSync(fotkeFolder);
    }
    return folderName;
  }
  async function getSources() {
    const text = await page.evaluate(() => Array.from(document.querySelectorAll('article li'), element => element.innerHTML));
    return text;
  }
  function sanitizeString(str){
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str.trim();
}

  /*boilerplate code*/
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setViewport({width: 1366, height: 768})
  await page.goto(url, {waitUntil: 'networkidle2'});
  
  folderName = await createFolder();
  
  
  const numberOfPhotosInGallery = await getGallery(-3);
  console.log("U galeriji ima: " + numberOfPhotosInGallery + " fotografija.")
  if(!numberOfPhotosInGallery ) {
    console.log("nuliska");
    fs.rmdirSync(folderName, { recursive: true });
    await browser.close();
    continue;
  }
  
  arrayOfSources = await getSources();
  /*testing za download */

  
  await page.waitFor(3000);
  await scrollToBottom(page);
  clickNext();
  
  await page.waitFor(3000);
  await scrollToBottom(page);
  await page.waitFor(3000);

  clickPrev();

  await page.waitFor(3000);
  
  

  let firstInGallery = await getGallery(-8);
  const urlStart = await page.url();

  console.log("url start: " + urlStart);

  if (urlStart === url || firstInGallery !== 1) {
    console.log ("EO MAGARCA NECE DA KLIKNE ");
    // await browser.close();
  }
  

  
  do {
    await page.waitFor(3000);
    urlCurrent = await page.url();
    
    console.log("trenutni url - " + urlCurrent);
    
    urlSet.add(urlCurrent);
    
    
    blogLinksAndHeadings.heading = await getHeading();
    blogLinksAndHeadings.link = await getSource();

    console.log(blogLinksAndHeadings.heading)
    console.log(blogLinksAndHeadings.link)

    await page.waitFor(3000);
    objArr.push(blogLinksAndHeadings);
    blogLinksAndHeadings = {heading: "", link: ""};
    downloadImage()

    /* us lucaju da zapuca pomaze mu skroll iz nekog razloga */
    await scrollToBottom(page);
    
    clickNext();
    await page.waitFor(3000);
    urlCurrent = await page.url();

    if(urlCurrent.includes("%")) {
      do {
        await page.waitFor(3000);
        urlCurrent = await page.url();
        
        console.log("GOING BACKWARDS YEAAAA trenutni url - " + urlCurrent);
            
        urlSet.add(urlCurrent);
        
        
        blogLinksAndHeadings.heading = await getHeading();
        blogLinksAndHeadings.link = await getSource();
        console.log(blogLinksAndHeadings.heading)
        console.log(blogLinksAndHeadings.link)

        await page.waitFor(3000);
        objArr.push(blogLinksAndHeadings);
        blogLinksAndHeadings = {heading: "", link: ""};
        downloadImage()
        /* us lucaju da zapuca pomaze mu skroll iz nekog razloga */
        await scrollToBottom(page);
        
        clickPrev();
        await page.waitFor(3000);
        urlCurrent = await page.url();
        
        firstInGallery = await getGallery(-8);
        if(firstInGallery === 1) {
          break;
        }
        goingReverse = true;
      } while (urlStart !== urlCurrent);
    }
    if(goingReverse === true) {
      break;
    }
  } while (urlStart !== urlCurrent);
 
  
  let array = Array.from(urlSet); 
  // let arrayHeading = blogHeadingArr; 
  // let arrayLink = Array.from(blogLinkSet); 
  let arrayOfImageTitles = Array.from(ImageTitles);
  let arrayCombined = [];
  let counter = 0;

  console.log(arrayOfImageTitles);
  console.log(typeof arrayOfImageTitles)
  console.log(typeof arrayOfImageTitles[0])
  console.log(typeof arrayOfSources)
  console.log(typeof arrayOfSources[0])
  
  if(typeof arrayOfSources[0] !== 'undefined') {
    for (let index = 0; index < arrayOfImageTitles.length; index++) {
      let matches = stringSimilarity.findBestMatch(arrayOfImageTitles[index], arrayOfSources);
      best_matches.add(matches.bestMatch.target);
    }
  }

  // let objArrUniq = Array.from(new Set(objArr.map(a => a.link)))
  //  .map(link => {
  //    return objArr.find(a => a.link === link)
  //  })
  let objArrUniq = _.uniqBy(objArr, "heading");
  
  /* samo ga napiciti da uklanja duplikate */
  for (let index = 0; index < objArrUniq.length; index++) {
    arrayCombined[counter] = objArrUniq[index].heading;
    console.log(objArrUniq[index].heading);
    arrayCombined[counter + 1] = objArrUniq[index].link;
    counter += 2;
  }
  console.log(arrayCombined);

  
  /*write to txt */
arrayToTxtFile(array, folderName + '/url.txt', err => {
    if(err) {
      console.error(err)
      return
    }
    console.log('Successfully wrote urls to txt file')
    /* check if files are complete*/
    filePath = folderName + '/url.txt';
    fileBuffer =  fs.readFileSync(filePath);
    to_string = fileBuffer.toString();
    split_lines = to_string.split("\n");
    const urlLines = (split_lines.length-1);

    const length = fs.readdirSync(folderName + "/fotke").length
    console.log("fajlovi: " + length + " urlovi: " + urlLines + " total: " + numberOfPhotosInGallery);
    if (numberOfPhotosInGallery === urlLines && numberOfPhotosInGallery === length) {
      console.log("✅✅✅✅✅✅✅SVI FAJLOVI SU NA BROJU!✅✅✅✅✅✅");
    }
})
let best_matchesArr = Array.from(best_matches);
arrayToTxtFile(best_matchesArr, folderName + '/sources.txt', err => {
  if(err) {
    console.error(err)
    return
  }
  console.log('Successfully wrote sources to txt file')
})
arrayToTxtFile(arrayCombined, folderName + '/combined.txt', err => {
  if(err) {
    console.error(err)
    return
  }
  console.log('Successfully wrote combined to txt file')
})


  await browser.close();
  }
})();
