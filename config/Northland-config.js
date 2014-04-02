var configOptions;

function initVariables() {
    configOptions = {
        // Title for site
        title: "Northland ArcGIS Server Performance Stats",

        // Description for site
        description: "This site contains a number of applications that have been built using Javascript that can query the ArcGIS Server Admin API enabling the ArcGIS administrator to view and analyse useful information about the server usage and performance. This information is displayed in the form of charts, maps and textual information. Note: The maximum number of log records is 10,000, so some statistics are limited by this.",

        // ArcGIS server site
        agsSite: "http://gis.nrc.govt.nz/arcgis",

        // ArcGIS server token - HTTP referer of where application is hosted - Token: ee7nQxv656QWrH2LvX6lL_DYXiMxKl3XsR_pAHdYnVf8j1xb7ijDmbO5FuKJythnPgFSKdJEfQid59p-r_MIAw.. - Expires 15/01/2015
        agsToken: "ee7nQxv656QWrH2LvX6lL_DYXiMxKl3XsR_pAHdYnVf8j1xb7ijDmbO5FuKJythnPgFSKdJEfQid59p-r_MIAw..",

        // Proxy to use
        proxyUrl: "http://gis.nrc.govt.nz/proxy/proxy.ashx",

        // Initial map extent
        initialExtent: { xmin: 1585000, xmax: 1813000, ymin: 5980000, ymax: 6127000 },

        // Spatial reference
        spatialReference: { WKID: 2193, name: "NZTM" },

        // Basemap wrap around
        wraparound180: false, 

        // Basemap to be used
        basemap: { id: "Topographic", url: "http://gis.nrc.govt.nz/arcgis/rest/services/Basemaps/TopoEsri/MapServer" },

        // Default dropdown options
        defaultService: "Environment/BathingSites.MapServer", // Full service name e.g. Environment/BathingSites.MapServer
        defaultFilter: "Last 24 Hours", // Last Hour, Last 24 Hours, Last Week or Last 30 Days
        defaultGraphic: "Polygon", // Polygon, Point or Hot Spot

        // Popular extent graphics
        polygonSymbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.0])),
        pointSymbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 14, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([255, 0, 0, 0.25])),

        // ArcGIS Online hot spot analysis service or custom hot spot analysis service
        hotSpotAnalysisService: {
            enable: true,
            url: "http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindHotSpots",
            secure: true,
            tokenURL: "https://nrcgis.maps.arcgis.com/sharing",
            // Username/password for ArcGIS Online - Needs to be an organisation account to have access to the network services
            username: "NorthlandGIS",
            password: "*****"
        }   
    };
}
