// -------------------------------------- Global variables --------------------------------------
// ArcGIS token for access to the site
var agsToken;
// Current service selected
var serviceChoice = null;
// Current filter selected
var filterChoice = null;
// Current graphic selected
var graphicChoice = null;
// Type of service selected
var serviceType = null;
// Log data dictionary
var logData = [
  { text: "Warning", y: 1 },
  { text: "Success", y: 1 },
  { text: "Errors", y: 1 }
];
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
    getToken(configOptions.agsSite.url, configOptions.agsSite.username, configOptions.agsSite.password, function (token) {
        // Set the global variable
        agsToken = token;

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
            $("#requestsPieChartContainer").css('display', 'none');
            $("#requestsTimeGaugeContainer").css('display', 'none');
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
                        // Show the progress bar and hide the graphs
                        $("#appLoadBar").show();
                        $("#requestsPieChartContainer").css('display', 'none');
                        $("#requestsTimeGaugeContainer").css('display', 'none');
                        $("#drawTimeGaugeContainer").css('display', 'none');
                        $("#availabilityContainer").css('display', 'none');

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
                        // Show the progress bar and hide the graphs
                        $("#appLoadBar").show();
                        $("#requestsPieChartContainer").css('display', 'none');
                        $("#requestsTimeGaugeContainer").css('display', 'none');
                        $("#drawTimeGaugeContainer").css('display', 'none');
                        $("#availabilityContainer").css('display', 'none');

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
        var accessTime = 0;
        var totalDrawTime = 0;
        var averageDrawTime = 0;
        var drawRequestCount = 0;
        var warnTotal = 0;
        var errTotal = 0;
        var sucTotal = 0;

        // When logs have been returned
        when(getLogs(), lang.hitch(this, function (logResult) {
            // Get the logs
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
                        getToken(configOptions.hotSpotAnalysisService.tokenURL, configOptions.hotSpotAnalysisService.username, configOptions.hotSpotAnalysisService.password, function (token) {
                            var extentFeatureSet = new esri.tasks.FeatureSet();
                            extentFeatureSet.geometryType = "esriGeometryPoint";
                            extentFeatureSet.spatialReference = map.spatialReference;
                            extentFeatureSet.features = extentFeatures;
                            var extentFeatureSetJSON = dojo.toJson(extentFeatureSet.toJson());

                            var extentFeatureCollection = "{\"layerDefinition\": {\"geometryType\": \"esriGeometryPoint\",\"fields\": [{\"name\": \"Id\",\"type\": \"esriFieldTypeOID\",\"alias\": \"Id\"}]},\"featureSet\": " + extentFeatureSetJSON + "}";

                            // Setup the hotspot task and parameters
                            hotSpotAnalysisTask = new esri.tasks.Geoprocessor(configOptions.hotSpotAnalysisService.url + "?token=" + token);
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
                                        "token": agsToken,
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
                                },
                                // On error
                                function (err) {
                                    // Update draw request count
                                    $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                    // Hide the progress bar
                                    $("#appLoadBar").hide();
                                });


                                // Update draw request count
                                $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                // Hide the progress bar
                                $("#appLoadBar").hide();
                            }
                                // If failed
                            else {
                                console.log("There was an error:");
                                console.log(jobInfo.messages[0].description);

                                // Update draw request count
                                $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                                // Hide the progress bar
                                $("#appLoadBar").hide();
                            }
                        }
                    }
                }
                else {
                    // Update draw request count
                    $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));
                    // Hide the progress bar
                    $("#appLoadBar").hide();
                }
            }

            // Services performance
            if ((currentPage.indexOf("ServicesPerformance") != -1) | (currentPage.length == 0)) {
                // For each of the logs
                for (var i = 0; i < logs.length; i++) {
                    var record = logs[i];
                    var message = record["message"];


                    // Get the records that request a draw
                    if (message.search("End ExportMapImage") >= 0) {
                        // Add to total draw time
                        totalDrawTime = totalDrawTime + parseFloat(record["elapsed"]);

                        // Add to request counter
                        drawRequestCount++;
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

                // Get the access time
                accessTime = getAcessTimes(logResult);

                // Get the average draw time
                averageDrawTime = totalDrawTime / drawRequestCount
                if (isNaN(averageDrawTime)) {
                    averageDrawTime = 0;
                }
                // Get the total requests
                var totalRequests = commaSeparateNumber(parseInt(sucTotal) + parseInt(warnTotal) + parseInt(errTotal));

                // Update request count
                $("#totalRequests").text("Number of requests - " + totalRequests);

                // Update draw request count
                $("#totalDraws").text("Number of draw requests - " + commaSeparateNumber(drawRequestCount));

                // Update average response time
                $("#averageResponseTime").text("Average Response Time (seconds) - " + accessTime.toFixed(2));

                // Update average draw time
                $("#averageDrawTime").text("Average Draw Time (seconds) - " + averageDrawTime.toFixed(2));

                // If pie chart hasn't been created
                if (!pieChart) {
                    // Only show requests for non cached map services and other services
                    if (serviceType != "MapServerCached") {
                        // create the pie chart for requests
                        createPieChart("requestsPieChart", logData);
                        // Show the chart
                        $("#requestsPieChartContainer").css('display', 'block');
                    }
                }
                    // Update chart
                else {
                    // Only show requests for non cached map services and other services
                    if (serviceType != "MapServerCached") {
                        pieChart.updateSeries("report", logData);
                        pieChart.render();
                        pieLegend.refresh();
                        // Show the chart
                        $("#requestsPieChartContainer").css('display', 'block');
                    }
                }

                // If gauges haven't been created
                if (!gauges[0]) {
                    // Only show response time for non cached map services and other services
                    if (serviceType != "MapServerCached") {
                        // Create the gauge for average requests
                        createGauge("requestsTimeGauge", accessTime);
                        // Show the chart
                        $("#requestsTimeGaugeContainer").css('display', 'block');
                    }
                }
                    // Update chart
                else {
                    // Only show response time for non cached map services and other services
                    if (serviceType != "MapServerCached") {
                        gauges[0].indicators[0].value = accessTime;
                        gauges[0].startup();
                        // Show the chart
                        $("#requestsTimeGaugeContainer").css('display', 'block');
                    }
                }
                if (!gauges[1]) {
                    // Only show draw time for map services
                    if (serviceType == "MapServer") {
                        // Create the gauge for average draw time
                        createGauge("drawTimeGauge", averageDrawTime);
                        // Show the chart
                        $("#drawTimeGaugeContainer").css('display', 'block');
                    }
                }
                    // Update chart
                else {
                    // Only show draw time for map services
                    if (serviceType == "MapServer") {
                        gauges[1].indicators[0].value = averageDrawTime;
                        gauges[1].startup();
                        // Show the chart
                        $("#drawTimeGaugeContainer").css('display', 'block');
                    }
                }

                // Hide the progress bar
                $("#appLoadBar").hide();
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
                        barChart.updateSeries("Daily Draw Count", chartData);

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
                    });

                }
                    // Update chart
                else {
                    // Show the chart
                    $("#serviceUseContainer").css('display', 'block');

                    barChart.updateSeries("Daily Draw Count", chartData);

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
                }
            }
        }));
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get access time for logs
    function getAcessTimes(records) {
        var averageTime = 0;
        var i = 0;

        array.forEach(records.logMessages, lang.hitch(this, function (record) {
            if (record.elapsed !== "") {
                averageTime += Number(record.elapsed);
                i++;
            }
        }));
        averageTime = averageTime / i;
        return (isNaN(averageTime) ? 0 : averageTime);
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
            "dojox/gauges/AnalogArrowIndicator",
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
                          color: '#7FFF00'
                      }]
                  }
              },
              {
                  low: 1.5, high: 2,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#7FFF00'
                      }]
                  }
              },
              {
                  low: 2, high: 2.5,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#7FFF00'
                      }]
                  }
              },
              {
                  low: 2.5, high: 3,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#E0BC1B'
                      }]
                  }
              },
              {
                  low: 3, high: 3.5,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#E0BC1B'
                      }]
                  }
              },
              {
                  low: 3.5, high: 4,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#E0BC1B'
                      }]
                  }
              },
              {
                  low: 4, high: 4.5,
                  color: {
                      type: "linear",
                      colors: [{
                          offset: 0,
                          color: '#E01E1B'
                      }]
                  }
              },
              {
                  low: 4.5, high: 5,
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
            "dojox/charting/axis2d/Default",
        ],
        function (chart, pie, legend, theme, highlight, tooltip, lines, markers, axisdefault) {
            // Create the pie chart
            pieChart = new chart(dojo.byId(node));

            // Set the theme
            theme.chart.fill = "transparent";
            theme.plotarea.fill = "transparent";
            pieChart.setTheme(theme);

            pieChart.addPlot("default", {
                title: "Service Requests",
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
            }, "requestsPieLegend");

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
            "dojox/charting/axis2d/Default",
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
                title: 'Draw Count',
                vertical: true,
                fixLower: "major",
                fixUpper: "major"
            });

            // Add the series of data
            barChart.addSeries("Daily Draw Count", chartData);

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

    // FUNCTION - Error handler
    function requestFailed(error) {
        console.log("Error: ", error.message);
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get the arcgis server logs
    function getLogs() {
        var filterEndTime;
        var dfd = new deferred();

        // Get current unix time
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

        // Get the date and time - convert from unix time
        var unixDate = new Date(unixTime);

        var year = unixDate.getFullYear();
        var month = unixDate.getMonth();
        var date = unixDate.getDate();
        var hours = unixDate.getHours();
        var minutes = unixDate.getMinutes();
        var seconds = unixDate.getSeconds();
        var formattedTime = hours + ':' + minutes + ':' + seconds;
        console.log("Stats showing from " + date + "/" + (month + 1) + "/" + year + " at " + formattedTime);

        var unixTimeEnd = filterEndTime;
        var unixDate = new Date(unixTimeEnd);
        var year = unixDate.getFullYear();
        var month = unixDate.getMonth();
        var date = unixDate.getDate();
        var hours = unixDate.getHours();
        var minutes = unixDate.getMinutes();
        var seconds = unixDate.getSeconds();
        var formattedTime = hours + ':' + minutes + ':' + seconds;
        console.log("Stats showing to " + date + "/" + (month + 1) + "/" + year + " at " + formattedTime);

        // Request the logs
        esri.request({
            url: configOptions.agsSite.url + "/admin/logs/query",
            preventCache: true,
            content: {
                "token": agsToken,
                "level": "FINE",
                "filter": "{ \"services\": [\"" + serviceChoice + "\"], \"machines\": \"*\"}",
                "endTime": filterEndTime,
                "f": "json",
                "pageSize": "10000"
            },
            handleAs: "json",
            useProxy: false
        }).
        // On response
        then(function (response) {
            dfd.resolve(response);
        },
        // On error
        function (err) {
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
                "token": agsToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            dfd.resolve(response);
        },
        // On error
        function (err) {
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
                "token": agsToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            dfd.resolve(response);
        },
        // On error
        function (err) {
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
                "token": agsToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            dfd.resolve(response);
        },
        // On error
        function (err) {
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
                "token": agsToken,
                "f": "json"
            },
            handleAs: "json",
            useProxy: true
        }).
        // On response
        then(function (response) {
            dfd.resolve(response);
        },
        // On error
        function (err) {
            dfd.resolve(err);
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------

    // FUNCTION - Get a token for the arcgis server site
    function getToken(url, username, password, callback) {
        var requestParameters = "username=" + username + "&password=" + password + "&referer=http://localhost&expiration=5&f=json";

        // Make request to server for json data
        $.ajax({
            url: url + "/tokens/generateToken",
            data: requestParameters,
            dataType: "json",
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
