var util = require("util");
var _ = require("lodash");
var nc = require("ncurses");

function Window(options){
    this.window = new nc.Window(nc.lines, nc.cols);
    this.window.scrollok(true);
    this.window.setscrreg(1, this.window.height-3);
    this.header = "";
    this.window.inbuffer = "";

    this.window.hline(this.window.height-2, 0, this.window.width);
    this.window.hline(4, 0, this.window.width);
    this.reset_cursor();
    this.set_header(["Tckr v", options.version, " - ", options.name].join(""));

    process.on("SIGINT", function(){
        nc.cleanup();
        process.exit(0);
    });
}

Window.prototype.accept_input = function(){
    var self = this;

    this.window.on("inputChar", function(c, i){
        if((i === 127 || i === nc.keys.BACKSPACE) && self.window.curx > 0)
            self.controls.input.backspace();
        else if(i === nc.keys.DEL)
            self.controls.input.delete();
        else if(i === nc.keys.LEFT && self.window.curx > 0)
            self.controls.input.left();
        else if(i === nc.keys.RIGHT && self.window.curx < self.window.inbuffer.length)
            self.controls.input.right();
        else if(i === nc.keys.END)
            self.controls.input.end();
        else if(i === nc.keys.HOME)
            self.controls.input.home();
        else if(i === nc.keys.NEWLINE){
            if(self.window.inbuffer.indexOf(":") === 0){
                var command_end = self.window.inbuffer.indexOf(" ");
                if(command_end === -1)
                    command_end = self.window.inbuffer.length;

                var command = self.window.inbuffer.substring(1, command_end);
                var line = self.window.inbuffer.substring(command_end, self.window.inbuffer.length);

                if(!_.isEmpty(command) && _.has(self.controls.commands, command))
                    self.controls.commands[command](line);
                else if(!_.isEmpty(command) && !_.has(self.controls.commands, command)){
                    self.append_line(["Command", self.window.inbuffer.substring(0, self.window.inbuffer.indexOf(" ")), "not found!"].join(" "), { color: 2, duration: 3000 });
                    nc.flash();
                }
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

    var self = this;
    if(_.has(options, "duration")){
        clearTimeout(self.window.message);
        self.window.message = setTimeout(function(){
            var curx = self.window.curx;
            var cury = self.window.cury;
            self.window.cursor(self.window.height-3, 0);
            self.window.clrtoeol();
            self.window.refresh();
            self.window.cursor(cury, curx);
        }, options.duration);
    }
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

module.exports = Window;
