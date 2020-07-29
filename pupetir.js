const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const request = require('request');
const arrayToTxtFile = require('array-to-txt-file')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { last, functionsIn } = require('lodash');
puppeteer.use(AdblockerPlugin());

(async () => {

  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    })
  }
  /* variables*/
  const parameter = process.argv.slice(1);
  const url = parameter[1];
  let urlSet = new Set();
  let blogHeadingSet = new Set();
  let blogLinkSet = new Set();
  let urlCurrent;
  /* Test */
  let arrayOfSources = [];
  let arrayOfImageTitles = [];
  let goingReverse = false;
  
  
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
    const element = await page.$(".counter");
    const text = await page.evaluate(element => element.textContent, element);
    var last2 = parseInt(text.slice(beggining));
    return last2;
  }
  async function getHeading() {
    let elementHeading = await page.$(".ngg-imagebrowser h4");
    let heading = await page.evaluate(elementHeading => elementHeading.textContent, elementHeading);
    if(heading.length >= 15) {
      heading = heading.slice(0, 15);
    }
    blogHeadingSet.add(heading)
    console.log(heading);
  }
  async function getSource() {
    let elementLink = await page.$$eval(".ngg-imagebrowser-desc p a", element => element.map(a => a.getAttribute('href')));
    let elementLinkHTML = '<a href="'+elementLink+'">Source</a>';
    console.log(elementLinkHTML);
    blogLinkSet.add(elementLinkHTML);
  }
  async function downloadImage() {
    let imageUrl = await page.$$eval('a.ngg-fancybox img[src]', a => a.map(img => img.getAttribute('src')));
    let imageTitle = await page.$$eval('.ngg-fancybox img[title]', imageTitle => imageTitle.map(img => img.getAttribute('title')));
    if(imageTitle.length >= 15) {
      imageTitle = imageTitle.slice(0, 15);
    }
    arrayOfImageTitles.push(imageTitle);
    imageTitle = folderName + "/fotke/" + imageTitle + ".jpg";
    imageTitle = imageTitle.slice(0, 15);
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
  

  

  await page.waitFor(3000);

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
    await browser.close();
  }

  
  do {
    await page.waitFor(3000);
    urlCurrent = await page.url();
    
    console.log("trenutni url - " + urlCurrent);
    
    urlSet.add(urlCurrent);
    
    
    getHeading();
    getSource();
    await page.waitFor(3000);
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
        
        
        getHeading();
        getSource();
        
        await page.waitFor(3000);
    
        downloadImage()
        /* us lucaju da zapuca pomaze mu skroll iz nekog razloga */
        if(arrayOfImageTitles[arrayOfImageTitles.length - 1] === arrayOfImageTitles[arrayOfImageTitles.length - 2]); {
          await page.waitFor(1000);
          await scrollToBottom(page);
        }
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
  let arrayHeading = Array.from(blogHeadingSet); 
  let arrayLink = Array.from(blogLinkSet); 

  let arrayCombined = [];
  let counter = 0;

  for (let index = 0; index < (arrayHeading.length * 2 ); index++) {
    arrayCombined[counter] = arrayHeading[index];
    arrayCombined[counter + 1] = arrayLink[index];
    counter += 2;
  }
  console.log(arrayOfImageTitles);
  /*write to txt */
arrayToTxtFile(array, './url.txt', err => {
    if(err) {
      console.error(err)
      return
    }
    console.log('Successfully wrote to txt file')
    /* check if files are complete*/
    filePath = './url.txt';
    fileBuffer =  fs.readFileSync(filePath);
    to_string = fileBuffer.toString();
    split_lines = to_string.split("\n");
    const urlLines = (split_lines.length-1);

    const length = fs.readdirSync('./fotke').length
    console.log("fajlovi: " + length + " urlovi: " + urlLines + " total: " + numberOfPhotosInGallery);
    if (numberOfPhotosInGallery === urlLines && numberOfPhotosInGallery === length) {
      console.log("SVI FAJLOVI SU NA BROJU!");
    }
})
arrayToTxtFile(arrayCombined, './combined.txt', err => {
  if(err) {
    console.error(err)
    return
  }
  console.log('Successfully wrote to txt file')
})



  await browser.close();

})();
