var util = require("util");
var _ = require("lodash");
var nc = require("ncurses");

function Window(options){
    this.window = new nc.Window(nc.lines, nc.cols);
    this.window.scrollok(true);
    this.window.setscrreg(1, this.window.height-3);
    this.header = "";
    this.window.inbuffer = "";
    var self = this;
    var operations = get_operations(this.window);
    var commands = get_commands(this, options);

    this.window.on("inputChar", function(c, i){
        if((i === 127 || i === nc.keys.BACKSPACE) && self.window.curx > 0)
            operations.backspace();
        else if(i === nc.keys.DEL)
            operations.delete();
        else if(i === nc.keys.LEFT && self.window.curx > 0)
            operations.left();
        else if(i === nc.keys.RIGHT && self.window.curx < self.window.inbuffer.length)
            operations.right();
        else if(i === nc.keys.END)
            operations.end();
        else if(i === nc.keys.HOME)
            operations.home();
        else if(i === nc.keys.NEWLINE){
            if(self.window.inbuffer.indexOf("/") === 0){
                var command_end = self.window.inbuffer.indexOf(" ");
                if(command_end === -1)
                    command_end = self.window.inbuffer.length;

                var command = self.window.inbuffer.substring(1, command_end);
                var line = self.window.inbuffer.substring(command_end, self.window.inbuffer.length);

                if(!_.isEmpty(command) && _.has(commands, command))
                    commands[command](line);
                else if(!_.isEmpty(command) && !_.has(commands, command))
                    self.append_line(["Command", self.window.inbuffer.substring(0, self.window.inbuffer.indexOf(" ")), "not found!"].join(" "));
            }

            self.window.inbuffer = "";
            self.reset_cursor();
        }
        else if(i >= 32 && i <= 126 && self.window.curx < self.window.width-1){
            self.window.inbuffer = self.window.inbuffer.slice(0, self.window.curx) + c + self.window.inbuffer.slice(self.window.curx);

            if(self.window.curx < self.window.inbuffer.length){
                self.window.insch(i);
                self.window.cursor(self.window.height - 1, self.window.curx + 1);
            }
            else
                self.window.addch(i);

            self.window.refresh();
        }
    });

    this.window.hline(this.window.height-2, 0, this.window.width);
    this.append_line("Name", { row: 3, column: 10 , color: 7 });
    this.append_line("Symbol", { row: 3, column: 40, color: 7 });
    this.append_line("Close", { row: 3, column: 55, color: 7 });
    this.append_line("Open", { row: 3, column: 70, color: 7 });
    this.append_line("Bid", { row: 3, column: 85, color: 7 });
    this.append_line("Ask", { row: 3, column: 100, color: 7 });
    this.append_line("Price", { row: 3, column: 115, color: 7 });
    this.window.hline(4, 0, this.window.width);
    this.reset_cursor();
    this.set_header(["Tckr v", options.version, " - ", options.name].join(""));
}

// resets cursor
Window.prototype.reset_cursor = function(){
    this.window.cursor(this.window.height-1, 0);
    this.window.deleteln();
    this.window.showCursor = true;
    this.window.refresh();
}

// append line
Window.prototype.append_line = function(message, options){
    var curx = this.window.curx;
    var cury = this.window.cury;
    options = _.defaults(options, { color: 0 });

    this.window.cursor(this.window.height-3, 0);
    this.window.attron(nc.colorPair(options.color));

    if(_.has(options, "row") && _.has(options, "column"))
        this.window.print(options.row, options.column, message);
    else
        this.window.print(message);

    this.window.attroff(nc.colorPair(options.color));
    this.window.cursor(cury, curx);
    this.window.refresh();
}

// set header
Window.prototype.set_header = function(header){
    if(!_.isUndefined(header))
        this.header = header;

    var curx = this.window.curx;
    var cury = this.window.cury;

    this.window.cursor(0, 0);
    this.window.clrtoeol();
    this.window.centertext(0, this.header);

    this.window.cursor(cury, curx);

    this.window.refresh();
}

var current_line = 5;
var lines = {};

var get_commands = function(window, options){
    return {

        add: function(line){
            var symbol = line.split(" ")[1];
            options.api.streamQuotes(symbol, { filter: ["Name", "Symbol", "PreviousClose", "Open", "Bid", "Ask", "LastTradePriceOnly"] }, function(stream){

                var last_bid;
                var last_ask;
                var last_price;

                stream.on(symbol, function(quote){
                    if(!_.isNull(quote)){
                        if(!_.has(lines, symbol)){
                            current_line++;
                            lines[symbol] = current_line;
                            var bid_color = 0;
                            var ask_color = 0;
                            var price_color = 0;
                        }
                        else{
                            var curx = window.window.curx;
                            var cury = window.window.cury;
                            window.window.cursor(lines[symbol], 0);
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

                        window.append_line(quote.Name, { row: lines[symbol], column: 10 });
                        window.append_line(quote.Symbol, { row: lines[symbol], column: 40 });

                        if(!_.isNull(quote.PreviousClose))
                            window.append_line(["$", quote.PreviousClose].join(""), { row: lines[symbol], column: 55 });
                        else
                            window.append_line("N/A", { row: lines[symbol], column: 55 });

                        if(!_.isNull(quote.Open))
                            window.append_line(["$", quote.Open].join(""), { row: lines[symbol], column: 70 });
                        else
                            window.append_line("N/A", { row: lines[symbol], column: 70 });

                        if(!_.isNull(quote.Bid))
                            window.append_line(["$", quote.Bid].join(""), { row: lines[symbol], column: 85, color: bid_color });
                        else
                            window.append_line("N/A", { row: lines[symbol], column: 85 });

                        if(!_.isNull(quote.Ask))
                            window.append_line(["$", quote.Ask].join(""), { row: lines[symbol], column: 100, color: ask_color });
                        else
                            window.append_line("N/A", { row: lines[symbol], column: 100 });

                        if(!_.isNull(quote.LastTradePriceOnly))
                            window.append_line(["$", quote.LastTradePriceOnly].join(""), { row: lines[symbol], column: 115, color: price_color });
                        else
                            window.append_line("N/A", { row: lines[symbol], column: 115 });
                    }
                });
            });
        },

        exit: function(line){
            process.exit(0);
        }
    }
}

var get_operations = function(window){
    return {
        backspace: function(){
            window.inbuffer = window.inbuffer.substring(0, window.curx - 1) + window.inbuffer.substring(window.curx);
            window.delch(window.height-1, window.curx - 1);
            window.refresh();
        },

        delete: function(){
            window.inbuffer = window.inbuffer.substring(0, window.curx) + window.inbuffer.substring(window.curx + 1);
            window.delch(window.height-1, window.curx);
            window.refresh();
        },

        left: function(){
            window.cursor(window.height-1, window.curx-1);
            window.refresh();
        },

        right: function(){
            window.cursor(window.height-1, window.curx+1);
            window.refresh();
        },

        end: function(){
            window.cursor(window.height-1, window.inbuffer.length);
            window.refresh();
        },

        home: function(){
            window.cursor(window.height-1, 0);
            window.refresh();
        }
    }
}

module.exports = Window;
