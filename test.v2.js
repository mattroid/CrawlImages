var async = require('async');
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
        browserName: 'chrome'
    }
};

var csv = require("fast-csv");
var rows = [];
var driver = webdriverio
    .remote(options);

driver.init();

setTimeout(()=> runOnFirst(csv, rows), 5000);

function extractImage(data, i) {
    return new Promise(function(resolve, reject) {
        // check if there is a link in the first col
        var href = data[3];
        if (!href) {
            //check again in the next col
            href = data[4];
        }
        else if(!href){
            // couldn't find any links!
            console.log('skipping row' + i);
            return resolve();
        }

        // is the link directly pointing to an image???
        if(/^.*\.(png|jpeg|jpg|gif|png)$/.test(href)){
            var pathname = path.basename(url.parse(href).pathname);
            download(href,i+'_'+pathname);
            data[5] = pathname;
            console.log('saved ' + i + "_" + pathname);
            return resolve();
        }

        console.log('opening ' + href);
        driver.url(href);
        driver.pause(8000).then(() => {
        try {
            //var imgPath = await driver.element("(//*[text()='View image'])[2]/..").getAttribute('href');
            driver.elements("img").then((images)=>{
                // don't overload the selenium server with parallel requests
                async.mapSeries(images.value,
                                // async worker 
                                (f,cb)=>
                                    driver.elementIdSize(f.ELEMENT).then((size)=>cb(null,size)),
                                (err,result) => { 
                                    var imgId = result.map((f,i) => ({id:images.value[i].ELEMENT, size:f.value.width*f.value.height}));
                                    console.log('imgs count: '+ imgId.length);
                                    imgId=imgId.reduce((last, value) => value.size>last.size ? value : last,{id:'',size:0});
                                    console.log('found imgId:' + imgId.id);

                                    // driver.elementIdAttribute(imgId.id,'src').then((elem) => {console.log('img obj');console.log(imgId);});
                                    driver.elementIdAttribute(imgId.id,'src').then((pathResult) => {
                                        var imgPath = pathResult.value;
                                        console.log('found image at ' +imgPath);
                                        try {
                                            var pathname = i + '_' + path.basename(url.parse(imgPath).pathname);
                                            console.log('downloading ' + pathname);
                                            download(imgPath, pathname);

                                            data[5] = pathname;
                                            resolve(true);
                                        } catch(e) {
                                            console.log('page: ' + href + e);
                                            console.log('url didnt work' + imgPath);
                                            resolve(true);
                                        }
                                    }, (error)=> {
                                        console.log('error fetchign found image');
                                        console.log('index: ' + i);
                                        console.log('image_id: '+imgId.id);
                                        resolve();
                                    });

                });

            });
        } catch(e) {
            console.log('could not find google image on: ' + href);
            console.log(e);
            return resolve();
        }

        });
    });
}

function runOnFirst(csv, rows) {
    csv.fromPath("data2.csv")
        .on("data", function(data){
            rows.push(data);
        })
        .on("end", async function(){

            // await extractImage(rows[14], 14);
            // return;

           for(i=0;i<rows.length;i++) {
               console.log('extracting ' + i);
               console.log(rows[i]);
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
