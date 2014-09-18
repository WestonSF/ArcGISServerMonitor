# ArcGIS Server Monitor

At ArcGIS for Server 10.1 a new architecture was implemented where all communication with the server was done over HTTP. A new
server admin API was built enabling access to administrative information about the server, services and usage. A number of applications
have been built using Javascript that can query this API enabling the ArcGIS administrator to view and analyse useful information
about the servers usage and performance. This information is displayed in the form of charts, maps and textual information.

Based off an application built [here](http://blogs.esri.com/esri/arcgis/2013/08/23/demo-applications-arcgis-server-for-administrators-sessions-at-the-2013-user-conference)

[Demo](http://gis.mstn.govt.nz/AGSMonitor)

![Screenshot](/images/Screenshot.jpg)


## Features

* Service average response time
* Service average draw time
* Service success and failures
* Number of draws for the past 30 days
* Map extent requests
* Filter statistics by time


## Libraries Used

* ArcGIS API for Javascript 3.7
* Dojo toolkit 1.8.3
* Bootstrap 3.0.2
* jQuery Javascript library 1.10.2


## Content Delivery Networks Used

* http://js.arcgis.com
* http://code.jquery.com


## Browser Support

* Internet Explorer 7+
* Google Chrome 1+
* Mozilla Firefox 1+
* Safari 3+
* Opera 1+


## Requirements

* Notepad or your favorite HTML editor
* Web browser with access to the Internet
* ArcGIS for Server 10.1+
* ArcGIS for Server logs set to FINE
* Admin access enabled on [SERVER]/arcgis or [SERVER]:6080/arcgis
* Web server to host on


## Installation Instructions

* Install proxy on web server
	* Copy the proxy folder to C:\inetpub\wwwroot
	* Convert directory to application in IIS
	* Update the parameter in the configuration file ("proxyUrl") to point to the proxy e.g. "'[SERVER]'/proxy/proxy.ashx"
* Set the ArcGIS for Server logs to be FINE
* Configure other options in the config.js to the environment
* Install ArcGIS Server Monitor on web server
	* Copy the folder to C:\inetpub\wwwroot
	* Convert directory to application in IIS


## Resources

* [LinkedIn](http://www.linkedin.com/in/sfweston)
* [GitHub](https://github.com/WestonSF)
* [Twitter](https://twitter.com/Westonelli)
* [Blog](http://westonelli.wordpress.com)
* [ArcGIS API for Javascript](https://developers.arcgis.com/en/javascript)
* [Python for ArcGIS](http://resources.arcgis.com/en/communities/python)


## Issues

Find a bug or want to request a new feature?  Please let me know by submitting an issue.


## Contributing

Anyone and everyone is welcome to contribute. 


## Licensing
Copyright 2014 - Shaun Weston

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.