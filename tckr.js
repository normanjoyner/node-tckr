var _ = require("lodash");
var pkg = require([__dirname, "package"].join("/"));
var display = require([__dirname, "lib", "display"].join("/"));
var MarketMuster = require("marketmuster");

function Tckr(options){
    this.load_configuration(options);
}

Tckr.prototype.configuration = {};

Tckr.prototype.load_configuration = function(options){
    if(_.isUndefined(options))
        options = {};

    this.options = _.defaults(options, {
        version: pkg.version,
        api: new MarketMuster()
    });
}

Tckr.prototype.initialize = function(){
    var options = _.merge(this.options, {
        name: "* unsaved *",
        setup: function(window){
            window.current_line = 5;
            window.lines = {};
            window.append_line("Name", { row: 3, column: 10 , color: 7 });
            window.append_line("Symbol", { row: 3, column: 40, color: 7 });
            window.append_line("Close", { row: 3, column: 55, color: 7 });
            window.append_line("Open", { row: 3, column: 70, color: 7 });
            window.append_line("Bid", { row: 3, column: 85, color: 7 });
            window.append_line("Ask", { row: 3, column: 100, color: 7 });
            window.append_line("Price", { row: 3, column: 115, color: 7 });
        },
        commands: ["exit", "add"]
    });

    display.create(options);
}

module.exports = Tckr;
