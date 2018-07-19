describe("main tests suite", function() {

    var csv = require("fast-csv");
    var rows = [];
    before(function(){

    });
    it("run data gathering", function() {
        runOnFirst(browser, csv, rows);
    });
});

function extractImage(driver, url) {
    driver.url(url);
    driver.getAttribute("(//*[text()='View image'])[2]/..", 'href').then(function(imgPath) {
        console.log('URL for pic is: ' + imgPath);
    });
}

function runOnFirst(browser, csv, rows) {
    csv.fromPath("one.csv")
        .on("data", function(data){
            rows.push(data[6]);
        })
        .on("end", function(){

            for(i=0;i<rows.length;i++) {
                console.log(rows[i]);
                extractImage(browser, rows[i]);
            }
        });
}
function runOnAllData() {

}

