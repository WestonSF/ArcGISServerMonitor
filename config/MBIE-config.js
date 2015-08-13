var configOptions;

function initVariables() {
    configOptions = {
        // Title for site
        title: "MBIE ArcGIS Server Performance & Usage Stats",

        // Description for site
        description: "This site contains a number of useful applications enabling the ArcGIS administrator to view and analyse useful information about an ArcGIS Server site usage and performance. This information is displayed in the form of charts, maps and textual information.",

        // ArcGIS server site
        agsSite: {
            url: "http://nzpam-extwebsit.wd.govt.nz:6080/arcgis", // PROD - http://nzpam-arcgis.wd.govt.nz:6080/arcgis, PRE-PROD - http://nzpam-arcgispre.wd.govt.nz:6080/arcgis, SIT - http://nzpam-extwebsit.wd.govt.nz:6080/arcgis
            username: "siteadmin",
            password: "*****"
        },

        // Proxy to use
        proxyUrl: "http://nzpam-intwebsit.wd.govt.nz/proxy/proxy.ashx", // PROD - http://nzpam-intweb.wd.govt.nz/proxy/proxy.ashx, PRE-PROD - http://nzpam-intwebpre.wd.govt.nz/proxy/proxy.ashx, SIT - http://nzpam-intwebsit.wd.govt.nz/proxy/proxy.ashx

        // Initial map extent
        initialExtent: { xmin: 89980, xmax: 3249111, ymin: 5313295, ymax: 6419256 },

        // Spatial reference
        spatialReference: { WKID: 2193, name: "NZTM" },

        // Basemap wrap around
        wraparound180: false, 

        // Basemap to be used
        basemap: { id: "Streets", url: "http://services.arcgisonline.co.nz/arcgis/rest/services/Generic/newzealand/MapServer" },

        // Default dropdown options
        defaultService: "", // Full service name e.g. Environment/BathingSites.MapServer
        defaultFilter: "Last 24 Hours", // Last Hour, Last 24 Hours, Last Week or Last 30 Days
        defaultGraphic: "Polygon", // Polygon, Point or Hot Spot

        // Popular extent graphics
        polygonSymbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.0])),
        pointSymbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 14, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1), new dojo.Color([255, 0, 0, 0.25])),

        // ArcGIS Online hot spot analysis service or custom hot spot analysis service
        hotSpotAnalysisService: {
            enable: false,
            url: "http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindHotSpots",
            secure: true,
            tokenURL: "https://*****.maps.arcgis.com/sharing",
            // Username/password for ArcGIS Online - Needs to be an organisation account
            username: "*****",
            password: "*****"
        }   
    };
}
