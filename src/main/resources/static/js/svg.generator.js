var visualizer = {

    // fixed content
    stroke: { color: 'black', width: 2, linecap: 'round' },
    dashed: { color: 'black', width: 2, linecap: 'round', dasharray: '5,5' },
    marbleWidth: 30,
    marbleType: 'circle',

    initialize: function() {
        $('#svg-image').empty();
        $('.explanation').hide();
        this.events = this.getReactorEvents();

        if (this.draw) {
            this.draw.clear().size(300, this.events.length * 120).addTo('#svg-image');
        } else {
            this.draw = SVG().size(300, this.events.length * 120).addTo('#svg-image');
        }

        this.x = 30;
        this.y = 10;
    },

    generate: function() {
        var self = this;
        var addConnectors = false;
        this.initialize();

        if (this.events.length == 0) {
            return;
        }

        $.each(this.events, function( index, event ) {
            if (addConnectors) {
                self.connectToOperator();
            }
            self.drawOperator(event.name);
            self.drawTimeline();
            self.drawMarbles();
            addConnectors = true;
        });

        $('.explanation').show();
        $('html, body').animate({
            scrollTop: $('#visualization').offset().top
        });
    },

    getReactorEvents: function() {
        var self = this;
        var json = $('#analyzer-json').val();
        var raw;
        try {
            raw = JSON.parse(json);
        } catch(err) {
            return [];
        }
        var events = [];

        // the raw JSON contains tuples, so we need to make those easier to process
        $.each(raw, function( index, value ) {
            // obtain the keys for this set of results and loop through them
            var keys = Object.keys(value.results);
            $.each(keys, function( index, tupleKey ) {
                var event = {
                    name: '',
                    values: []
                }
                event.name = self.convertTupleKey(tupleKey);
                event.values = value.results[tupleKey];
                events.push(event);
            });
        });

        return events;
    },

    convertTupleKey: function(tuple) {
        // strip surrounding square braces
        var text = tuple.substring(1, tuple.length-2).replace(' ', '');
        text = text.split(',');
        return text[1].startsWith('source(') ? text[0] : text [1];
    },

    drawOperator: function(text) {
        var rect = this.draw.rect(175, 40).fill('white').move(this.x, this.y).stroke(this.stroke);
        var text = this.draw.text(text);
        text.move(this.x + ((rect.width() - text.length())/2), this.y + 10);
    },

    drawTimeline: function() {
        this.x = this.x - 20;
        this.y = this.y + 80;
        var line = this.draw.line(0, 0, 250, 0).move(this.x, this.y).stroke(this.stroke);
        this.draw.line(0, 0, 10, -5).move(line.width() + this.x - 10, this.y).stroke(this.stroke);
        this.draw.line(-10, -5, 0, 0).move(line.width() + this.x - 10, this.y - 5).stroke(this.stroke);
        this.draw.line(0, 10, 0, 0).move(line.width() + this.x - 40, this.y - 5).stroke(this.stroke);
    },

    drawMarbles: function() {
        this.y = this.y - 15;
        width = this.marbleWidth;

        if (this.marbleType == 'circle') {
            this.draw.circle(width).fill('#C2185B').move(this.x + 30, this.y).stroke(this.stroke);
            this.draw.circle(width).fill('#00796B').move(this.x + 90, this.y).stroke(this.stroke);
            this.draw.circle(width).fill('#FBC02D').move(this.x + 150, this.y).stroke(this.stroke);
        } else if (this.marbleType == 'square') {
            this.draw.rect(width, width).fill('#C2185B').move(this.x + 30, this.y).stroke(this.stroke);
            this.draw.rect(width, width).fill('#00796B').move(this.x + 90, this.y).stroke(this.stroke);
            this.draw.rect(width, width).fill('#FBC02D').move(this.x + 150, this.y).stroke(this.stroke);
        }

        this.connectToMarbles()
    },

    connectToMarbles: function() {
        this.y = this.y - 25;
        this.draw.line(0, 25, 0, 0).move(this.marbleWidth + this.x + 15, this.y).stroke(this.dashed);
        this.draw.line(0, 0, -5, -5).move(this.marbleWidth + this.x + 10, this.y + 20).stroke(this.stroke);
        this.draw.line(5, -5, 0, 0).move(this.marbleWidth + this.x + 15, this.y + 20).stroke(this.stroke);

        this.draw.line(0, 25, 0, 0).move(this.marbleWidth + this.x + 75, this.y).stroke(this.dashed);
        this.draw.line(0, 0, -5, -5).move(this.marbleWidth + this.x + 70, this.y + 20).stroke(this.stroke);
        this.draw.line(5, -5, 0, 0).move(this.marbleWidth + this.x + 75, this.y + 20).stroke(this.stroke);

        this.draw.line(0, 25, 0, 0).move(this.marbleWidth + this.x + 135, this.y).stroke(this.dashed);
        this.draw.line(0, 0, -5, -5).move(this.marbleWidth + this.x + 130, this.y + 20).stroke(this.stroke);
        this.draw.line(5, -5, 0, 0).move(this.marbleWidth + this.x + 135, this.y + 20).stroke(this.stroke);
    },

    connectToOperator: function() {
        this.y = this.y + 55;
        this.draw.line(0, 25, 0, 0).move(this.marbleWidth + this.x + 15, this.y).stroke(this.dashed);
        this.draw.line(0, 0, -5, -5).move(this.marbleWidth + this.x + 10, this.y + 20).stroke(this.stroke);
        this.draw.line(5, -5, 0, 0).move(this.marbleWidth + this.x + 15, this.y + 20).stroke(this.stroke);

        this.draw.line(0, 25, 0, 0).move(this.marbleWidth + this.x + 75, this.y).stroke(this.dashed);
        this.draw.line(0, 0, -5, -5).move(this.marbleWidth + this.x + 70, this.y + 20).stroke(this.stroke);
        this.draw.line(5, -5, 0, 0).move(this.marbleWidth + this.x + 75, this.y + 20).stroke(this.stroke);

        this.draw.line(0, 25, 0, 0).move(this.marbleWidth + this.x + 135, this.y).stroke(this.dashed);
        this.draw.line(0, 0, -5, -5).move(this.marbleWidth + this.x + 130, this.y + 20).stroke(this.stroke);
        this.draw.line(5, -5, 0, 0).move(this.marbleWidth + this.x + 135, this.y + 20).stroke(this.stroke);

        this.x = this.x + 20;
        this.y = this.y + 25;
    }
};