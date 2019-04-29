const puppeteer = require('puppeteer'),
      fs = require('fs'),
      request = require('request');    

// JSON arrays to store data info to files
let storyDataJSON = [],
    mainDataJSON = [];

// Content's images container;
let imgSourcesSetContainer = [];

const savedFilename = 'thaopau_',      
      baseURL = `https://www.instagram.com/${savedFilename}/`;

fs.appendFile('../data/ListOfUsers.txt', savedFilename + '\n', 'utf8', (err) => {
    if(err) throw err;
    // console.log('Data are written into ListOfUsers.txt');
})
      
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

const download = async (uri, filename, cb) => {    
    try {        
        const dir = `../image/${savedFilename}`;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        
        request.head(uri, (err, res, body) => {
            // console.log('content-type: ', res.headers['content-type']);
            // console.log('content-length: ', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(`${dir}/${filename}`)).on('close', cb);
        });
    } catch (err) {
        console.log(err);
    }        
};

// run puppeteer
(async () => {         
    const browser = await puppeteer.launch({ headless: false });    
    const page = await browser.newPage();     
    page.setViewport({ width: 1680, height: 1200 });
    await page.goto(baseURL);
            
    // get the whole content of site
    const HTML_DOM = await page.content();             
    writeFile(HTML_DOM, `${savedFilename}IG`, 'html');

    // ====================================================== \\
    // fetch demanded DOM    
    let storyData = await page.evaluate(() => {    
        let storyImgEl = document.querySelectorAll(`ul.YlNGR > li img`);

        // convert NodeList into native JS array using spread ES6
        storyImgEl = [...storyImgEl];

        let storyData = storyImgEl.map(el => ({
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt'),
            class: el.getAttribute('class')
        }));               

        return storyData;
    })     
                   
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

    // ====================================================== \\
    // fetch data to local 
    storyData.forEach(data => storyDataJSON.push({ 
        src: data['src'], 
        alt: data['alt'],
        class: data['class']
    }));    
    
    mainData.forEach(data => {
        let pos = data['srcset'].lastIndexOf(',')+1,
            demandedURL = data['srcset'].substring(pos, data['srcset'].length-5);
        imgSourcesSetContainer.push(demandedURL);

        mainDataJSON.push({ 
            srcset: data['srcset'],
            src: data['src'], 
            alt: data['alt']
        })        
    });       

    // save data to local files
    mainDataJSON = await JSON.stringify(mainDataJSON, null, '\t');
    storyDataJSON = await JSON.stringify(storyDataJSON, null, '\t');

    writeFile(mainDataJSON, `${savedFilename}MainData`, 'json');
    writeFile(storyDataJSON, `${savedFilename}StoryData`, 'json');             

    imgSourcesSetContainer.forEach((imgSrc, index) => {                   
        download(imgSrc, `/img${index}.jpg`, () => {
            console.log(`Done: ${savedFilename}: ${index}`);
        });               
    });

    await page.waitFor(5000);
    await browser.close();
})();


