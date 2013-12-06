// -------------------------------------- Global variables --------------------------------------
// Current service selected
var serviceChoice = null;
// Current filter selected
var filterChoice = null;
// Current graphic selected
var graphicChoice = null;
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
var lineChart = null;
// Gauge
var gauge = null;

// -------------------------------------- Modules required --------------------------------------
require([
    // Esri modules
    "esri/map",
    "esri/graphic",
    "esri/layers/agstiled",
    "esri/layers/agsdynamic",
    "esri/request",

    // Dojo modules
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/when",
    "dojo/Deferred",
    "dojo/dom-construct",
    "dojo/domReady!"
],


// -------------------------------------- Main function executed when DOM ready --------------------------------------
function (map, graphic, agstiled, agsdynamic, request, lang, array, when, deferred, domConst) {
    // Load the configuration file
    initVariables();

    // Set the title
    document.title = configOptions.Title;
    $("#title").text(configOptions.Title);

    // Get the current page
    var pagePath = window.location.pathname;
    var currentPage = pagePath.substring(pagePath.lastIndexOf('/') + 1);

    // Setup proxy
    esri.config.defaults.io.proxyUrl = configOptions.proxyUrl;

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
        getAllServices("mapServices",function(serviceList) {
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
            $("#graphicDropdown").append('<li><a href="#graphicDropdown">' + "Hot Spot" + '</a></li>');
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
        });
    }

    // Services dashboard
    else {
        // Show the progress bar and hide the graphs
        $("#appLoadBar").show();
        $("#requestsPieChartContainer").css('display', 'none');
        $("#requestsTimeGaugeContainer").css('display', 'none');

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

            // Scan the logs
            scanLogs();

            // On change handler for services dropdown
            $('.servicesDropdown li > a').click(function (e) {
                // Show the progress bar and hide the graphs
                $("#appLoadBar").show();
                $("#requestsPieChartContainer").css('display', 'none');
                $("#requestsTimeGaugeContainer").css('display', 'none');

                // Update dropdown and selection
                $('.servicesSelection').text(this.innerHTML);
                serviceChoice = this.innerHTML;

                // Clear previous graphics
                clearGraphics();

                // Scan the logs
                scanLogs();
            });
            // On change handler for filter dropdown
            $('.filterDropdown li > a').click(function (e) {
                // Show the progress bar and hide the graphs
                $("#appLoadBar").show();
                $("#requestsPieChartContainer").css('display', 'none');
                $("#requestsTimeGaugeContainer").css('display', 'none');

                // Update dropdown and selection
                $('.filterSelection').text(this.innerHTML);
                filterChoice = this.innerHTML;

                // Clear previous graphics
                clearGraphics();

                // Scan the logs
                scanLogs();
            });
        });
    }
    // ----------------------------------------------------------------------------------------------------



    // -------------------------------------- General functions --------------------------------------
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


    // Scans the arcgis server logs
    function scanLogs() {
        var accessTime = 0;
        var requestTotal = 0;
        var accessTime = 0;
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
                        requestTotal++;
                    }
                }
                // Update request count
                $("#totalRequests").text("Number of requests (max 10,000) - " + commaSeparateNumber(requestTotal));

                // Hide the progress bar
                $("#appLoadBar").hide();
            }
            // Services dashboard
            else {
                // Get the access time
                accessTime = getAcessTimes(logResult);

                // For each of the logs
                for (var i = 0; i < logs.length; i++) {
                    var record = logs[i];
                    var message = record["message"];

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

                // If charts haven't been created
                if (!pieChart) {
                    // create the pie chart for requests
                    createPieChart("requestsPieChart", logData);
                }
                // Update chart
                else {
                    pieChart.updateSeries("report", logData);
                    pieChart.render();
                    pieLegend.refresh();
                }
                if (!gauge) {
                    // Create the gauge for requests
                    createGauge("requestsTimeGauge", accessTime);
                }
                // Update chart
                else {
                    gauge.indicators[0].value = accessTime;
                    gauge.startup();
                }

                // Get the total requests
                var totalRequests = commaSeparateNumber(parseInt(sucTotal) + parseInt(warnTotal) + parseInt(errTotal));

                // Update request count
                $("#totalRequests").text("Number of requests (max 10,000) - " + totalRequests);

                // Update average response time
                $("#averageResponseTime").text("Average Response Time (seconds) - " + accessTime.toFixed(2));

                // Hide the progress bar and show the graphs
                $("#appLoadBar").hide();
                $("#requestsPieChartContainer").css('display', 'block');
                $("#requestsTimeGaugeContainer").css('display', 'block');
            }
        }));
    }


    // Get access time for log
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


    // Get instances for a service
    function getServiceInstances(service,callback) {
        var instanceList = [];

        // Get stats for the service
        when(getServiceStatistics(service), lang.hitch(this, function (response) {
            // Get Instance usage and push into list
            instanceList.push({ maxInstances: response.summary.max, freeInstance: response.summary.free, initializingInstances: response.summary.initializing, notCreatedInstances: response.summary.notCreated });
            
            callback(instanceList);
        }));
    }


    // Add graphic to map
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
            // Add point graphic to map
            map.graphics.add(new esri.Graphic(centerPointCoords, pointSymbol));
        }
    }


    // Clears all the graphics from the map
    function clearGraphics() {
        if (map.graphics != undefined) {
            map.graphics.clear();
        }
    }


    // Create gauge
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
            gauge = new dojox.gauges.AnalogGauge({
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

            return gauge;
        });
    }

    // Create pie chart
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

    // Create line chart
    function createLineChart(node, chartData, min, max) {
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
        function (chart,pie,legend,theme,highlight,tooltip,lines,markers,axisdefault) {
            lineChart = new chart(dojo.byId(node));

            // Set the theme
            theme.chart.fill = "transparent";
            theme.plotarea.fill = "transparent";
            lineChart.setTheme(theme);

            // create the axis
            lineChart.addAxis("x");
            lineChart.addAxis("y", { min: min, max: max, vertical: true, fixLower: "major", fixUpper: "major" });

            // Add in chart data
            array.forEach(chartData, lang.hitch(function (data, i) {
                lineChart.addSeries(data.series, data.values);
            }));

            // Render the chart
            lineChart.render();

            return lineChart;
        });
    }


    // Add commas to number
    function commaSeparateNumber(val) {
        while (/(\d+)(\d{3})/.test(val.toString())) {
            val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
        }
        return val;
    }


    // Error handler
    function requestFailed(error) {
        console.log("Error: ", error.message);
    }
    // ----------------------------------------------------------------------------------------------------



    // -------------------------------------- ArcGIS server queries --------------------------------------
    // Get the arcgis server logs
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
        console.log("Stats showing from " + date + "/" + month + "/" + year + " at " + formattedTime);

        var unixTimeEnd = filterEndTime;
        var unixDate = new Date(unixTimeEnd);
        var year = unixDate.getFullYear();
        var month = unixDate.getMonth();
        var date = unixDate.getDate();
        var hours = unixDate.getHours();
        var minutes = unixDate.getMinutes();
        var seconds = unixDate.getSeconds();
        var formattedTime = hours + ':' + minutes + ':' + seconds;
        console.log("Stats showing to " + date + "/" + month + "/" + year + " at " + formattedTime);

        esri.request({
            url: configOptions.agsSite + "/admin/logs/query" + "?token=" + configOptions.agsToken,
            preventCache: true,
            useProxy: false,
            handleAs: "json",
            content: {
                "level": "FINE",
                "filter": "{ \"services\": [\"" + serviceChoice + "\"], \"machines\": \"*\"}",
                "endTime": filterEndTime,
                "f": "json",
                "pageSize": "10000"
            }
        }).then(function (response) {
            dfd.resolve(response);
        }, function (err) {
            dfd.resolve();
        });
        return dfd.promise;
    }


    // Get service statistics
    function getServiceStatistics(service) {
        var dfd = new deferred();

        request({
            url: configOptions.agsSite + "/admin/services/" + service + "/statistics" + "?token=" + configOptions.agsToken,
            preventCache: true,
            content: {
                "f": "json"
            },
            handleAs: "json"
        }).then(function (response) {
            dfd.resolve(response);
        }, function (err) {
            dfd.resolve(err);
        });
        return dfd.promise;
    }


    // Gets the services for a folder on arcgis server
    function getServices(folder) {
        var dfd = new deferred();
        // Request the services
        esri.request({
            url: configOptions.agsSite + "/rest" + (folder ? "/services/" + folder : "/services") + "?token=" + configOptions.agsToken,
            preventCache: true,
            content: {
                "f": "json"
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
            dfd.resolve();
        });
        return dfd.promise;
    }
    // ----------------------------------------------------------------------------------------------------
});
