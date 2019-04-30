const puppeteer = require('puppeteer'),
      fs = require('fs'),
      imgDownload = require('image-downloader');    

const userName = 'loungu',      
      baseURL = `https://www.instagram.com/${userName}/`; 
            
const writeFile = (content, filename, expand) => {
    try {
        const dir = `../data/${userName}`;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
                    
        let fullFilename = `${dir}/${filename}.${expand}`;
        filename = fs.createWriteStream(`${fullFilename}`);
        filename.write(content);
        filename.end();  
    } catch(err) {
        console.log(err);
    }    
};

const downloadImages = async (uri) => {            
    try {        
        const dir = `../image/${userName}`;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        let saveForAll = { url: uri, dest: '../image/images' }
        imgDownload.image(saveForAll)
            .then(({ filename, image }) => {
                console.log('File saved to', filename)
            })
            .catch((err) => {
                console.error(err)
            })
    

        let saveForEach = { url: uri, dest: dir }
        imgDownload.image(saveForEach)
            .then(({ filename, image }) => {
                console.log('File saved to', filename)
            })
            .catch((err) => {
                console.error(err)
            })
    } catch (err) {
        console.log(err);
    }                 
};

const crawlMainData = async (page) => {    
    let mainData = await page.evaluate(() => {
        let mainDataEl = document.querySelectorAll(`img.FFVAD`);

        // convert NodeList into native JS array using spread ES6
        mainDataEl = [...mainDataEl];

        let mainData = mainDataEl.map(el => ({
            srcset: el.getAttribute('srcset'),
            src: el.getAttribute('src'),            
            alt: el.getAttribute('alt')
        }));

        return mainData;
    })    

    return mainData;
};

const crawlHTML = async (page) => {
    const HTML_DOM = await page.content();             
    writeFile(HTML_DOM, `${userName}IG`, 'html');
}

const saveMainDataToFile = async (container) => {
    let containerJSON = [],
        imgSourcesSetContainer = [];

    container.forEach(data => {
        let pos = data['srcset'].lastIndexOf(',')+1,
            demandedURL = data['srcset'].substring(pos, data['srcset'].length-5);
        imgSourcesSetContainer.push(demandedURL);

        containerJSON.push({ 
            srcset: data['srcset'],
            src: data['src'], 
            alt: data['alt']
        })        
    });       

    // save data to local files
    containerJSON = await JSON.stringify(containerJSON, null, '\t');
    writeFile(containerJSON, `${userName}MainData`, 'json');    

    imgSourcesSetContainer.forEach((imgSrc, index) => downloadImages(imgSrc));    
}

// run puppeteer
module.exports.getData = async () => {             
    const browser = await puppeteer.launch({ headless: false });    
    const page = await browser.newPage();     
    page.setViewport({ width: 1680, height: 1200 });
    await page.goto(baseURL);
    
    crawlHTML(page);
    
    let mainData =  await crawlMainData(page);
    saveMainDataToFile(mainData);
            
    // write user infor after get information
    fs.appendFile('../data/ListOfUsers.txt', `name: ${userName}, URL: ${baseURL}` + '\n', 'utf8', (err) => {
        if(err) throw err;
        console.log('Data are written into ListOfUsers.txt');
    })

    await page.waitFor(5000);    
    console.log('Stop crawling data!');
    await browser.close();
};