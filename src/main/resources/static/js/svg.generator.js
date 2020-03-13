var visualizer = {

    // constants
    stroke: { color: 'black', width: 2, linecap: 'round' },
    dashed: { color: 'black', width: 2, linecap: 'round', dasharray: '5,5' },
    marbleWidth: 30,
    marbleType: 0,
    marbleTypes: ['circle', 'square'],
    // TODO: complete these descriptions (currently simply pulling from Java Docs)
    descriptions: {
        FluxArray: 'Emits the contents of a wrapped (shared) array.',
        FluxCallable: 'For each subscriber, a Supplier is invoked and the returned value emitted.',
        FluxCombineLatest: 'Combines the latest values from multiple sources through a function.',
        FluxConcatArray: 'Concatenates a fixed array of Publishers\' values.',
        FluxDelaySubscription: 'Delays the subscription to the main source until another Publisher signals a value or completes.',
        FluxDistinctFuseable: 'For each Subscriber, track elements from this Flux that have been seen and filter out duplicates.',
        FluxFilter: 'Filters out values that make a filter function return false.',
        FluxFilterFuseable: 'Filters out values that make a filter function return false.',
        FluxFirstEmitting: 'Given a set of source Publishers the values of that Publisher is forwarded to the subscriber which responds first with any signal.',
        FluxFlatMap: 'Transform the elements emitted by this Flux asynchronously into Publishers, then flatten these inner publishers into a single Flux through merging, which allow them to interleave.',
        FluxInterval: 'Emits long values starting with 0 and incrementing at specified time intervals on the global timer.',
        FluxIterable: 'Emits the contents of an Iterable source.',
        FluxMapFuseable: 'Maps the values of the source publisher one-on-one via a mapper function.',
        FluxMerge: 'Merges a fixed array of Publishers.',
        FluxOnErrorResume: 'Resumes the failed main sequence with another sequence returned by a function for the particular failure exception.',
        FluxRange: 'Emits a range of integer values.',
        FluxTakeFuseable: 'Takes only the first N values from the source Publisher. If N is zero, the subscriber gets completed if the source completes, signals an error or signals its first value (which is not relayed though).',
        FluxTimeout: 'Signals a timeout (or switches to another sequence) in case a per-item generated Publisher source fires an item or completes before the next item arrives from the main source.',
        FluxZip: 'Repeatedly takes one item from all source Publishers and runs it through a function to produce the output item.',
        MonoCollectList: 'Buffers all values from the source Publisher and emits it as a single List.',
        MonoDelay: 'Emits a single zero delayed by some time amount with a help of a ScheduledExecutorService instance or a generic function callback that wraps other form of async-delayed execution of tasks.',
        MonoDelaySubscription: 'Delays the subscription to the main source until another Publisher signals a value or completes.',
        MonoFilter: 'Filters out values that make a filter function return false.',
        MonoFilterFuseable: 'Filters out values that make a filter function return false.',
        MonoFirst: 'Given a set of Publishers, the Publisher that responds first with any signal is used.',
        MonoFlattenIterable: 'Concatenates values from Iterable sequences generated via a mapper function.',
        MonoJust: 'Emits a single item.',
        MonoMapFuseable: 'Maps the values of the source publisher one-on-one via a mapper function.',
        MonoOnErrorResume: 'Resumes the failed main sequence with another sequence returned by a function for the particular failure exception.',
        MonoTimeout: 'Signals a timeout (or switches to another sequence) in case a per-item generated Publisher source fires an item or completes before the next item arrives from the main source.'
    },

    initialize: function() {
        $('#svg-image').empty();
        $('.explanation').empty();
        $('.explanation-container').hide();
        this.events = this.getReactorEvents();
        this.marbleType = 0;

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
            self.checkMarbleType(event.class);
            self.drawOperator(event.name);
            self.drawTimeline(event.type);
            self.drawMarbles(event.type);
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
                    name: null,
                    class: null,
                    type: null,
                    values: []
                }
                event.name = self.convertTupleKey(tupleKey);
                event.class = self.convertTupleKey(tupleKey, 0);
                event.type = value.results[tupleKey][0].event;
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

            var isObject = self.isObject(event.values[0].result);
            var values = isObject ? '<ul class="explanation-pipeline-data">' : '<p>';

            $.each(event.values, function( index, value ) {
                if (index > 0 && !isObject) {
                    values += ', ';
                }

                if (isObject) {
                    var json = JSON.stringify(value.result, null, '  ');
                    values += `<li><div class="collapsible">${json}</div>
                                   <div class="content">
                                     <pre><code>${json}</code></pre>
                                   </div>
                               </li>`;
                } else {
                    values += value.result;
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

    checkMarbleType: function(cls) {
        if (cls.includes('Map')) {
            this.marbleType += 1;
            if (this.marbleType == this.marbleTypes.length) {
                this.marbleType = 0;
            }
        }
    },

    drawOperator: function(label) {
        var rect = this.draw.rect(175, 40).fill('white').move(this.x, this.y).stroke(this.stroke);
        var text = this.draw.text(label);
        text.move(this.x + ((rect.width() - text.length())/2), this.y + 10);
    },

    drawTimeline: function(eventType) {
        this.x = this.x - 20;
        this.y = this.y + 80;
        var line = this.draw.line(0, 0, 250, 0).move(this.x, this.y).stroke(this.stroke);
        this.draw.line(0, 0, 10, -5).move(line.width() + this.x - 10, this.y).stroke(this.stroke);
        this.draw.line(-10, -5, 0, 0).move(line.width() + this.x - 10, this.y - 5).stroke(this.stroke);

        if (eventType === 'EMIT') {
            this.draw.line(0, 10, 0, 0).move(line.width() + this.x - 40, this.y - 5).stroke(this.stroke); // completion event
        } else {
            var red = { color: 'Red', width: 5 }
            this.draw.line(0, 0, 30, -30).move(this.x + 150, this.y - 15).stroke(red); // red X error event
            this.draw.line(0, 0, -30, -30).move(this.x + 150, this.y - 15).stroke(red);
        }
    },

    drawMarbles: function(eventType) {
        this.y = this.y - 15;
        width = this.marbleWidth;

        if (this.marbleTypes[this.marbleType] == 'circle') {
            this.draw.circle(width).fill('#C2185B').move(this.x + 30, this.y).stroke(this.stroke);
            this.draw.circle(width).fill('#00796B').move(this.x + 90, this.y).stroke(this.stroke);
            if (eventType === 'EMIT') {
                this.draw.circle(width).fill('#FBC02D').move(this.x + 150, this.y).stroke(this.stroke);
            }
        } else if (this.marbleTypes[this.marbleType] == 'square') {
            this.draw.rect(width, width).fill('#C2185B').move(this.x + 30, this.y).stroke(this.stroke);
            this.draw.rect(width, width).fill('#00796B').move(this.x + 90, this.y).stroke(this.stroke);
            if (eventType === 'EMIT') {
                this.draw.rect(width, width).fill('#FBC02D').move(this.x + 150, this.y).stroke(this.stroke);
            }
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