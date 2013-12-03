var map;
var intervalFunction;
var currentlyAddedGraphics = [];

require([
    // Esri modules
    "esri/map",
    "esri/graphic",
    "esri/layers/agstiled",
    "esri/layers/agsdynamic",
    "esri/IdentityManagerDialog",
    "esri/request",

    // Custom modules
    "scripts/serviceView",

    // Dojo modules
    "dojo/domReady!"
], init);

// Main function executed when DOM ready
function init() {
    // Set the title
    document.title = configOptions.Title;
    $("#title").text(configOptions.Title);

    // Get the current page
    var pagePath = window.location.pathname;
    var currentPage = pagePath.substring(pagePath.lastIndexOf('/') + 1);

    // Popular extents
    if (currentPage.indexOf("PopularExtents") != -1) {
        // Setup proxy
        esri.config.defaults.io.proxyUrl = configOptions.proxyUrl;

        // Get the initial extent
        var initialExtent = new esri.geometry.Extent({
            "xmin": configOptions.initialExtent.xmin,
            "ymin": configOptions.initialExtent.ymin,
            "xmax": configOptions.initialExtent.xmax,
            "ymax": configOptions.initialExtent.ymax,
            "spatialReference": {
                "wkid": parseInt(configOptions.spatialReference.WKID)
            }
        });

        // Create map control
        map = new esri.Map("map", {
            wrapAround180: configOptions.wraparound180,
            extent: initialExtent,
            navigationMode: "css-transforms",
            fadeOnZoom: true,
            logo: false,
            showAttribution: false
        });

        // Add the basemap
        var basemap = new esri.layers.ArcGISTiledMapServiceLayer(configOptions.basemap.url);
        map.addLayer(basemap);

        // Plot the extent every some secs
        processLogs();
        intervalFunction = setInterval(processLogs, 2000);
    }
    // Services dashboard
    else {
        // Parser module load
        require(["dojo/parser"], function (parser) {
            esriConfig.defaults.io.timeout = 300000;
            esriConfig.defaults.io.proxyUrl = protoConfig.proxyURL;
            esri.config = esriConfig.defaults;
            parser.parse();
        });
    }

    // Hide the progress bar for loading the app
    $("#appLoadBar").hide();
}

// Plots extents from a log request
function plotExtents(response) {
    // If no response returned
    if (response == null || response == undefined) {
        return;
    }

    // Get the logs
    var logs = response["logMessages"];

    // Get the records that have extent in them
    for (var i = 0; i < logs.length; i++) {
        var record = logs[i];
        var message = record["message"];

        // This extent has not been added before
        if (message.search("Extent:") >= 0) {
            // Get the date and time - convert from unix time
            var unixTime = record["time"];
            var unixDate = new Date(unixTime);
            var year = unixDate.getFullYear();
            var month = unixDate.getMonth();
            var date = unixDate.getDate();
            var hours = unixDate.getHours();
            var minutes = unixDate.getMinutes();
            var seconds = unixDate.getSeconds();
            var formattedTime = hours + ':' + minutes + ':' + seconds;

            console.log("Time - " + date + "/" + month + "/" + year + " at " + formattedTime);
            console.log("Request - " + message);

            if (currentlyAddedGraphics.indexOf(unixTime) >= 0) {
                continue;
            }

            var extent = message.replace("Extent:", "");
            var coords = extent.split(",");
            var polygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([111, 0, 255]), 2), new dojo.Color([111, 0, 255, 0.15]));
            var sr = new esri.SpatialReference({
                wkid: configOptions.spatialReference.WKID
            })
            var extent = new esri.geometry.Extent(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2]), parseFloat(coords[3]), sr);
            map.graphics.add(new esri.Graphic(extent, polygonSymbol));
            currentlyAddedGraphics.push(unixTime);
            break;
        }
    }
}

// Stops the plotting of extents
function stop() {
    if (intervalFunction != undefined) {
        clearInterval(intervalFunction);
    }
}

// Clears all the graphics from the map
function clearGraphics() {
    stop();
    if (map.graphics != undefined) {
        map.graphics.clear();
    }
    currentlyAddedGraphics = [];
}

// Fetches log information from server	
function processLogs() {
    var serverLogsRequest = esri.request({
        url: configOptions.agsSite + "/admin/logs/query",
        handleAs: "json",
        content: {
            "level": "FINE",
            "filter": configOptions.agsQueryFilter,
            "f": "json",
            "token": configOptions.agsToken
        },
    });
    serverLogsRequest.then(plotExtents, requestFailed);
}

// Error handler
function requestFailed(error) {
    console.log("Error: ", error.message);
}