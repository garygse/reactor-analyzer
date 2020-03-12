var visualizer = {

    // fixed content
    stroke: { color: 'black', width: 2, linecap: 'round' },
    dashed: { color: 'black', width: 2, linecap: 'round', dasharray: '5,5' },
    marbleWidth: 30,
    marbleType: 'circle',
    // TODO: complete these descriptions (currently simply pulling from Java Docs)
    descriptions: {
        FluxArray: 'Emits the contents of a wrapped (shared) array.',
        FluxCallable: 'For each subscriber, a Supplier is invoked and the returned value emitted.',
        FluxCombineLatest: 'Combines the latest values from multiple sources through a function.',
        FluxDistinctFuseable: 'For each Subscriber, track elements from this Flux that have been seen and filter out duplicates.',
        FluxFlatMap: 'Transform the elements emitted by this Flux asynchronously into Publishers, then flatten these inner publishers into a single Flux through merging, which allow them to interleave.',
        FluxInterval: 'Emits long values starting with 0 and incrementing at specified time intervals on the global timer.',
        FluxIterable: 'Emits the contents of an Iterable source.',
        FluxMapFuseable: 'Maps the values of the source publisher one-on-one via a mapper function.',
        FluxRange: 'Emits a range of integer values.',
        FluxTakeFuseable: 'Takes only the first N values from the source Publisher. If N is zero, the subscriber gets completed if the source completes, signals an error or signals its first value (which is not relayed though).',
        FluxZip: 'Repeatedly takes one item from all source Publishers and runs it through a function to produce the output item.',
        MonoCollectList: 'Buffers all values from the source Publisher and emits it as a single List.',
        MonoFirst: 'Given a set of Publishers, the Publisher that responds first with any signal is used.',
        MonoFlattenIterable: 'Concatenates values from Iterable sequences generated via a mapper function.',
        MonoJust: 'Emits a single item.',
        MonoMapFuseable: 'Maps the values of the source publisher one-on-one via a mapper function.'
    },

    initialize: function() {
        $('#svg-image').empty();
        $('.explanation').empty();
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
        this.initialize();

        if (this.events.length == 0) {
            return;
        }

        $.each(this.events, function( index, event ) {
            if (index > 0) {
                self.connectToOperator();
            }
            self.drawOperator(event.name);
            self.drawTimeline();
            self.drawMarbles();
        });

        this.generateExplanation();

        $('html, body').animate({
            scrollTop: $('.visualization').offset().top
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
                    class: '',
                    values: []
                }
                event.name = self.convertTupleKey(tupleKey);
                event.class = self.convertTupleKey(tupleKey, 0);
                event.values = value.results[tupleKey];
                events.push(event);
            });
        });

        return events;
    },

    convertTupleKey: function(tuple, pos) {
        // strip surrounding square braces
        var text = tuple.substring(1, tuple.length-2).replace(' ', '');
        text = text.split(',');
        return typeof pos !== 'undefined' ? text[pos] : text[1].startsWith('source(') ? text[0] : text [1];
    },

    generateExplanation: function() {
        var self = this;
        var section = $('.explanation');

        $.each(this.events, function( index, event ) {
            section.append(`<p class="explanation-header">${event.name}</p>`);
            section.append(`<p class="explanation-description">${self.descriptions[event.class]}</p>`);

            var isObject = self.isObject(event.values[0]);
            var values = isObject ? '<ul class="explanation-pipeline-data">' : '<p>';

            $.each(event.values, function( index, value ) {
                if (index > 0 && !isObject) {
                    values += ', ';
                }

                if (isObject) {
                    var json = JSON.stringify(value, null, '  ');
                    values += `<li><div class="collapsible">${json}</div>
                                   <div class="content">
                                     <pre><code>${json}</code></pre>
                                   </div>
                               </li>`;
                } else {
                    values += value;
                }
            });

            values += isObject ? '</ul>' : '</p>';
            section.append(`<div class="visualization"><p class="explanation-pipeline">Pipeline Output</p>${values}</div>`);
        });

        $('.explanation-container').show();
        this.enableCollapsibleElements();
    },

    enableCollapsibleElements: function() {
        var coll = document.getElementsByClassName("collapsible");
        var i;

        for (i = 0; i < coll.length; i++) {
          coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
              content.style.maxHeight = null;
            } else {
              content.style.maxHeight = content.scrollHeight + "px";
            }
          });
        }
    },

    isObject: function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
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