// Very basic and roughly coded demo of using dojox graphs 
// to display current server status through log scraping.
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
  "esri/IdentityManager",
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
function(declare, lang, win, array, fx, Deferred, when, coreFx, Memory, domAttr, domStyle, domConst ,_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Select, TextBox, Button, template, IdentityManager, request, AnalogGauge, AnalogArrowIndicator, Chart, PiePlot, Legend, theme, Highlight, Tooltip) {

  return declare([ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: template,


    //-- Config --
	_serverURL: protoConfig.defaultURL,
    //------------


    _serviceChoice: null,

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

    //-- Template attach points --
    _txtServer: null,
    _selectHolder: null,
    _connectionHolder: null,
    _nodeInstancesValue: null,
    _nodeLogValue: null,
    _nodeResponseTime: null,
    //-----------


    postCreate: function (){
      var _self = this;
      theme.chart.fill= "transparent";
      theme.plotarea.fill = "transparent";
      domAttr.set(this._txtServer, "value", this._serverURL);
      var myButton = new Button({
        label: "Connect To Server",
        onClick: function(){
          _self._serverURL = domAttr.get(_self._txtServer, "value");
          when(_self._getAuth(), function() {
            _self._connectToServer();
          });
        }
      }, "connectButton");
    },

    _getAuth: function(folder) {
      var dfd = request({
        url: this._serverURL,
        content: { f: "json"},
        handleAs: "json"
      }).then(function(response) {
        dfd.resolve(response);
      }, function(err) {
        dfd.resolve(err);
      });
      return dfd.promise;
    },


    _getServices: function(folder) {
      var dfd = new Deferred();
      request({
        url: this._serverURL + (folder ? "/services/" + folder : "/services"),
        preventCache: true,
        content: { f: "json"},
        handleAs: "json",
        useProxy:false
      }).then(function(response) {
        dfd.resolve(response);
      }, function(err) {
        dfd.resolve();
      });
      return dfd.promise;
    },

    _getLogs: function(level) {
      var dfd = new Deferred();
      request({
        url: this._serverURL + "/logs/query",
        preventCache: true,
        content: { f: "json"},
        handleAs: "json",
        useProxy:false,
        form: this._buildFromProps({
          startTime: "",
          endTime: "",
          level: level,
          filterType: "json",
          filter: '{"services":["' + this._serviceChoice + '"],"machines": "*"}',
          pageSize: 10000
        })
      }).then(function(response) {
        dfd.resolve(response);
      }, function(err) {
        dfd.resolve();
      });
      return dfd.promise;
    },

    _connectToServer: function() {
      var _self = this;
      var serviceList = [];
      when(this._getServices(), lang.hitch(this, function(response){
        if(response !== undefined) {
          domAttr.set(this._connectionHolder, "innerHTML", "Conencted To:" + this._serverURL);
          if(this._constructed === false) {
            this._constructed = true;
            array.forEach(response.services, function(service){
              serviceList.push({label: service.serviceName + "." + service.type, value:service.serviceName + "." + service.type});
            });
            array.forEach(response.foldersDetail, function(folder){
              when(_self._getServices(folder.folderName), lang.hitch(this, function(folderServices){
                array.forEach(folderServices.services, function(service){
                  serviceList.push({label: service.folderName + "/" + service.serviceName + "." + service.type, value: service.folderName + "/" + service.serviceName + "." + service.type});
                });
              }));
            });
            this._serviceChoice = serviceList[0].value;

            new Select({
              name: "serviceSelect",
              options: serviceList,
              style: {
                width: "200px"
              }
            }).placeAt(this._selectHolder).on("change", function(){
              _self._serviceChoice = this.get("value");
              _self._scanLogs();
              _self._slideInstanceGraph = true;
            });

            this._logPieChart = new Chart("pieChart");
            this._logPieChart.setTheme(theme);
            this._logPieChart.addPlot("default", {
              type: PiePlot,
              font: "bold bold 11pt Tahoma",
              stroke: {color: "blue", width: 1},
              radius: 200,
              fontColor: "black",
              labelOffset: 10,
              labels: false
            });
            new Tooltip(this._logPieChart, "default");


            this._gaugeResponseHolder = this._createGauge("chartResponseTime");

            var currentInstance = {
              values: this._instanceData,
              color: "blue",
              series: "Current Instances"
            };

            var maxIstance = {
              values: this._maxInstanceData,
              color: "red",
              series: "Maximum Instances"
            };

            var instanceChart = this._createChart("chartInstances", [currentInstance, maxIstance], 0, 10);
            this._runChart(instanceChart, "chartInstances", [currentInstance, maxIstance]);

            this._logPieChart.addSeries("report",this._logData);
            this._logPieChart.render();
            domStyle.set("pieChart", "opacity", "0");


            new Legend({chart: this._logPieChart}, "pieLegend");
            setInterval(function(){_self._scanLogs();}, 3000);

          }
          else {
            domConst.empty(this._selectHolder);
            array.forEach(response.services, function(service){
              serviceList.push({label: service.serviceName + "." + service.type, value:service.serviceName + "." + service.type});
            });
            array.forEach(response.foldersDetail, function(folder){
              when(_self._getServices(folder.folderName), lang.hitch(this, function(folderServices){
                array.forEach(folderServices.services, function(service){
                  serviceList.push({label: service.folderName + "/" + service.serviceName + "." + service.type, value: service.folderName + "/" + service.serviceName + "." + service.type});
                });
              }));
            });
            this._serviceChoice = serviceList[0].value;
            new Select({
              name: "serviceSelect",
              options: serviceList,
              style: {
                width: "200px"
              }
            }).placeAt(this._selectHolder).on("change", function(){
              _self._slideInstanceGraph = true;
              _self._serviceChoice = this.get("value");
              _self._scanLogs();
            });
          }
        }
        else {
          domAttr.set(this._connectionHolder, "innerHTML", "Connected To: Connection Error");
        }
      }));
    },

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

    _getServiceStatistics: function() {
      var dfd = new Deferred();
      request({
        url: this._serverURL + "/services/" + this._serviceChoice + "/statistics",
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

    _scanLogs: function() {
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
      }));
    },

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