var fs = require("fs");
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
                a: function(line){
                    var symbol = line.split(" ")[1];
                    options.api.streamQuotes(symbol, function(stream){

                        var last_low;
                        var last_high;
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

                                    if(parseFloat(quote.lo) < last_low)
                                        var low_color = 2;
                                    else
                                        var low_color = 0;

                                    if(parseFloat(quote.hi) > last_high)
                                        var high_color = 3;
                                    else
                                        var high_color = 0;

                                    if(parseFloat(quote.l) > last_price)
                                        var price_color = 3;
                                    else if(parseFloat(quote.l) < last_price)
                                        var price_color = 2;
                                    else
                                        var price_color = 0;

                                    last_price = parseFloat(quote.l);
                                }

                                window.append_line(quote.name, { row: window.lines[symbol], column: 10 });
                                window.append_line(quote.t, { row: window.lines[symbol], column: 35 });
                                window.append_line(quote.e, { row: window.lines[symbol], column: 50 });

                                if(!_.isEmpty(quote.op))
                                    window.append_line(["$", quote.op].join(""), { row: window.lines[symbol], column: 65 });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 65 });

                                if(!_.isEmpty(quote.lo))
                                    window.append_line(["$", quote.lo].join(""), { row: window.lines[symbol], column: 80, color: low_color });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 80 });

                                if(!_.isEmpty(quote.hi))
                                    window.append_line(["$", quote.hi].join(""), { row: window.lines[symbol], column: 95, color: high_color });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 95 });

                                if(!_.isEmpty(quote.l))
                                    window.append_line(["$", quote.l].join(""), { row: window.lines[symbol], column: 110, color: price_color });
                                else
                                    window.append_line("N/A", { row: window.lines[symbol], column: 110 });
                            }
                        });
                    });
                },

                o: function(line){
                    var root = [process.env.HOME, ".tckr"].join("/");
                    line = line.split(" ");
                    if(line.length > 1){
                        fs.readFile([root, line[1]].join("/"), function(err, config){
                            if(err)
                                window.append_line(["Could not open", line[1], "!"].join(""), { color: 2, duration: 3000 });
                            else{
                                try{
                                    config = JSON.parse(config);
                                    window.lines = config;
                                    _.each(_.keys(config), function(symbol){
                                        window.controls.commands.a(["", symbol].join(" "));
                                    });
                                    window.set_header(["Tckr v", options.version, " - ", line[1]].join(""));
                                }
                                catch(e){
                                    window.append_line(["Could not parse", line[1], "!"].join(""), { color: 2, duration: 3000 });
                                }
                            }
                        });
                    }
                    else
                        window.append_line(["Please provide a file name!"].join(""), { color: 2, duration: 3000 });
                },

                w: function(line){
                    var root = [process.env.HOME, ".tckr"].join("/");
                    line = line.split(" ");
                    if(line.length > 1){
                        fs.mkdir(root, function(err){
                            fs.writeFile([root, line[1]].join("/"), JSON.stringify(window.lines), function(err){
                                if(err)
                                    window.append_line(["Could not save ", line[1], "!"].join(""), { color: 2, duration: 3000 });
                                else
                                    window.append_line([line[1], "saved!"].join(" "), { color: 3, duration: 3000 });
                            });
                        });
                    }
                    else
                        window.append_line(["Please provide a file name!"].join(""), { color: 2, duration: 3000 });
                },

                q: function(line){
                    process.exit(0);
                }
            }
        }

        var valid_commands = _.intersection(options.commands, _.keys(window.controls.commands));
        window.controls.commands = _.pick(window.controls.commands, valid_commands);
    }

}

