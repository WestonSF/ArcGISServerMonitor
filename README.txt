README.txt
==========
Demo applications for ArcGIS Server for Administrators UC 2013
==============================================================

Two applications were demoed in the ArcGIS Server for Administrators techinical workshop at the
Esri International User Conference in 2013. The applications can be deployed by unzipping the
contents of this folder into a folder on your web server.

In order to deploy the applications on your site, you'll need download and install the ArcGIS Web Adaptor and configure
it with your server.  The Web Adaptor download is available through the Esri Customer Care portal at https://customers.esri.com.

Once you've downloaded and installed the Web Adaptor, configure it with your server and enable administrative access.  For full instructions,
see the following topic in the help:

http://resources.arcgis.com/en/help/main/10.2/#/Configuring_the_Web_Adaptor_after_installation/01540000041q000000/

Note: You must enable administrative access in order to use the demo applications.

Once the Web Adaptor is configured with your server, follow the instructions below to deploy the applications on your web server.

1. Popular Extents
------------------
This application plots extents requested from a map service (hosted on a server) as graphics
in a simple JavaScript application. By extracting log records from the ArcGIS Server Administrator API,
extent information can be gathered that be used to make decision making applications.

In order to use this application, you'll need to do the following:

     A. Modify your server to log messages at the FINE level.  For full instructions, see the following help topic:
	http://resources.arcgis.com/en/help/main/10.2/#/Specifying_server_log_settings_in_Manager/0154000002tm000000/

     B. Open PopularExtents.html and replace the URL with the name of your web adaptor server and fetch a token from the arcgis
	token service (http://localhost:6080/arcgis/tokens/generatetoken) and paste it within the application HTML in this function:

         //fetches logs at FINE from server 	
         function processLogs(){
             var serverLogsRequest = esri.request({
                 url: "http://code.esri.com/arcgis/admin/logs/query", //REPLACE WITH THE URL OF YOUR WEB ADAPTOR
                 handleAs: "json",
                 content: {
                     "level": "FINE",
                     "filter": "{'service':'SampleWorldCities.MapServer'}",
                     "f": "json",
                     "token": "<TOKEN>" // ADD AN ADMIN TOKEN HERE
                 },
             });
             serverLogsRequest.then(plotExtents, requestFailed);
         }

     C. Configure a proxy for the application. This is required. By default, the application includes its
	own proxy (proxy.ashx) which works with IIS web servers. To use the default proxy with IIS, modify
	the proxy.config file in the root folder of the demo application folder to match the URL of the machine hosting IIS:

        <serverUrl url="http://code.esri.com/" 
                   matchAll="true" 
                   dynamicToken="true"></serverUrl>

	If you are deploying this application to a Java web server or want to use your own proxy,
	skip the step above and replace the esri.config.defaults.io.proxyUrl property with the URL
	to your proxy in the application HTML (PopularExtents.html):

        <script>
          dojo.require("esri.map");
          dojo.require("esri.graphic");
          var _map;
          var _intervalFunction;
          var _currentlyAddedGraphics = [];
	      esri.config.defaults.io.proxyUrl = "proxy.ashx";

     D. Open the application in a web browser and follow the instructions on the page.

2. Services Dashboard
---------------------
This application depicts the statistics usage for service. The instance count chart continuously
plots the current instances. The pie chart plots the total number of errors, warnings, and successes
that are logged on the server for that service. Finally, the gauge plots the average
response time for each request.

In order to use this application, you'll need to do the following:

     A. Configure a proxy for the application. This is required. By default, the application includes its
	own proxy (proxy.ashx) which works with IIS web servers. To use the default proxy with IIS, modify
	the proxy.config file in the root folder of the demo application folder to match the URL of the machine hosting IIS:

        <serverUrl url="http://code.esri.com/" 
                   matchAll="true" 
                   dynamicToken="true"></serverUrl>

	Once you have modified the proxy, open the application HTML (ServicesDashboard.html) and modify the defaultURL property
	to match the administrative URL of your server:

        var protoConfig = {
          defaultURL: "http://code.esri.com/arcgis/admin",
          proxyURL: "proxy.ashx"
        }

     B. If you are deploying this application to a Java web server or want to use your own proxy,
	skip A above and replace the esri.config.defaults.io.proxyUrl property with the URL
	to your proxy in the application HTML (PopularExtents.html):

        <script>
          dojo.require("esri.map");
          dojo.require("esri.graphic");
          var _map;
          var _intervalFunction;
          var _currentlyAddedGraphics = [];
	      esri.config.defaults.io.proxyUrl = "proxy.ashx";

	Then, open the application HTML (ServicesDashboard.html) and modify the defaultURL and proxyURL properties
	to match the URLs to your server and proxy:

        var protoConfig = {
          defaultURL: "http://code.esri.com/arcgis/admin",
          proxyURL: "proxy.ashx"
        }

     C. After completing A or B above, open the application and specify the URL to your server.
	Enter your administrative credentials to the server when prompted to do so.

