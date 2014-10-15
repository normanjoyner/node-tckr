var _ = require("lodash");
var Window = require([__dirname, "window"].join("/"));

module.exports = {

    create: function(options){
        this.windows[options.name] = new Window(options);
        this.set_controls(this.windows[options.name], options);
        this.setup(this.windows[options.name], options);
        this.windows[options.name].accept_input();
    },

    windows: {},

    setup: function(window, options){
        if(_.has(options, "setup") && _.isFunction(options.setup))
            options.setup(window);
    },

    set_controls: function(window, options){
        window.controls = {
            input: {
                backspace: function(){
                    window.window.inbuffer = window.window.inbuffer.substring(0, window.window.curx - 1) + window.window.inbuffer.substring(window.window.curx);
                    window.window.delch(window.window.height-1, window.window.curx - 1);
                    window.window.refresh();
                },

                delete: function(){
                    window.window.inbuffer = window.window.inbuffer.substring(0, window.window.curx) + window.window.inbuffer.substring(window.window.curx + 1);
                    window.window.delch(window.window.height-1, window.window.curx);
                    window.window.refresh();
                },

                left: function(){
                    window.window.cursor(window.window.height-1, window.window.curx-1);
                    window.window.refresh();
                },

                right: function(){
                    window.window.cursor(window.window.height-1, window.window.curx+1);
                    window.window.refresh();
                },

                end: function(){
                    window.window.cursor(window.window.height-1, window.window.inbuffer.length);
                    window.window.refresh();
                },

                home: function(){
                    window.window.cursor(window.window.height-1, 0);
                    window.window.refresh();
                }
            },

            commands: {
                add: function(line){
                    var symbol = line.split(" ")[1];
                    options.api.streamQuotes(symbol, { filter: ["Name", "Symbol", "PreviousClose", "Open", "Bid", "Ask", "LastTradePriceOnly"] }, function(stream){

                        var last_bid;
                        var last_ask;
                        var last_price;

                        stream.on(symbol, function(quote){
                            if(!_.isNull(quote)){
                                if(!_.has(window.lines, symbol)){
                                    window.current_line++;
                                    window.lines[symbol] = window.current_line;
                                }
                                else{
                                    var curx = window.window.curx;
                                    var cury = window.window.cury;
                                    window.window.cursor(window.lines[symbol], 0);
                                    window.window.clrtoeol()
                                    window.window.cursor(cury, curx);

                                    if(parseFloat(quote.Bid) > last_bid)
                                        var bid_color = 3;
                                    else if(parseFloat(quote.Bid) < last_bid)
                                        var bid_color = 2;
                                    else
                                        var bid_color = 0;

                                    last_bid = parseFloat(quote.Bid);

                                    if(parseFloat(quote.Ask) > last_ask)
                                        var ask_color = 3;
                                    else if(parseFloat(quote.Ask) < last_ask)
                                        var ask_color = 2;
                                    else
                                        var ask_color = 0;

                                    last_ask = parseFloat(quote.Ask);

                                    if(parseFloat(quote.LastTradePriceOnly) > last_price)
                                        var price_color = 3;
                                    else if(parseFloat(quote.LastTradePriceOnly) < last_price)
                                        var price_color = 2;
                                    else
                                        var price_color = 0;

                                    last_price = parseFloat(quote.LastTradePriceOnly);
                                }

                                window.append_line(quote.Name, { row: window.lines[symbol], column: 10 });
                                window.append_line(quote.Symbol, { row: window.lines[symbol], column: 40 });
                                if(!_.isNull(quote.PreviousClose))
                                    window.append_line(["$", quote.PreviousClose].join(""), { row: window.lines[symbol], column: 55 });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 55 });

                                if(!_.isNull(quote.Open))
                                    window.append_line(["$", quote.Open].join(""), { row: window.lines[symbol], column: 70 });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 70 });

                                if(!_.isNull(quote.Bid))
                                    window.append_line(["$", quote.Bid].join(""), { row: window.lines[symbol], column: 85, color: bid_color });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 85 });

                                if(!_.isNull(quote.Ask))
                                    window.append_line(["$", quote.Ask].join(""), { row: window.lines[symbol], column: 100, color: ask_color });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 100 });

                                if(!_.isNull(quote.LastTradePriceOnly))
                                    window.append_line(["$", quote.LastTradePriceOnly].join(""), { row: window.lines[symbol], column: 115, color: price_color });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 115 });
                            }
                        });
                    });
                },

                exit: function(line){
                    process.exit(0);
                }
            }
        }

        var valid_commands = _.intersection(options.commands, _.keys(window.controls.commands));
        window.controls.commands = _.pick(window.controls.commands, valid_commands);
    }

}

