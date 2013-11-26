var configOptions;

function initVariables() {
    configOptions = {
        // Title in the web window
        webTitle: "Northland Regional Council Maps",

        // Image for bottom right
        logo: "<img src=\"images/logo/NRC_logo.JPG\" height=\"45\" width=\"125\">", 

        // ArcGIS server site
        agsSite: "http://gis.mstn.govt.nz/arcgis",

        // ArcGIS server token - HTTP referer - Token: nTOvVYNqePlLE6jjqRqmWO4h9qUYDDofR3mQFw-pKNeLTHNj14ruX29pJy5ABNnhZ_hIKuaBB8FaAa4t2MXTAw.. - Expires 23/08/2014
        agsToken: "nTOvVYNqePlLE6jjqRqmWO4h9qUYDDofR3mQFw-pKNeLTHNj14ruX29pJy5ABNnhZ_hIKuaBB8FaAa4t2MXTAw..",

        // Filter for selecting services to show
        agsQueryFilter: "{ \"services\": [\"PropertyAndBoundaries/PropertyInternal.MapServer\",\"PropertyAndBoundaries/PropertyPublic.MapServer\"], \"server\": [\"Rest\"] }",

        // Proxy to use
        proxyUrl: "http://gis.mstn.govt.nz/proxy/proxy.ashx",

        // Initial map extent
        initialExtent: { xmin: 1778634, xmax: 1856528, ymin: 5433543, ymax: 5473165 },

        // Spatial reference
        spatialReference: { WKID: 2193, name: "NZTM" },

        wraparound180: false, 

        // Basemap to be used
        basemap: { id: "Streets", url: "http://services.arcgisonline.co.nz/arcgis/rest/services/Generic/newzealand/MapServer" }
    };
}
