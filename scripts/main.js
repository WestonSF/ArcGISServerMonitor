require([
  "dojo/parser",
  "scripts/serviceView",
  "esri/IdentityManagerDialog",
  "esri/request",
  "dojo/domReady!"
],

// Main function executed when DOM ready
function (parser, serviceView, IdentityManager, request) {
    // Set the title
    document.title = configOptions.Title;
    $("#title").text(configOptions.Title);

    esriConfig.defaults.io.timeout = 300000;
    esriConfig.defaults.io.proxyUrl = protoConfig.proxyURL;
    esri.config = esriConfig.defaults;
    parser.parse();

    // Hide the progress bar for loading the app
    $("#appLoadBar").hide();
});