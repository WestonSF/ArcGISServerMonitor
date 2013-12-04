var map;
var intervalFunction;
var currentlyAddedGraphics = [];
// Current service selected
var serviceChoice = null;
// Current filter selected
var filterChoice = null;

require([
    // Esri modules
    "esri/map",
    "esri/graphic",
    "esri/layers/agstiled",
    "esri/layers/agsdynamic",
    "esri/request",

    // Custom modules
    "scripts/serviceView",

    // Dojo modules
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/when",
    "dojo/Deferred",
    "dojo/domReady!"
],
// Main function executed when DOM ready
function (map, graphic, agstiled, agsdynamic, request, serviceView, lang, array, when, deferred) {
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

        // Get a list of services
        getAllServices("mapServices",function(serviceList) {
            // Add values into filter dropdown
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Hour" + '</a></li>');
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 24 Hours" + '</a></li>');
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Week" + '</a></li>');
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 30 Days" + '</a></li>');
            // Set default selection
            $('.filterSelection').text("Last 24 Hours");
            filterChoice = "Last 24 Hours";

            // Add values into services dropdown
            array.forEach(serviceList, function (service) {
                $("#servicesDropdown").append('<li><a href="#servicesDropdown">' + service + '</a></li>');
            });
            // Set default selection
            $('.servicesSelection').text(serviceList[0]);
            serviceChoice = serviceList[0];

            // On change handler for services dropdown
            $('.servicesDropdown li > a').click(function (e) {
                // Update dropdown and selection
                $('.servicesSelection').text(this.innerHTML);
                serviceChoice = this.innerHTML;

                // Clear previous graphics
                clearGraphics();

                // Plot the extents
                processLogs();
                intervalFunction = setInterval(processLogs, 2000);
            });
            // On change handler for filter dropdown
            $('.filterDropdown li > a').click(function (e) {
                // Update dropdown and selection
                $('.filterSelection').text(this.innerHTML);
                filterChoice = this.innerHTML;

                // Clear previous graphics
                clearGraphics();

                // Plot the extents
                processLogs();
                intervalFunction = setInterval(processLogs, 2000);
            });

            // Plot the extent every some secs
            processLogs();
            intervalFunction = setInterval(processLogs, 2000);
        });
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
    // ---------------------------------------------------------------------------------------


    // ------------------------ Fetches log information from server	------------------------
    function processLogs() {
        var filterEndTime;

        // Get current unix time
        var unixTime = (new Date).getTime();

        var unixTime = (new Date).getTime();
        if (filterChoice == "Last Hour") {
            filterEndTime = unixTime - (3600 * 1000);
        }
        if (filterChoice == "Last 24 Hours") {
            filterEndTime = unixTime - (86400 * 1000);
        }
        if (filterChoice == "Last Week") {
            filterEndTime = unixTime - (604800 * 1000);
        }
        if (filterChoice == "Last 30 Days") {
            filterEndTime = unixTime - (2592000 * 1000);
        }

        var serverLogsRequest = esri.request({
            url: configOptions.agsSite + "/admin/logs/query",
            handleAs: "json",
            content: {
                "level": "FINE",
                "filter": "{ \"services\": [\"" + serviceChoice + "\"], \"server\": [\"Rest\"] }",
                "endTime": filterEndTime,
                "f": "json",
                "pageSize": "1000",
                "token": configOptions.agsToken
            },
        });
        serverLogsRequest.then(plotExtents, requestFailed);
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

    // Clears all the graphics from the map
    function clearGraphics() {
        if (map.graphics != undefined) {
            map.graphics.clear();
        }
        currentlyAddedGraphics = [];
    }

    // Get all services for an arcgis server site
    function getAllServices(services,callback) {
        // List of services
        var serviceList = [];
        // When services have been received
        when(getServices(), lang.hitch(this, function (response) {
            // If there is a reponse
            if (response !== undefined) {
                // For each of the services that are in the root in the response
                array.forEach(response.services, function (service) {
                    // If just getting map services
                    if (services == "mapServices") {
                        if (service.type == "MapServer") {
                            // Push name and type into array
                            serviceList.push(service.name + "." + service.type);
                        }
                    }
                        // Else get all services
                    else {
                        serviceList.push(service.name + "." + service.type);
                    }
                });

                // If the services are all in the root
                if (response.folders.length == 0) {
                    // Return list
                    callback(serviceList);
                }
                else {
                    // For each of the folders in the response
                    var folderCount = 0;
                    array.forEach(response.folders, function (folder) {
                        // When services have been received for the folder
                        when(getServices(folder), lang.hitch(this, function (folderServices) {
                            folderCount++;
                            var servicesCount = 0;
                            // For each of the services in the folder
                            array.forEach(folderServices.services, function (service) {                                
                                // If just getting map services
                                if (services == "mapServices") {
                                    if (service.type == "MapServer") {
                                        // Push name and type into array
                                        serviceList.push(service.name + "." + service.type);
                                    }
                                }
                                // Else get all services
                                else {
                                    serviceList.push(service.name + "." + service.type);
                                }
                            });

                            // If finished looping through all folders and services
                            if (folderCount >= response.folders.length) {
                                // Return list
                                callback(serviceList);
                            }
                        }));
                    });
                }
            }
        }));
    }

    // Gets the services for a folder on arcgis server
    function getServices(folder) {
        var dfd = new dojo.Deferred();
        // Request the services
        esri.request({
            url: configOptions.agsSite + "/rest" + (folder ? "/services/" + folder : "/services") + "?token=" + configOptions.agsToken,
            preventCache: true,
            content: { f: "json" },
            handleAs: "json",
            useProxy: false
        }).
        // On response
        then(function (response) {
            dfd.resolve(response);
        },
        // On error
        function (err) {
            dfd.resolve();
        });
        return dfd.promise;
    }

    // Error handler
    function requestFailed(error) {
        console.log("Error: ", error.message);
    }
});
