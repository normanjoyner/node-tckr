var _ = require("lodash");
var nconf = require("nconf");
var MarketMuster = require("marketmuster");
var marketmuster = new MarketMuster();
var colors = require("colors");

nconf.argv();

nconf.argv({
    "source": {
        describe: "Datasource to pull from",
        demand: true,
        default: "yahoo"
    },
    "watch": {
        describe: "Watch streaming quotes",
        demand: false,
        default: false
    }
});

var args = nconf.stores.argv.store._;

if(args.length == 0){
    console.log("Please provide a symbol!");
    process.exit(1);
}
else
    var symbol = args[0];

var sources = {
    yahoo: {
        filter: ["Name", "Symbol", "LastTradePriceOnly"],
        price_key: "LastTradePriceOnly"
    },
    markitondemand: {
        filter: ["Name", "Symbol", "LastPrice"],
        price_key: "LastPrice"
    }
}

if(!_.contains(_.keys(sources), nconf.get("source"))){
    console.log(["Please select from one of the following datasources:", _.keys(sources).join(", ")].join(" "));
    process.exit(1)
}

var options = {
    datasource: nconf.get("source")
}

marketmuster.config(options);

if(nconf.get("watch")){
    marketmuster.streamQuotes(symbol, { filter: sources[nconf.get("source")].filter }, function(stream){
        var previous_price = null;
        stream.on(symbol, function(quote){
            process.stdout.clearLine();
            process.stdout.cursorTo(0);

            if(!_.isNull(quote)){
                var price = parseFloat(quote[sources[nconf.get("source")].price_key]);

                if(price < previous_price)
                    var string_price = _(price).toString().red;
                else if(price > previous_price)
                    var string_price = _(price).toString().green;
                else
                    var string_price = _(price).toString();

                previous_price = price;

                process.stdout.write([quote.Name, " (", quote.Symbol, ") - $", string_price].join(""));
            }
        });
    });
}
else{
    marketmuster.getQuotes(symbol, { filter: sources[nconf.get("source")].filter }, function(quote){
        var quote = quote[symbol];
        if(!_.isNull(quote))
            console.log([quote.Name, " (", quote.Symbol, ") - $", quote[sources[nconf.get("source")].price_key]].join(""));
    });
}
