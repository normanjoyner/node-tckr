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
            window.append_line("Symbol", { row: 3, column: 35, color: 7 });
            window.append_line("Exchange", { row: 3, column: 50, color: 7 });
            window.append_line("Open", { row: 3, column: 65, color: 7 });
            window.append_line("Low", { row: 3, column: 80, color: 7 });
            window.append_line("High", { row: 3, column: 95, color: 7 });
            window.append_line("Price", { row: 3, column: 110, color: 7 });
        },
        commands: ["a", "q", "w", "o"]
    });

    display.create(options);
}

module.exports = Tckr;
