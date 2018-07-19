var fs = require("fs");
var webdriverio = require('webdriverio');
var request = require('request');
var url = require('url');
var path = require('path');
var options = {
    sync: false,
    desiredCapabilities: {
        maxInstances: 1,
        maxSession: 1,
        maxSessions: 1,
        browserName: 'firefox'
    }
};

var csv = require("fast-csv");
var rows = [];
var driver = webdriverio
    .remote(options);

driver.init();

runOnFirst(csv, rows);

async function extractImage(data, i) {
    var href = data[6];

    driver.url(href);
    await driver.pause(5000);
    try {
        var imgPath = await driver.element("(//*[text()='View image'])[2]/..").getAttribute('href');
    } catch(e) {
        console.log('could not find google image on: ' + href);
        return new Promise((resolve) => {resolve(''); });
    }
    console.log('found image at: ' + imgPath);
    try {
        var pathname = i + '_' + path.basename(url.parse(imgPath).pathname);
        console.log('downloading ' + pathname);
        download(imgPath, pathname);

        console.log('saving pathname');
        // data.push(pathanme);
        data[7] = pathname;
    } catch(e) {
        console.log('page: ' + href + e);
        console.log('url didnt work' + imgPath);
    }
}

function runOnFirst(csv, rows) {
    csv.fromPath("data.csv")
        .on("data", function(data){
            rows.push(data);
        })
        .on("end", async function(){
           for(i=0;i<rows.length;i++) {
               console.log('extracting ' + i);
               console.log(rows[i]);
               if(rows[i][6] && rows[i][6].length>0)
                    await extractImage(rows[i], i);
            }

            csv.writeToStream(fs.createWriteStream("my.csv"), rows, {headers: false});
        });
}

function download(uri, filename){
    try {
        request.head(uri, function(err, res, body){
            if(res){
                console.log('content-type:', res.headers['content-type']);
                console.log('content-length:', res.headers['content-length']);

                request(uri).pipe(fs.createWriteStream('images/'+filename));
            }
    });

    } catch(e) {}
};

// download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
//     console.log('done');
// });
function runOnAllData() {

}

