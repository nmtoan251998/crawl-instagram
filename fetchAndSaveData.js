const puppeteer = require('puppeteer'),
      fs = require('fs'),
      imgDownload = require('image-downloader');    

const savedFilename = '_khvan26_',      
      baseURL = `https://www.instagram.com/${savedFilename}/`; 
            
const writeFile = (content, filename, expand) => {
    try {
        const dir = `../data/${savedFilename}`;
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

const download = async (uri) => {            
    try {        
        const dir = `../image/${savedFilename}`;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        let saveAll = { url: uri, dest: '../image/images' }
        imgDownload.image(saveAll)
            .then(({ filename, image }) => {
                console.log('File saved to', filename)
            })
            .catch((err) => {
                console.error(err)
            })
    

        let saveEach = { url: uri, dest: dir }
        imgDownload.image(saveEach)
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
    writeFile(HTML_DOM, `${savedFilename}IG`, 'html');
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
    writeFile(containerJSON, `${savedFilename}MainData`, 'json');    

    imgSourcesSetContainer.forEach((imgSrc, index) => download(imgSrc));    
}

// run puppeteer
const getData = async () => {             
    const browser = await puppeteer.launch({ headless: false });    
    const page = await browser.newPage();     
    page.setViewport({ width: 1680, height: 1200 });
    await page.goto(baseURL);
    
    crawlHTML(page);
    
    let mainData =  await crawlMainData(page);
    saveMainDataToFile(mainData);
            
    // write user infor after get information
    fs.appendFile('../data/ListOfUsers.txt', `name: ${savedFilename}, URL: ${baseURL}` + '\n', 'utf8', (err) => {
        if(err) throw err;
        console.log('Data are written into ListOfUsers.txt');
    })

    await page.waitFor(5000);    
    console.log('Stop crawling data!');
    await browser.close();
};

getData();