var configOptions;

function initVariables() {
    configOptions = {
        // Title for site
        title: "KCDC ArcGIS Server Performance & Usage Stats",

        // Description for site
        description: "This site contains a number of useful applications enabling the ArcGIS administrator to view and analyse useful information about an ArcGIS Server site usage and performance. This information is displayed in the form of charts, maps and textual information.",

        // ArcGIS server site
        agsSite: {
            url: "http://svr-gisapps-1.kcdc.govt.nz:6080/arcgis",
            username: "administrator",
            password: "*****"
        },

        // Proxy to use
        proxyUrl: "http://svr-gisapps-1.kcdc.govt.nz/proxy/proxy.ashx", // For testing use "proxy/proxy.ashx"

        // Initial map extent
        initialExtent: { xmin: 1758925, xmax: 1780224, ymin: 5465909, ymax: 5479271 },

        // Spatial reference
        spatialReference: { WKID: 2193, name: "NZTM" },

        // Basemap wrap around
        wraparound180: false, 

        // Basemap to be used
        basemap: { id: "BaseMap", url: "http://services.arcgisonline.co.nz/arcgis/rest/services/Generic/newzealand/MapServer" },

        // Default dropdown options
        defaultService: "Property/Property.MapServer", // Full service name e.g. PropertyAndBoundaries/PropertyInternal.MapServer
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
            tokenURL: "https://kcdc.maps.arcgis.com/sharing",
            // Username/password for ArcGIS Online - Needs to be an organisation account
            username: "EagleTechnologyKCDC",
            password: "*****"
        }   
    };
}
