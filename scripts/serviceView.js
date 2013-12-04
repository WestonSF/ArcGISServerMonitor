// Define the modules
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/_base/array",
  "dojo/_base/fx",
  "dojo/Deferred",
  "dojo/when",
  "dojo/fx",
  "dojo/store/Memory",
  "dojo/dom-attr",
  "dojo/dom-style",
  "dojo/dom-construct",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/Button",
  "dojo/text!./serviceView.html",
  "esri/request",
  "dojox/gauges/AnalogGauge",
  "dojox/gauges/AnalogArrowIndicator",
  "dojox/charting/Chart",
  "dojox/charting/plot2d/Pie",
  "dojox/charting/widget/Legend",
  "dojox/charting/themes/Tom",
  "dojox/charting/action2d/Highlight",
  "dojox/charting/action2d/Tooltip",
  "dojox/charting/plot2d/Lines",
  "dojox/charting/plot2d/Markers",
  "dojox/charting/axis2d/Default",
  "esri/utils"
],
// When modules have loaded, execute this function
function(declare, lang, win, array, fx, Deferred, when, coreFx, Memory, domAttr, domStyle, domConst ,_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Select, TextBox, Button, template, request, AnalogGauge, AnalogArrowIndicator, Chart, PiePlot, Legend, theme, Highlight, Tooltip) {
  // Return the following
  return declare([ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    // Setup the variables
    widgetsInTemplate: true,
    templateString: template,
	_serverURL: protoConfig.defaultURL,
    _instanceData: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    _maxInstanceData: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    _slideInstanceGraph: true,
    _gaugeResponseHolder: null,
    _logPieChart: null,
    _logData: [
      {text : "Warning", y:1},
      {text : "Success", y:1},
      {text : "Errors", y:1}
    ],
    _lastTime: null,
    _lastSuccesses: null,
    _lastErrors: null,
    _lastWarnings: null,
    _constructed: false,
    // AGS services selection
    _selectHolder: null,
    // Connection information
    _connectionHolder: null,
    _nodeInstancesValue: null,
    _nodeLogValue: null,
    _nodeResponseTime: null,
    // List of services
    serviceList: [],
    // Current service selected
    _serviceChoice: null,
    // List of filters
    filterList: [],
    // Current filter selected
    _filterChoice: null,

    // On creation of widget
    postCreate: function (){
      var _self = this;
      theme.chart.fill= "transparent";
      theme.plotarea.fill = "transparent";
     
      // Get authentication
      when(_self._getAuth(), function () {
          // Connect to server
          _self._connectToServer();
      });
    },

    // Get the connection
    _getAuth: function (folder) {
      // Connection request
      var dfd = request({
        url: this._serverURL + "?token=" + configOptions.agsToken,
        content: { f: "json"},
        handleAs: "json"
      }).then(function (response) {
        dfd.resolve(response);
      }, function(err) {
        dfd.resolve(err);
      });
      return dfd.promise;
    },

    // Get a list of services for each of the folders
    _getServices: function (folder) {
        var dfd = new Deferred();
      // Request the services
      request({
        url: this._serverURL + (folder ? "/services/" + folder : "/services") + "?token=" + configOptions.agsToken,
        preventCache: true,
        content: { f: "json"},
        handleAs: "json",
        useProxy:false
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
    },

    // Get the logs
    _getLogs: function (level) {
      var filterEndTime;
      var _self = this;
      var dfd = new Deferred();

      // Get current unix time
      var unixTime = (new Date).getTime();
      if (_self._filterChoice == "Last Hour") {
          filterEndTime = unixTime - (3600*1000);
      }
      if (_self._filterChoice == "Last 24 Hours") {
          filterEndTime = unixTime - (86400*1000);
      }
      if (_self._filterChoice == "Last Week") {
          filterEndTime = unixTime - (604800*1000);
      }
      if (_self._filterChoice == "Last 30 Days") {
          filterEndTime = unixTime - (2592000*1000);
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

      request({
        url: this._serverURL + "/logs/query" + "?token=" + configOptions.agsToken,
        preventCache: true,
        content: { f: "json"},
        handleAs: "json",
        useProxy:false,
        form: this._buildFromProps({
          startTime: "",
          // Set end date from the filter selection
          endTime: filterEndTime,
          level: level,
          filterType: "json",
          filter: '{"services":["' + this._serviceChoice + '"],"machines": "*"}',
          pageSize: 1000
        })
      }).then(function(response) {
        dfd.resolve(response);
      }, function(err) {
        dfd.resolve();
      });
      return dfd.promise;
    },

    // Connection to the server
    _connectToServer: function () {
      var _self = this;
      // When services have been received
      when(this._getServices(), lang.hitch(this, function (response) {
        // If there is a reponse
        if(response !== undefined) {
          // Update connection information to show server connected to
          domAttr.set(this._connectionHolder, "innerHTML", "<B>Connected To - " + this._serverURL + "</B");        
            // For each of the services that are in the root in the response
            array.forEach(response.services, function(service){
               _self.serviceList.push({ label: service.serviceName + "." + service.type, value: service.serviceName + "." + service.type });

                // Append to dropdown
               $("#servicesDropdown").append('<li><a href="#servicesDropdown">' + service.folderName + "/" + service.serviceName + "." + service.type + '</a></li>');
            });

            // If the services are all in the root
            if (response.foldersDetail.length == 0) {
                // Update the stats
                updateStats();
            }
            else {
                // For each of the folders in the response
                var folderCount = 0;
                array.forEach(response.foldersDetail, function (folder) {
                    // When services have been received for folder
                    when(_self._getServices(folder.folderName), lang.hitch(this, function (folderServices) {
                        folderCount++;
                        var servicesCount = 0;
                        // For each of the services in the folder
                        array.forEach(folderServices.services, function (service) {
                            _self.serviceList.push({ label: service.folderName + "/" + service.serviceName + "." + service.type, value: service.folderName + "/" + service.serviceName + "." + service.type });
                            // Append to dropdown
                            $("#servicesDropdown").append('<li><a href="#servicesDropdown">' + service.folderName + "/" + service.serviceName + "." + service.type + '</a></li>');
                            servicesCount++;

                            // If finished looping through all folders and services
                            if ((folderCount >= response.foldersDetail.length) & (servicesCount >= folderServices.services.length)) {
                                // Update the stats
                                updateStats();
                            }
                        });
                    }));
                });
            }

            // Append to dropdown for filter
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Hour" + '</a></li>');
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 24 Hours" + '</a></li>');
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last Week" + '</a></li>');
            $("#filterDropdown").append('<li><a href="#filterDropdown">' + "Last 30 Days" + '</a></li>');
            // Set default selection
            $('.filterSelection').text("Last 24 Hours");
            _self._filterChoice = "Last 24 Hours";
        }
        // If there is no response
        else {
          // Update connection information to show connection error
          domAttr.set(this._connectionHolder, "innerHTML", "<B>Connected To - Connection Error" + "</B");
        }
      }));

      // After the services have been received, update the stats
      function updateStats() {
              // If graphs/stats haven't been contructed yet
              if (_self._constructed === false) {
                  // Set variable to constructed
                  _self._constructed = true;
                  // Default selection to be the first service
                  _self._serviceChoice = _self.serviceList[0].value;
                  $('.servicesSelection').text(_self.serviceList[0].value);
                  // Show the progress bar
                  $("#appLoadBar").show();
                  // Scan the logs for the service
                  _self._scanLogs();
                  _self._slideInstanceGraph = true;

                  // On change handler for dropdowns
                  $('.servicesDropdown li > a').click(function (e) {
                      // Show the progress bar
                      $("#appLoadBar").show();

                      $('.servicesSelection').text(this.innerHTML);
                      _self._serviceChoice = this.innerHTML;
                      // Scan the logs for the service
                      _self._scanLogs();
                      _self._slideInstanceGraph = true;
                  });
                  $('.filterDropdown li > a').click(function (e) {
                      // Show the progress bar
                      $("#appLoadBar").show();

                      $('.filterSelection').text(this.innerHTML);
                      _self._filterChoice = this.innerHTML;
                      // Scan the logs for the service
                      _self._scanLogs();
                      _self._slideInstanceGraph = true;
                  });

                  // Setup pie chart
                  _self._logPieChart = new Chart("pieChart");
                  _self._logPieChart.setTheme(theme);
                  _self._logPieChart.addPlot("default", {
                      type: PiePlot,
                      font: "bold bold 11pt Tahoma",
                      stroke: { color: "blue", width: 1 },
                      radius: 200,
                      fontColor: "black",
                      labelOffset: 10,
                      labels: false
                  });
                  new Tooltip(_self._logPieChart, "default");

                  // Setup the gauge
                  _self._gaugeResponseHolder = _self._createGauge("chartResponseTime");

                  var currentInstance = {
                      values: _self._instanceData,
                      color: "blue",
                      series: "Current Instances"
                  };

                  var maxInstance = {
                      values: _self._maxInstanceData,
                      color: "red",
                      series: "Maximum Instances"
                  };

                  var instanceChart = _self._createChart("chartInstances", [currentInstance, maxInstance], 0, 10);
                  _self._runChart(instanceChart, "chartInstances", [currentInstance, maxInstance]);

                  _self._logPieChart.addSeries("report", _self._logData);
                  _self._logPieChart.render();
                  domStyle.set("pieChart", "opacity", "0");


                  new Legend({ chart: _self._logPieChart }, "pieLegend");
                  setInterval(function () { _self._scanLogs(); }, 3000);

              }
              // If graphs/stats have already been constructed
              else {
                  domConst.empty(_self._selectHolder);

                  // Default selection to be the first service
                  _self._serviceChoice = _self.serviceList[0].value;

                  // On change handler for dropdown
                  $('.servicesDropdown li > a').click(function (e) {
                      // Show the progress bar
                      $("#appLoadBar").show();

                      $('.servicesSelection').text(this.innerHTML);
                      _self._serviceChoice = this.innerHTML;
                      // Scan the logs for the service
                      _self._scanLogs();
                      _self._slideInstanceGraph = true;
                  });
                  $('.filterDropdown li > a').click(function (e) {
                      // Show the progress bar
                      $("#appLoadBar").show();

                      $('.filterSelection').text(this.innerHTML);
                      _self._filterChoice = this.innerHTML;
                      // Scan the logs for the service
                      _self._scanLogs();
                      _self._slideInstanceGraph = true;
                  });
              }
      };
    },

    // Updating instances in use
    _updateInstancesInUse: function() {
      var busy = 0;
      var total = 0;
      var i;
      when(this._getServiceStatistics(), lang.hitch(this, function(response){
        array.forEach(response.perMachine, lang.hitch(this, function(res){
          total += res.max;
        }));
        if(this._maxInstanceData[0] !== total) {
          for(i = 0; i < this._maxInstanceData.length; i++) {
            this._maxInstanceData[i] = total;
          }
        }
        array.forEach(response.perMachine, lang.hitch(this, function(res){
          busy += res.busy;
        }));
        if(!isNaN(busy)){
          this._instanceData.shift();
          this._instanceData.push(busy);
          this._slideInstanceGraph = false;
          for(i = 0; i < this._instanceData.length; i++) {
            if(this._instanceData[i] > 0) {
              this._slideInstanceGraph = true;
              break;
            }
          }
          domAttr.set(this._nodeInstancesValue, "innerHTML", "Number of Instances: " + busy + " | Maximum Instances: " + total);
        }
      }));
    },

    // Updating access times
    _updateAccessTimes: function(records) {
      var averageTime = 0, i = 0;
      array.forEach(records.logMessages, lang.hitch(this, function(record){
        if(record.elapsed !== ""){
          averageTime += Number(record.elapsed);
          i++;
        }
      }));
      averageTime = averageTime / i;
      return (isNaN(averageTime) ? 0 : averageTime);
    },

    // Get service statistics
    _getServiceStatistics: function() {
      var dfd = new Deferred();
      request({
          url: this._serverURL + "/services/" + this._serviceChoice + "/statistics" + "?token=" + configOptions.agsToken,
        preventCache: true,
        content: { f: "json"},
        handleAs: "json"
      }).then(function(response) {
        dfd.resolve(response);
      }, function(err) {
        dfd.resolve(err);
      });
      return dfd.promise;
    },

    // Scan the logs
    _scanLogs: function () {
      var accessTime = 0;
      var warnTotal =0, errTotal = 0, sucTotal = 0;
      when(this._getLogs("FINE"), lang.hitch(this, function(logResult){
        accessTime = this._updateAccessTimes(logResult);
        if(accessTime !== this._lastTime) {
          this._lastTime = accessTime;
          this._gaugeResponseHolder.indicators[0].value = accessTime;
          domAttr.set(this._nodeResponseTime, "innerHTML", "Response time in Seconds:" + Math.floor(accessTime * 1000)/1000);
          this._gaugeResponseHolder.startup();
        }
        array.forEach(logResult.logMessages, function(logMessage){
          if(logMessage.type === "WARNING"){
            warnTotal ++;
          }
          if(logMessage.type === "SEVERE"){
            errTotal ++;
          }
          if(logMessage.type === "INFO"){
            sucTotal ++;
          }
          if(logMessage.type === "FINE"){
            sucTotal ++;
          }
        });
        if (warnTotal + sucTotal + errTotal > 0) {
          if(warnTotal !== this._lastWarnings || sucTotal !== this._lastSuccesses || _errTotal !== this._lastErrors) {
            this._lastWarnings = warnTotal;
            this._lastSuccesses = sucTotal;
            this._lastErrors = errTotal;
            this._logData[0] = ({text : "Warning", y: warnTotal, tooltip: "Number of Warnings: " + warnTotal});
            this._logData[1] = ({text : "Success", y: sucTotal, tooltip: "Number of Successes: " + sucTotal});
            this._logData[2] = ({text : "Errors", y: errTotal, tooltip: ("Number of Errors: " + errTotal)});
            domStyle.set("pieChart", "opacity", "1");
            this._logPieChart.updateSeries("report",this._logData);
            this._logPieChart.render();
            domAttr.set(this._nodeLogValue, "innerHTML", "Warnings: " + warnTotal + " | Successes: " + sucTotal + " | Errors: " + errTotal);
          }
        }
        else {
          domAttr.set(this._nodeLogValue, "innerHTML", "Warnings: 0  | Successes: 0 | Errors: 0");
          domStyle.set("pieChart", "opacity", "0");
        }

        // Hide the progress bar
        $("#appLoadBar").hide();
      }));
    },

    // Create the gauge
    _createGauge: function(node) {
      var gaugeHolder;
      var _self = this;
      var range = [
        {low:0, high:1,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#7FFF00'
            }]
          }
        },
        {low:1, high:2,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#7FFF00'
            }]
          }},
        {low:2, high:3,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#7FFF00'
            }]
          }},
        {low:3, high:4,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#7FFF00'
            }]
          }},
        {low:4, high:5,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#7FFF00'
            }]
          }},
        {low:5, high:6,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#E0BC1B'
            }]
          }},
        {low:6, high:7,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#E0BC1B'
            }]
          }},
        {low:7, high:8,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#E0BC1B'
            }]
          }},
        {low:8, high:9,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#E01E1B'
            }]
          }},
        {low:9, high:10,
          color:{
            type: "linear",
            colors: [{
              offset: 0,
              color: '#E01E1B'
            }]
          }}
      ];
      gaugeHolder = new dojox.gauges.AnalogGauge({
        id: node,
        width: 300,
        height: 200,
        cy: 175,
        radius: 125,
        background: "transparent",
        ranges: range,
        minorTicks: {
          offset: 125,
          interval: 0.5,
          length: 3
        },
        majorTicks: {
          offset: 125,
          interval: 1,
          length: 4
        },
        indicators: [
          new dojox.gauges.AnalogArrowIndicator({
            value: 0,
            width: 3,
            title: "val",
            noChange: true
          })
        ]
      }, dojo.byId(node));
      gaugeHolder.startup();
      return gaugeHolder;
    },

    // Create the chart
    _createChart: function(node, chartData, min, max){
      var chart = new Chart(node);
      chart.setTheme(theme);
      chart.addAxis("x");
      chart.addAxis("y", { min: min, max: max, vertical: true, fixLower: "major", fixUpper: "major" });
      array.forEach(chartData, lang.hitch(function(data, i) {
        chart.addSeries(data.series, data.values);
      }));
      chart.render();
      return chart;
    },

    // Process the chart
    _runChart: function(chart, node, chartData){
      var _self = this;
      this._updateInstancesInUse();
      if(this._slideInstanceGraph === true) {
        coreFx.slideTo({
          node: node,
          top: "0",
          left: -24,
          units: "px",
          duration: 100,
          onEnd: lang.hitch(this, function(){
            array.forEach(chartData, lang.hitch(function(data, i){
              chart.updateSeries(data.series, data.values);
            }));
            chart.render();
            domStyle.set(node, "left", 0);
            this._runChart(chart, node, chartData);
          })
        }).play();
      }
      else{
        setTimeout(function(){ _self._runChart(chart, node, chartData);}, 200);
      }
    },

    // Build the properties for the query
    _buildFromProps: function(props) {
      var create = domConst.create, f, key;
      f = create("form", {
        enctype: "multipart/form-data",
        method: "POST"
      }, create("div", { style: "display:none;" }, win.body()));

      for (key in props) {
        create("input", {
          type: "text",
          name: key,
          value: props[key]
        }, f);
      }
      return f;
    }
  });
});