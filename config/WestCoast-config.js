var configOptions;

function initVariables() {
    configOptions = {
        // Title for site
        title: "WCRC ArcGIS Server Performance & Usage Stats",

        // Description for site
        description: "This site contains a number of useful applications enabling the ArcGIS administrator to view and analyse useful information about an ArcGIS Server site usage and performance. This information is displayed in the form of charts, maps and textual information.",

        // ArcGIS server site
        agsSite: {
            url: "http://gis.wcrc.govt.nz/arcgis",
            username: "administrator",
            password: "*****"
        },

        // Proxy to use
        proxyUrl: "http://gis.wcrc.govt.nz/proxy/proxy.ashx", // For testing use "proxy/proxy.ashx"

        // Initial map extent
        initialExtent: { xmin: 1044662, xmax: 1759038, ymin: 5052697, ymax: 5528948 },

        // Spatial reference
        spatialReference: { WKID: 2193, name: "NZTM" },

        // Basemap wrap around
        wraparound180: false, 

        // Basemap to be used
        basemap: { id: "Topographic", url: "http://gis.wcrc.govt.nz/arcgis/rest/services/Basemaps/TopoEsri/MapServer" },

        // Default dropdown options
        defaultService: "PropertyAndBoundaries/Property.MapServer", // Full service name e.g. Environment/BathingSites.MapServer
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
            tokenURL: "https://wcrc.maps.arcgis.com/sharing",
            // Username/password for ArcGIS Online - Needs to be an organisation account
            username: "EagleTechnologyWCRC",
            password: "*****"
        }   
    };
}
