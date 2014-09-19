// -------------------------------------- Global variables --------------------------------------
// ArcGIS server token for access to the site
var serverToken;
// ArcGIS online/portal token for access to the site
var portalToken;
// Log response returned for a service
var logResponse;
// Log data dictionary
var logData = [
  { text: "Warning", y: 1 },
  { text: "Success", y: 1 },
  { text: "Errors", y: 1 }
];
// End filter for the logs query
var logFilterEndTime;
// Current service selected
var serviceChoice = null;
// Current filter selected
var filterChoice = null;
// Current graphic selected
var graphicChoice = null;
// Type of service selected
var serviceType = null;
// Pie chart
var pieChart = null;
// Pie legend
var pieLegend = null;
// Line chart
var barChart = null;
// Gauges
var gauges = [];
// Feature set holding extent points
var extentFeatures = [];
// Hot spot feature layer
var hotspotLayer = null;

// -------------------------------------- Modules required --------------------------------------
require([
    // Esri modules
    "esri/map",
    "esri/graphic",
    "esri/layers/agstiled",
    "esri/layers/agsdynamic",
    "esri/layers/FeatureLayer",
    "esri/request",

    // Dojo modules
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/when",
    "dojo/Deferred",
    "dojo/dom-construct",
    "dojo/domReady!"
],


// -------------------------------------- Initial function executed when DOM ready --------------------------------------
function (map, graphic, agstiled, agsdynamic, featurelayer, request, lang, array, when, deferred, domConst) {
    // Load the configuration file
    initVariables();

    // Set the title
    document.title = configOptions.title;
    $("#title").text(configOptions.title);

    // Set the description
    $("#siteDescription").text(configOptions.description);

    // Get the current page
    var pagePath = window.location.pathname;
    var currentPage = pagePath.substring(pagePath.lastIndexOf('/') + 1);

    // Setup proxy
    esri.config.defaults.io.proxyUrl = configOptions.proxyUrl;
    esriConfig.defaults.io.alwaysUseProxy = false;

    // Get the token for access to the ArcGIS Server site
    getToken("Server", configOptions.agsSite.url, configOptions.agsSite.username, configOptions.agsSite.password, function (token) {
        // Set the global variable for the server token
        serverToken = token;

        // Load the application
        loadApps();
    });


    // Load application function
    function loadApps() {
        // Popular extents
        if (currentPage.indexOf("PopularExtents") != -1) {
            // Show the progress bar
            $("#appLoadBar").show()

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
            getAllServices("mapServices", function (serviceList) {
                // Add values into filter dropdown
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Hour" + '</a></li>');
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 24 Hours" + '</a></li>');
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Week" + '</a></li>');
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 30 Days" + '</a></li>');
                // Set default selection
                if (configOptions.defaultFilter) {
                    $('.filterSelection').text(configOptions.defaultFilter);
                    filterChoice = configOptions.defaultFilter;
                }
                else {
                    $('.filterSelection').text("Last 24 Hours");
                    filterChoice = "Last 24 Hours";
                }

                // Add values into graphic dropdown
                $("#graphicDropdown").append('<li><a href="#graphicDropdown">' + "Polygon" + '</a></li>');
                $("#graphicDropdown").append('<li><a href="#graphicDropdown">' + "Point" + '</a></li>');

                // If hot spot is enabled
                if (configOptions.hotSpotAnalysisService.enable === "true" || configOptions.hotSpotAnalysisService.enable === true) {
                    $("#graphicDropdown").append('<li><a href="#graphicDropdown">' + "Hot Spot" + '</a></li>');
                }

                // Set default selection
                if (configOptions.defaultGraphic) {
                    $('.graphicSelection').text(configOptions.defaultGraphic);
                    graphicChoice = configOptions.defaultGraphic;
                }
                else {
                    $('.graphicSelection').text("Polygon");
                    graphicChoice = "Polygon";
                }

                // Add values into services dropdown
                var count = 0;
                array.forEach(serviceList, function (service) {
                    // Get info for the service
                    when(getServiceInfo(service), lang.hitch(this, function (response) {
                        count++;
                        // If not cached add to list
                        if (response.properties.isCached == "false") {
                            $("#servicesDropdown").append('<li><a href="#servicesDropdown">' + service + '</a></li>');
                        }

                        // When adding the last service
                        if (count == serviceList.length) {
                            // Set default selection
                            if (configOptions.defaultService) {
                                $('.servicesSelection').text(configOptions.defaultService);
                                serviceChoice = configOptions.defaultService;
                            }
                            else {
                                // Set the first service in the list
                                $('.servicesSelection').text(serviceList[0]);
                                serviceChoice = serviceList[0];
                            }

                            // Scan the logs and plot the extents
                            scanLogs();

                            // On change handler for services dropdown
                            $('.servicesDropdown li > a').click(function (e) {
                                // Reset log response
                                logResponse = null;

                                // Show the progress bar
                                $("#appLoadBar").show();

                                // Update dropdown and selection
                                $('.servicesSelection').text(this.innerHTML);
                                serviceChoice = this.innerHTML;

                                // Clear previous graphics
                                clearGraphics();

                                // Scan the logs and plot the extents
                                scanLogs();
                            });
                            // On change handler for filter dropdown
                            $('.filterDropdown li > a').click(function (e) {
                                // Reset log response
                                logResponse = null;

                                // Show the progress bar
                                $("#appLoadBar").show();

                                // Update dropdown and selection
                                $('.filterSelection').text(this.innerHTML);
                                filterChoice = this.innerHTML;

                                // Clear previous graphics
                                clearGraphics();

                                // Scan the logs and plot the extents
                                scanLogs();
                            });
                            // On change handler for graphic dropdown
                            $('.graphicDropdown li > a').click(function (e) {
                                // Reset log response
                                logResponse = null;

                                // Show the progress bar
                                $("#appLoadBar").show();

                                // Update dropdown and selection
                                $('.graphicSelection').text(this.innerHTML);
                                graphicChoice = this.innerHTML;

                                // Clear previous graphics
                                clearGraphics();

                                // Scan the logs and plot the extents
                                scanLogs();
                            });
                        }
                    }));

                });

            });
        }

        // Services performance
        if ((currentPage.indexOf("ServicesPerformance") != -1) | (currentPage.length == 0)) {
            // Show the progress bar and hide the graphs
            $("#appLoadBar").show();
            $("#logRecordsPieChartContainer").css('display', 'none');
            $("#processTimeGaugeContainer").css('display', 'none');
            $("#drawTimeGaugeContainer").css('display', 'none');
            $("#availabilityContainer").css('display', 'none');

            // Get a list of services
            getAllServices("all", function (serviceList) {
                // Add values into filter dropdown
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Hour" + '</a></li>');
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 24 Hours" + '</a></li>');
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Week" + '</a></li>');
                $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 30 Days" + '</a></li>');
                // Set default selection
                if (configOptions.defaultFilter) {
                    $('.filterSelection').text(configOptions.defaultFilter);
                    filterChoice = configOptions.defaultFilter;
                }
                else {
                    $('.filterSelection').text("Last 24 Hours");
                    filterChoice = "Last 24 Hours";
                }

                // Add values into services dropdown
                array.forEach(serviceList, function (service) {
                    $("#servicesDropdown").append('<li><a href="#servicesDropdown">' + service + '</a></li>');
                });
                // Set default selection
                if (configOptions.defaultService) {
                    $('.servicesSelection').text(configOptions.defaultService);
                    serviceChoice = configOptions.defaultService;
                }
                else {
                    // Set the first service in the list
                    $('.servicesSelection').text(serviceList[0]);
                    serviceChoice = serviceList[0];
                }

                // Get status for service
                when(getServiceStatus(serviceChoice), lang.hitch(this, function (response) {
                    $("#availabilityContainer").css('display', 'block');

                    if (response.realTimeState == "STARTED") {
                        // Add the success label class and update text
                        $('#serviceStatus').text("Status - Started");
                        $("#serviceStatus").removeClass().addClass('label label-success');
                    }
                    else {
                        // Add the danger label class and update text
                        $('#serviceStatus').text("Status - Stopped");
                        $("#instancesAvailable").removeClass().addClass('label label-danger');
                    }
                }));

                // Get info for the service
                when(getServiceInfo(serviceChoice), lang.hitch(this, function (response) {
                    $("#availabilityContainer").css('display', 'block');

                    // Update cache information
                    if (response.properties.isCached != null) {
                        if (response.properties.isCached == "true") {
                            $('#cacheStatus').text("Cached Map Service");
                            serviceType = "MapServerCached";
                        }
                        if (response.properties.isCached == "false") {
                            $('#cacheStatus').text("Dynamic Map Service");
                            serviceType = "MapServer";
                        }
                    }
                    else {
                        $('#cacheStatus').text("ArcGIS Service");
                        serviceType = "OtherServer";
                    }

                    // Get available instances for the service
                    getServiceInstances(serviceChoice, function (service) {
                        $("#availabilityContainer").css('display', 'block');

                        $('#maxInstances').text("Maximum Instances - " + service.maxInstances);
                        $('#instancesAvailable').text("Instances Available - " + service.freeInstances);

                        if (service.freeInstances > 0) {
                            // Add the success label class
                            $("#instancesAvailable").removeClass().addClass('label label-success');
                        }
                        else {
                            // Add the danger label class
                            $("#instancesAvailable").removeClass().addClass('label label-danger');
                        }
                    });

                    // Scan the logs
                    scanLogs();

                    // On change handler for services dropdown
                    $('.servicesDropdown li > a').click(function (e) {
                        // Reset log response
                        logResponse = null;

                        // Show the progress bar and hide the graphs
                        $("#appLoadBar").show();
                        $("#availabilityContainer").css('display', 'none');
                        $("#logRecordsPieChartContainer").css('display', 'none');
                        $("#processTimeGaugeContainer").css('display', 'none');
                        $("#drawTimeGaugeContainer").css('display', 'none');
                        $("#queryTimeGaugeContainer").css('display', 'none');

                        // Update dropdown and selection
                        $('.servicesSelection').text(this.innerHTML);
                        serviceChoice = this.innerHTML;

                        // Clear previous graphics
                        clearGraphics();

                        // Get status for service
                        when(getServiceStatus(serviceChoice), lang.hitch(this, function (response) {
                            $("#availabilityContainer").css('display', 'block');

                            if (response.realTimeState == "STARTED") {
                                // Add the success label class and update text
                                $('#serviceStatus').text("Status - Started");
                                $("#serviceStatus").removeClass().addClass('label label-success');
                            }
                            else {
                                // Add the danger label class and update text
                                $('#serviceStatus').text("Status - Stopped");
                                $("#instancesAvailable").removeClass().addClass('label label-danger');
                            }
                        }));

                        // Get info for the service
                        when(getServiceInfo(serviceChoice), lang.hitch(this, function (response) {
                            $("#availabilityContainer").css('display', 'block');

                            // Update cache information
                            if (response.properties.isCached != null) {
                                if (response.properties.isCached == "true") {
                                    $('#cacheStatus').text("Cached Map Service");
                                    serviceType = "MapServerCached";
                                }
                                if (response.properties.isCached == "false") {
                                    $('#cacheStatus').text("Dynamic Map Service");
                                    serviceType = "MapServer";
                                }
                            }
                            else {
                                $('#cacheStatus').text("ArcGIS Service");
                                serviceType = "OtherServer";
                            }

                            // Get available instances for the service
                            getServiceInstances(serviceChoice, function (service) {
                                $("#availabilityContainer").css('display', 'block');

                                $('#maxInstances').text("Maximum Instances - " + service.maxInstances);
                                $('#instancesAvailable').text("Instances Available - " + service.freeInstances);

                                if (service.freeInstances > 0) {
                                    // Add the success label class
                                    $("#instancesAvailable").removeClass().addClass('label label-success');
                                }
                                else {
                                    // Add the danger label class
                                    $("#instancesAvailable").removeClass().addClass('label label-danger');
                                }
                            });

                            // Scan the logs
                            scanLogs();

                        }));
                    });

                    // On change handler for filter dropdown
                    $('.filterDropdown li > a').click(function (e) {
                        // Reset log response
                        logResponse = null;

                        // Show the progress bar and hide the graphs
                        $("#appLoadBar").show();
                        $("#availabilityContainer").css('display', 'none');
                        $("#logRecordsPieChartContainer").css('display', 'none');
                        $("#processTimeGaugeContainer").css('display', 'none');
                        $("#drawTimeGaugeContainer").css('display', 'none');
                        $("#queryTimeGaugeContainer").css('display', 'none');

                        // Update dropdown and selection
                        $('.filterSelection').text(this.innerHTML);
                        filterChoice = this.innerHTML;

                        // Clear previous graphics
                        clearGraphics();

                        // Get status for service
                        when(getServiceStatus(serviceChoice), lang.hitch(this, function (response) {
                            $("#availabilityContainer").css('display', 'block');

                            if (response.realTimeState == "STARTED") {
                                // Add the success label class and update text
                                $('#serviceStatus').text("Status - Started");
                                $("#serviceStatus").removeClass().addClass('label label-success');
                            }
                            else {
                                // Add the danger label class and update text
                                $('#serviceStatus').text("Status - Stopped");
                                $("#instancesAvailable").removeClass().addClass('label label-danger');
                            }
                        }));

                        // Get info for the service
                        when(getServiceInfo(serviceChoice), lang.hitch(this, function (response) {
                            $("#availabilityContainer").css('display', 'block');

                            // Update cache information
                            if (response.properties.isCached != null) {
                                if (response.properties.isCached == "true") {
                                    $('#cacheStatus').text("Cached Map Service");
                                    serviceType = "MapServerCached";
                                }
                                if (response.properties.isCached == "false") {
                                    $('#cacheStatus').text("Dynamic Map Service");
                                    serviceType = "MapServer";
                                }
                            }
                            else {
                                $('#cacheStatus').text("ArcGIS Service");
                                serviceType = "OtherServer";
                            }

                            // Get available instances for the service
                            getServiceInstances(serviceChoice, function (service) {
                                $("#availabilityContainer").css('display', 'block');

                                $('#maxInstances').text("Maximum Instances - " + service.maxInstances);
                                $('#instancesAvailable').text("Instances Available - " + service.freeInstances);

                                if (service.freeInstances > 0) {
                                    // Add the success label class
                                    $("#instancesAvailable").removeClass().addClass('label label-success');
                                }
                                else {
                                    // Add the danger label class
                                    $("#instancesAvailable").removeClass().addClass('label label-danger');
                                }
                            });

                            // Scan the logs
                            scanLogs();
                        }));
                    });
                }));
            });
        }

        // Services usage
        if (currentPage.indexOf("ServicesUsage") != -1) {
            // Show the progress bar and hide the graphs
            $("#appLoadBar").show();
            $("#serviceUseContainer").css('display', 'none');
            $("#exportCSV").css('display', 'none');

            // Get a list of services
            getAllServices("mapServices", function (serviceList) {
                // Add values into services dropdown
                var count = 0;
                array.forEach(serviceList, function (service) {
                    // Get info for the service
                    when(getServiceInfo(service), lang.hitch(this, function (response) {
                        count++;
                        // If not cached add to list
                        if (response.properties.isCached == "false") {
                            $("#servicesDropdown").append('<li><a href="#servicesDropdown">' + service + '</a></li>');
                        }

                        // When adding the last service
                        if (count == serviceList.length) {
                            // Set default selection
                            if (configOptions.defaultService) {
                                $('.servicesSelection').text(configOptions.defaultService);
                                serviceChoice = configOptions.defaultService;
                            }
                            else {
                                // Set the first service in the list
                                $('.servicesSelection').text(serviceList[0]);
                                serviceChoice = serviceList[0];
                            }

                            // Set the filter choice to last 30 days
                            filterChoice = "Last 30 Days"

                            // Scan the logs
                            scanLogs();

                            // On change handler for services dropdown
                            $('.servicesDropdown li > a').click(function (e) {
                                // Reset log response
                                logResponse = null;

                                // Show the progress bar and hide the graphs
                                $("#appLoadBar").show();
                                $("#serviceUseContainer").css('display', 'none');

                                // Update dropdown and selection
                                $('.servicesSelection').text(this.innerHTML);
                                serviceChoice = this.innerHTML;

                                // Scan the logs
                                scanLogs();
                            });
                        }

                    }));
                });
            });


            // Setup the Export to CSV click handler
            $("#exportCSV").click(function () {
                // Call function to exports logs to CSV
                exportCSV();
            });
        }
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get all services for an arcgis server site
    function getAllServices(services, callback) {
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
                            serviceList.push(service.serviceName + "." + service.type);
                        }
                    }
                        // Else get all services
                    else {
                        serviceList.push(service.serviceName + "." + service.type);
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
                                        serviceList.push(service.folderName + "/" + service.serviceName + "." + service.type);
                                    }
                                }
                                    // Else get all services
                                else {
                                    serviceList.push(service.folderName + "/" + service.serviceName + "." + service.type);
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
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Scans the arcgis server logs
    function scanLogs() {
        var totalProcessTime = 0;
        var totalDrawTime = 0;
        var totalQueryTime = 0;
        var averageProcessTime = 0;
        var averageDrawTime = 0;
        var averageQueryTime = 0;
        var requestCount = 0;
        var drawRequestCount = 0;
        var queryRequestCount = 0;
        var warnTotal = 0;
        var errTotal = 0;
        var sucTotal = 0;

        // Get current unix time
        var currentUnixTime = (new Date).getTime();

        // When logs have been returned
        when(getLogs(currentUnixTime), lang.hitch(this, function (logResult) {
            // Get the logs and store in global variable
            var logs = logResult["logMessages"];

            // Popular extents
            if (currentPage.indexOf("PopularExtents") != -1) {
                // For each of the logs
                for (var i = 0; i < logs.length; i++) {
                    var record = logs[i];
                    var message = record["message"];
                    // Get the records that have extent in them
                    if (message.search("Extent:") >= 0) {
                        // Add graphic to map
                        addGraphic(message);
                        // Add to request counter
                        drawRequestCount++;
                    }
                }

                // If graphic to be shown is hot spot
                if (graphicChoice == "Hot Spot") {
                    // Request a token for the service if secure
                    if (configOptions.hotSpotAnalysisService.secure === "true" || configOptions.hotSpotAnalysisService.secure === true) {
                        getToken("Portal", configOptions.hotSpotAnalysisService.tokenURL, configOptions.hotSpotAnalysisService.username, configOptions.hotSpotAnalysisService.password, function (token) {
                            // Set the global variable for the portal token
                            portalToken = token;

                            var extentFeatureSet = new esri.tasks.FeatureSet();
                            extentFeatureSet.geometryType = "esriGeometryPoint";
                            extentFeatureSet.spatialReference = map.spatialReference;
                            extentFeatureSet.features = extentFeatures;
                            var extentFeatureSetJSON = dojo.toJson(extentFeatureSet.toJson());

                            var extentFeatureCollection = "{\"layerDefinition\": {\"geometryType\": \"esriGeometryPoint\",\"fields\": [{\"name\": \"Id\",\"type\": \"esriFieldTypeOID\",\"alias\": \"Id\"}]},\"featureSet\": " + extentFeatureSetJSON + "}";

                            // Setup the hotspot task and parameters
                            hotSpotAnalysisTask = new esri.tasks.Geoprocessor(configOptions.hotSpotAnalysisService.url + "?token=" + portalToken);
                            var params = {
                                "analysisLayer": extentFeatureCollection
                            };

                            // Submit the hot spot analysis tool task
                            hotSpotAnalysisTask.submitJob(params, function (jobInfo) {
                                completeCallback(jobInfo, token);
                            });

                        });

                        // When task is complete
                        function completeCallback(jobInfo, token) {
                            // If job completed successfully
                            if (jobInfo.jobStatus !== "esriJobFailed") {
                                // Get the result
                                esri.request({
                                    url: configOptions.hotSpotAnalysisService.url + "/jobs/" + jobInfo.jobId + "/results/hotSpotsResultLayer",
                                    preventCache: true,
                                    content: {
                                        "token": portalToken,
                                        "f": "json"
                                    },
                                    handleAs: "json",
                                    useProxy: false
                                }).
                                // On response
                                then(function (response) {
                                    if (response.value) {
                                        // Log feature collection response
                                        console.log("Hot spot analysis response:");
                                        console.log(response.value);

                                        // Setup feature layer
                                        hotspotLayer = new featurelayer(response.value, {
                                            id: "resultLayer"
                                        });

                                        // Add layer to map
                                        map.addLayer(hotspotLayer);
                                    }

                                    // Update draw request count
                                    $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                    // Hide the progress bar
                                    $("#appLoadBar").hide();
                                    $("#progressbarText").text("");
                                    $("#progressbarLogsText").text("");
                                },
                                // On error
                                function (err) {
                                    // Update draw request count
                                    $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                    // Hide the progress bar
                                    $("#appLoadBar").hide();
                                    $("#progressbarText").text("");
                                    $("#progressbarLogsText").text("");
                                });


                                // Update draw request count
                                $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                // Hide the progress bar
                                $("#appLoadBar").hide();
                                $("#progressbarText").text("");
                                $("#progressbarLogsText").text("");
                            }
                                // If failed
                            else {
                                console.log("There was an error:");
                                console.log(jobInfo.messages[0].description);

                                // Update draw request count
                                $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                // Hide the progress bar
                                $("#appLoadBar").hide();
                                $("#progressbarText").text("");
                                $("#progressbarLogsText").text("");
                            }
                        }
                    }
                }
                else {
                    // Update draw request count
                    $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                    // Hide the progress bar
                    $("#appLoadBar").hide();
                    $("#progressbarText").text("");
                    $("#progressbarLogsText").text("");
                }
            }

            // Services performance
            if ((currentPage.indexOf("ServicesPerformance") != -1) | (currentPage.length == 0)) {
                // For each record in the logs
                for (var i = 0; i < logs.length; i++) {
                    var record = logs[i];
                    var message = record["message"];

                    // Get the records that request the service
                    if (message.search("request successfully processed") >= 0) {
                        // Add to process time
                        totalProcessTime = totalProcessTime + parseFloat(record["elapsed"]);

                        // Add to process counter
                        requestCount++;
                    }

                    // Get the records that export map image (draw) on the service
                    if (message.search("End ExportMapImage") >= 0) {
                        // Add to total draw time
                        totalDrawTime = totalDrawTime + parseFloat(record["elapsed"]);

                        // Add to request counter
                        drawRequestCount++;
                    }

                    // Get the records that execute a query, find or identify on the service
                    if ((message.search("End Query") >= 0) | (message.search("End Find") >= 0) | (message.search("End Identify") >= 0)) {
                        // Add to total draw time
                        totalQueryTime = totalQueryTime + parseFloat(record["elapsed"]);

                        // Add to request counter
                        queryRequestCount++;
                    }

                    // Get message type
                    if (record.type === "WARNING") {
                        // Add to warning counter
                        warnTotal++;
                    }
                    if (record.type === "SEVERE") {
                        // Add to error counter
                        errTotal++;
                    }
                    if (record.type === "INFO") {
                        // Add to success counter
                        sucTotal++;
                    }
                    if (record.type === "FINE") {
                        // Add to success counter
                        sucTotal++;
                    }
                }

                // Update log data dictionary
                logData[0] = ({ text: "Warning - " + commaSeparateNumber(warnTotal), y: warnTotal, tooltip: "Number of Warnings - " + warnTotal });
                logData[1] = ({ text: "Success - " + commaSeparateNumber(sucTotal), y: sucTotal, tooltip: "Number of Successes - " + sucTotal });
                logData[2] = ({ text: "Errors - " + commaSeparateNumber(errTotal), y: errTotal, tooltip: "Number of Errors - " + errTotal });

                // Get the total log records
                var totalLogRecords = commaSeparateNumber(parseInt(sucTotal) + parseInt(warnTotal) + parseInt(errTotal));

                // Get the average process time
                averageProcessTime = totalProcessTime / requestCount;
                if (isNaN(averageProcessTime)) {
                    averageProcessTime = 0;
                }

                // Get the average draw time
                averageDrawTime = totalDrawTime / drawRequestCount;
                if (isNaN(averageDrawTime)) {
                    averageDrawTime = 0;
                }

                // Get the average query time
                averageQueryTime = totalQueryTime / queryRequestCount;
                if (isNaN(averageQueryTime)) {
                    averageQueryTime = 0;
                }

                // Update log records count
                $("#totalLogRecords").text("Number of records logged - " + totalLogRecords);

                // Update request count
                $("#totalRequests").text("Number of requests - " + commaSeparateNumber(requestCount));

                // Update average process time
                $("#averageProcessTime").text("Average Process Time (seconds) - " + averageProcessTime.toFixed(2));

                // Update draw request count
                $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));

                // Update average draw time
                $("#averageDrawTime").text("Average Draw Time (seconds) - " + averageDrawTime.toFixed(2));

                // Update query request count
                $("#totalQueries").text("Number of query requests - " + commaSeparateNumber(queryRequestCount));

                // Update average query time
                $("#averageQueryTime").text("Average Query Time (seconds) - " + averageQueryTime.toFixed(2));

                // If pie chart hasn't been created - Log records pie chart
                if (!pieChart) {
                    // Show log records for all services
                    // Create the pie chart for log records
                    createPieChart("logRecordsPieChart", logData);
                    // Show the chart
                    $("#logRecordsPieChartContainer").css('display', 'block');
                }
                // Update pie chart
                else {
                    // Show log records for all services
                    pieChart.updateSeries("report", logData);
                    pieChart.render();
                    pieLegend.refresh();
                    // Show the chart
                    $("#logRecordsPieChartContainer").css('display', 'block');
                }

                // If gauge hasn't been created yet - Process time gauge
                if (!gauges[0]) {
                    // Show process time for all services
                    // Create the gauge for average requests
                    createGauge("processTimeGauge", averageProcessTime);
                    // Show the chart
                    $("#processTimeGaugeContainer").css('display', 'block');                    
                }
                // Update gauge
                else {
                    // Show process time for all services
                    gauges[0].indicators[0].value = averageProcessTime;
                    gauges[0].startup();
                    // Show the chart
                    $("#processTimeGaugeContainer").css('display', 'block');
                }

                // If gauge hasn't been created yet - Draw time gauge
                if (!gauges[1]) {
                    // Only show draw time for dynamic map services
                    if (serviceType == "MapServer") {
                        // Create the gauge for average draw time
                        createGauge("drawTimeGauge", averageDrawTime);
                        // Show the chart
                        $("#drawTimeGaugeContainer").css('display', 'block');
                    }
                }
                // Update gauge
                else {
                    // Only show draw time for dynamic map services
                    if (serviceType == "MapServer") {
                        gauges[1].indicators[0].value = averageDrawTime;
                        gauges[1].startup();
                        // Show the chart
                        $("#drawTimeGaugeContainer").css('display', 'block');
                    }
                }

                // If gauge hasn't been created yet - Query time gauge
                if (!gauges[2]) {
                    // Only show query time for map services
                    if ((serviceType == "MapServer") | (serviceType == "MapServerCached")) {
                        // Create the gauge for average draw time
                        createGauge("queryTimeGauge", averageQueryTime);
                        // Show the chart
                        $("#queryTimeGaugeContainer").css('display', 'block');
                    }
                }
                // Update gauge
                else {
                    // Only show query time for map services
                    if ((serviceType == "MapServer") | (serviceType == "MapServerCached")) {
                        gauges[2].indicators[0].value = averageQueryTime;
                        gauges[2].startup();
                        // Show the chart
                        $("#queryTimeGaugeContainer").css('display', 'block');
                    }
                }

                // Hide the progress bar
                $("#appLoadBar").hide();
                $("#progressbarText").text("");
                $("#progressbarLogsText").text("");
            }

            // Services usage
            if (currentPage.indexOf("ServicesUsage") != -1) {
                // Array to hold draw records for past 30 days
                var chartData = [];
                var dateData = [];

                // Set each of the days to zero
                for (var i = 0; i < 30; i++) {
                    chartData[i] = 0;
                }

                // For each of the logs
                for (var i = 0; i < logs.length; i++) {
                    var record = logs[i];
                    var message = record["message"];

                    // Get current unix time
                    var unixTime = (new Date).getTime();

                    // Get the records that request a draw
                    if (message.search("End ExportMapImage") >= 0) {
                        // Get the chart day
                        var timeSince = unixTime - record.time;
                        var day = 86400 * 1000;
                        var chartDay = parseFloat(timeSince / day);
                        var firstDigit = chartDay.toString().split(".");

                        // Add count to chart data array
                        chartData[firstDigit[0]]++;
                    }
                }

                // If bar chart hasn't been created

                if (!barChart) {
                    // Show the chart
                    $("#serviceUseContainer").css('display', 'block');

                    // Create the bar chart for requests
                    createBarChart("servicesUseChart", chartData, function () {
                        barChart.updateSeries("Number of Draw Requests", chartData);

                        // Update x-axis
                        var labels = [];
                        for (var i = 0; i < chartData.length; i++) {
                            // Get current unix time
                            var unixTime = (new Date).getTime();
                            // Get the day
                            var day = 86400 * 1000;

                            // Setup label
                            var unixTimeLabel = new Date(unixTime - ((i + 1) * day));
                            var year = unixTimeLabel.getFullYear();
                            var month = unixTimeLabel.getMonth();
                            var date = unixTimeLabel.getDate();

                            labels.push({ value: i + 1, text: date + "/" + (month + 1) + "/" + year });
                        }
                        barChart.addAxis("x", {
                            labels: labels,
                            title: 'Date',
                            titleOrientation: 'away'
                        });

                        barChart.render();

                        // Hide the progress bar
                        $("#appLoadBar").hide();
                        $("#progressbarText").text("");
                        $("#progressbarLogsText").text("");

                        // Display Export to CSV button
                        $("#exportCSV").css('display', 'block');
                    });

                }
                // Update chart
                else {
                    // Show the chart
                    $("#serviceUseContainer").css('display', 'block');

                    barChart.updateSeries("Number of Draw Requests", chartData);

                    // Update x-axis
                    var labels = [];
                    for (var i = 0; i < chartData.length; i++) {
                        // Get current unix time
                        var unixTime = (new Date).getTime();
                        // Get the day
                        var day = 86400 * 1000;

                        // Setup label
                        var unixTimeLabel = new Date(unixTime - ((i + 1) * day));
                        var year = unixTimeLabel.getFullYear();
                        var month = unixTimeLabel.getMonth();
                        var date = unixTimeLabel.getDate();

                        labels.push({ value: i + 1, text: date + "/" + (month + 1) + "/" + year });
                    }
                    barChart.addAxis("x", {
                        labels: labels,
                        title: 'Date',
                        titleOrientation: 'away'
                    });

                    barChart.render();

                    // Hide the progress bar
                    $("#appLoadBar").hide();
                    $("#progressbarText").text("");
                    $("#progressbarLogsText").text("");

                    // Display Export to CSV button
                    $("#exportCSV").css('display', 'block');
                }
            }
        }));
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get instances for a service
    function getServiceInstances(service, callback) {
        var instanceList;

        // Get stats for the service
        when(getServiceStatistics(service), lang.hitch(this, function (response) {
            // Get Instance usage and push into list
            instanceList = { maxInstances: response.summary.max, freeInstances: response.summary.free, initializingInstances: response.summary.initializing, notCreatedInstances: response.summary.notCreated };

            callback(instanceList);
        }));
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Add graphic to map
    function addGraphic(logMessage) {
        var extent = logMessage.replace("Extent:", "");
        // Get the coordinates
        var coords = extent.split(",");
        // Get the symbology
        var polygonSymbol = configOptions.polygonSymbol;
        var sr = new esri.SpatialReference({
            wkid: configOptions.spatialReference.WKID
        })
        var extent = new esri.geometry.Extent(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2]), parseFloat(coords[3]), sr);

        // If graphic to be shown is polygon
        if (graphicChoice == "Polygon") {
            // Add polygon graphic to map
            map.graphics.add(new esri.Graphic(extent, polygonSymbol));
        }
        // If graphic to be shown is point
        if (graphicChoice == "Point") {
            // Get center point of polygon
            var centerPointCoords = extent.getCenter();
            // Get the symbology
            var pointSymbol = configOptions.pointSymbol;
            // Add point graphic to map
            map.graphics.add(new esri.Graphic(centerPointCoords, pointSymbol));
        }
        // If graphic to be shown is hot spot
        if (graphicChoice == "Hot Spot") {
            // Get center point of polygon
            var centerPointCoords = extent.getCenter();
            // Get the symbology
            var pointSymbol = configOptions.pointSymbol;

            // Setup graphic
            var graphic = new esri.Graphic(centerPointCoords, pointSymbol);
            // Push graphic into features
            extentFeatures.push(graphic);
        }
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Clears all the graphics from the map
    function clearGraphics() {
        // Clear graphics
        if (map.graphics != undefined) {
            map.graphics.clear();
        }
        // Clear hot spot layer
        if (hotspotLayer != null) {
            map.removeLayer(hotspotLayer)
            hotspotLayer = null;
            extentFeatures = [];
        }
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Create gauge
    function createGauge(node, gaugeData) {
        require([
            // Dojo modules
            "dojox/gauges/AnalogGauge",
            "dojox/gauges/AnalogArrowIndicator"
        ],
        function () {
            // Set the ranges
            var range = [
              {
                  low: 0.0, high: 0.5,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#7FFF00'
                      }]
                  }
              },
              {
                  low: 0.5, high: 1,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#7FFF00'
                      }]
                  }
              },
              {
                  low: 1, high: 1.5,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#E0BC1B'
                      }]
                  }
              },
              {
                  low: 1.5, high: 2,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#E01E1B'
                      }]
                  }
              }
            ];

            // Create the gauge
            var gauge = new dojox.gauges.AnalogGauge({
                id: node,
                width: 350,
                height: 200,
                cy: 175,
                radius: 125,
                background: "transparent",
                ranges: range,
                minorTicks: {
                    offset: 125,
                    interval: 0.25,
                    length: 4
                },
                majorTicks: {
                    offset: 125,
                    interval: 0.5,
                    length: 4
                },
                indicators: [
                  new dojox.gauges.AnalogArrowIndicator({
                      value: 0,
                      width: 5,
                      title: "val",
                      noChange: true
                  })
                ]
            }, dojo.byId(node));

            // Set the gague value
            gauge.indicators[0].value = gaugeData;

            // Start the gauge
            gauge.startup();

            // Push gauge into global array
            gauges.push(gauge);

            return gauge;
        });
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Create pie chart
    function createPieChart(node, chartData) {
        require([
            "dojox/charting/Chart",
            "dojox/charting/plot2d/Pie",
            "dojox/charting/widget/Legend",
            "dojox/charting/themes/Tom",
            "dojox/charting/action2d/Highlight",
            "dojox/charting/action2d/Tooltip",
            "dojox/charting/plot2d/Lines",
            "dojox/charting/plot2d/Markers",
            "dojox/charting/axis2d/Default"
        ],
        function (chart, pie, legend, theme, highlight, tooltip, lines, markers, axisdefault) {
            // Create the pie chart
            pieChart = new chart(dojo.byId(node));

            // Set the theme
            theme.chart.fill = "transparent";
            theme.plotarea.fill = "transparent";
            pieChart.setTheme(theme);

            pieChart.addPlot("default", {
                title: "Records Logged",
                type: pie,
                font: "bold bold 8pt Tahoma",
                stroke: { color: "blue", width: 0 },
                radius: 120,
                style: "font-size: 14px;",
                fontColor: "#000",
                labelOffset: -20,
                labelStyle: "rows",
                labels: false
            });
            new tooltip(pieChart, "default");

            pieChart.addSeries("report", chartData);
            pieChart.render();

            pieLegend = new legend({
                chart: pieChart,
                horizontal: true,
                outline: true,
                style: "font-size: 14px;"
            }, "logRecordsPieLegend");

            pieLegend.startup();

            return pieChart;
        });
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Create line chart
    function createBarChart(node, chartData, callback) {
        require([
            "dojox/charting/Chart",
            "dojox/charting/themes/Renkoo",
            "dojox/charting/plot2d/Columns",
            "dojox/charting/action2d/Tooltip",
            "dojox/charting/plot2d/Lines",
            "dojox/charting/plot2d/Markers",
            "dojox/charting/axis2d/Default"
        ],
        function (chart, theme, columnsplot, tooltip, lines, markers, axisdefault) {
            barChart = new chart(dojo.byId(node), {
            });

            // Set the theme
            theme.chart.fill = "transparent";
            theme.plotarea.fill = "transparent";
            barChart.setTheme(theme);

            // Add the only/default plot
            barChart.addPlot("default", {
                type: columnsplot,
                markers: true,
                gap: 5
            });

            // Add axes
            barChart.addAxis("x",
            {
                title: 'Date',
                titleOrientation: 'away'
            });

            barChart.addAxis("y",
            {
                title: 'Number of Draw Requests',
                vertical: true,
                fixLower: "major",
                fixUpper: "major"
            });

            // Add the series of data
            barChart.addSeries("Daily Draw Requests", chartData);

            // Render the chart
            barChart.render();

            callback(barChart);
        });
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Add commas to number
    function commaSeparateNumber(val) {
        while (/(\d+)(\d{3})/.test(val.toString())) {
            val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
        }
        return val;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Export logs to CSV
    function exportCSV() {
        // Get the log messages
        var logs = logResponse["logMessages"];

        // Setup array for CSV data and set headers
        var csvData = [["Time", "Draw Time"]];

        // For each record in the logs
        for (var i = 0; i < logs.length; i++) {
            var record = logs[i];
            var message = record["message"];

            // Get the records that export map image (draw) on the service
            if (message.search("End ExportMapImage") >= 0) {
                // Get time
                var unixTime = parseFloat(record["time"]);
                var unixDate = new Date(unixTime);
                var year = unixDate.getFullYear();
                var month = unixDate.getMonth();
                var date = unixDate.getDate();
                var hours = unixDate.getHours();
                var minutes = unixDate.getMinutes();
                var seconds = unixDate.getSeconds();
                var formattedTime = hours + ':' + minutes + ':' + seconds;
                var time = date + "/" + (month + 1) + "/" + year + " at " + formattedTime;

                // Get draw time
                var drawTime = parseFloat(record["elapsed"]);

                // Push values into array
                csvData.push([time, drawTime]);
            }
        }

        // Setup CSV content
        var csvContent = "data:text/csv;charset=utf-8,";

        csvData.forEach(function (infoArray, index) {
            dataString = infoArray.join(",");
            csvContent = csvContent + dataString + "\n"
        });

        // Encode the csv URI
        var encodedUri = encodeURI(csvContent);
        // Create the link
        var link = document.createElement("a");

        // Download the CSV
        var csvFilename = serviceChoice + ".csv";
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", csvFilename);
        link.click();
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get the arcgis server logs
    function getLogs(startUnixTime) {
        var dfd = new deferred();

        // If this is the first logging query for this service
        if (!logResponse) {
            // Set the end date filter for the query
            if (filterChoice == "Last Hour") {
                logFilterEndTime = startUnixTime - (3600 * 1000);
            }
            if (filterChoice == "Last 24 Hours") {
                logFilterEndTime = startUnixTime - (86400 * 1000);
            }
            if (filterChoice == "Last Week") {
                logFilterEndTime = startUnixTime - (604800 * 1000);
            }
            if (filterChoice == "Last 30 Days") {
                logFilterEndTime = startUnixTime - (2592000 * 1000);
            }
        }

        // Get the from date and time - convert from unix time and log
        var unixDate = new Date(startUnixTime);
        var year = unixDate.getFullYear();
        var month = unixDate.getMonth();
        var date = unixDate.getDate();
        var hours = unixDate.getHours();
        var minutes = unixDate.getMinutes();
        var seconds = unixDate.getSeconds();
        var formattedTime = hours + ':' + minutes + ':' + seconds;
        console.log("ArcGIS Server logs query showing from " + date + "/" + (month + 1) + "/" + year + " at " + formattedTime);    

        // Request the logs
        esri.request({
            url: configOptions.agsSite.url + "/admin/logs/query",
            preventCache: true,
            content: {
                "token": serverToken,
                "level": "FINE",
                "filter": "{ \"services\": [\"" + serviceChoice + "\"], \"machines\": \"*\"}",
                "startTime": startUnixTime,
                "endTime": logFilterEndTime,
                "f": "json",
                "pageSize": "10000"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            // If this is the first logging query for this service
            if (!logResponse) {
                // Set the global response variable
                logResponse = response;
            }
            // Otherwise
            else {
                // For each record in the logs  
                for (var i = 0; i < response["logMessages"].length; i++) {
                    // Push log into existing log response object
                    logResponse["logMessages"].push(response["logMessages"][i]);
                }
            }

            // Get the logs
            var logs = response["logMessages"];
            // For each record in the logs  
            for (var i = 0; i < logs.length; i++) {
                // When at the last record
                if (i == (logs.length-1)) {
                    // Get the time for the record
                    var record = logs[i];
                    var lastRecordDate = record["time"];

                    // Get the to date and time - convert from unix time and log
                    var unixTimeEnd = lastRecordDate;
                    var unixDate = new Date(unixTimeEnd);
                    var year = unixDate.getFullYear();
                    var month = unixDate.getMonth();
                    var date = unixDate.getDate();
                    var hours = unixDate.getHours();
                    var minutes = unixDate.getMinutes();
                    var seconds = unixDate.getSeconds();
                    var formattedTime = hours + ':' + minutes + ':' + seconds;
                    console.log("ArcGIS Server logs query to (Last log record found to filter set) " + date + "/" + (month + 1) + "/" + year + " at " + formattedTime);

                    // If there are more logs i.e. Have hit the 10,000 logs in one query limit
                    if (response.hasMore === "true" || response.hasMore === true) {
                        console.log("Querying logs...");
                        console.log("Number of logs queried - " + commaSeparateNumber(logResponse["logMessages"].length));

                        // Update the loading bar text
                        $("#progressbarText").text("Querying logs...");
                        $("#progressbarLogsText").text("Number of logs queried - " + commaSeparateNumber(logResponse["logMessages"].length));

                        // Get more logs - Send the last record as the from date
                        // When logs have been returned
                        when(getLogs(lastRecordDate), lang.hitch(this, function (logResult) {
                            // Resolve response
                            dfd.resolve(logResponse);
                        }));
                    }
                    // Otherwise
                    else {
                        // Resolve response
                        dfd.resolve(logResponse);
                    }
                }
            }
        },
        // On error
        function (err) {
            // Resolve response
            dfd.resolve(err);
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get service status
    function getServiceStatus(service) {
        var dfd = new deferred();

        // Request the service status
        request({
            url: configOptions.agsSite.url + "/admin/services/" + service + "/status",
            preventCache: true,
            content: {
                "token": serverToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            // Resolve response
            dfd.resolve(response);
        },
        // On error
        function (err) {
            // Resolve response
            dfd.resolve(err);
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get service info
    function getServiceInfo(service) {
        var dfd = new deferred();

        // Request the service info
        request({
            url: configOptions.agsSite.url + "/admin/services/" + service,
            preventCache: true,
            content: {
                "token": serverToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            // Resolve response
            dfd.resolve(response);
        },
        // On error
        function (err) {
            // Resolve response
            dfd.resolve(err);
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get service statistics
    function getServiceStatistics(service) {
        var dfd = new deferred();

        // Request the service statistics
        request({
            url: configOptions.agsSite.url + "/admin/services/" + service + "/statistics",
            preventCache: true,
            content: {
                "token": serverToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            // Resolve response
            dfd.resolve(response);
        },
        // On error
        function (err) {
            // Resolve response
            dfd.resolve(err);
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Gets the services for a folder on arcgis server
    function getServices(folder) {
        var dfd = new deferred();

        // Request the services
        request({
            url: configOptions.agsSite.url + "/admin" + (folder ? "/services/" + folder : "/services"),
            preventCache: true,
            content: {
                "token": serverToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            // Resolve response
            dfd.resolve(response);
        },
        // On error
        function (err) {
            // Resolve response
            dfd.resolve(err);
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get a token for the arcgis server site
    function getToken(site, url, username, password, callback) {
        // If ArcGIS Online token
        if (site == "Portal") {
            var siteURL = url + "/generateToken";
        }
            // If ArcGIS server token
        else {
            var siteURL = url + "/tokens/generateToken";
        }

        var requestParameters = "username=" + username + "&password=" + password + "&referer=http://localhost&expiration=30&f=json";

        // Make request to server for json data
        $.ajax({
            url: siteURL,
            data: requestParameters,
            dataType: "jsonp",
            type: "POST",
            crossDomain: true,
            // On response
            success: function (data) {
                var token = data.token;
                callback(token);
            },
            // On error
            error: function (xhr, status, error) {
                console.log(error);
            }
        });
    }
    // ----------------------------------------------------------------------------------------------------
});