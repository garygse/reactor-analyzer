package com.javanhe.reactor.analyzer

import com.fasterxml.jackson.databind.ObjectMapper
import com.javanhe.reactor.analyzer.domain.Chain
import com.javanhe.reactor.analyzer.domain.Event
import com.javanhe.reactor.analyzer.domain.EventType
import groovy.util.logging.Slf4j
import org.reactivestreams.Subscription
import reactor.core.CoreSubscriber
import reactor.core.publisher.Flux
import reactor.core.publisher.Hooks
import reactor.core.publisher.Mono
import reactor.core.publisher.Operators

import java.time.Duration
import java.util.concurrent.ConcurrentLinkedQueue

@Slf4j
class Analyzer {

    private Queue<Event> events
    private Boolean isActive = true
    private Boolean logEvents = false

    Analyzer() {
        events = new ConcurrentLinkedQueue()
        Hooks.resetOnEachOperator()
        Hooks.onOperatorDebug()
        Hooks.onEachOperator('visualizer', Operators.lift { sc, sub ->
            [
                    onSubscribe: { Subscription s ->
                        events << new Event(EventType.SUBSCRIBE, sc)
                        sub.onSubscribe(s)
                    },
                    onNext: { Object o ->
                        events << new Event(EventType.EMIT, sc, o)
                        sub.onNext(o)
                    },
                    onError: { Throwable t ->
                        events << new Event(EventType.ERROR, sc, t)
                        sub.onError(t)
                    },
                    onComplete: {
                        events << new Event(EventType.COMPLETE, sc)
                        sub.onComplete()
                    }
            ] as CoreSubscriber
        })
    }

    Analyzer logEvents(boolean logAll) {
        this.logEvents = logAll
        this
    }

    void analyze(Flux flux) {
        analyze {
            flux.blockLast()
        }
    }

    void analyze(Flux flux, Duration timeout) {
        analyze {
            flux.timeout(timeout).blockLast()
        }
    }

    void analyze(Mono mono) {
        analyze {
            mono.block()
        }
    }

    void analyze(Mono mono, Duration timeout) {
        analyze {
            mono.timeout(timeout).block()
        }
    }

    void analyze(Closure c) {
        checkIfActive()
        events.clear()
        try {
            c.call()
        } catch (Exception e) {
            log.warn('Reactive stream ended in error...you may want to look into that! ', e)
        }
        process(events)
    }

    private void checkIfActive() {
        if (!isActive) {
            throw new IllegalStateException('This Analyzer instance has already been stopped. Create a new Analyzer BEFORE creating the Mono or Flux instance, and try running the analysis again.')
        }
    }

    void stop() {
        Hooks.resetOnEachOperator()
        isActive = false
    }

    // TODO: output this as JSON so that the visualizer can process it
    private void process(Queue<Event> events) {
        def chains = [] as LinkedList<Chain>

        def event = { Event e ->
            [
                    event: e.type,
                    timestamp: e.timestamp,
                    result: e.result
            ]
        }

        events
            .each { e ->
                if (logEvents) {
                    log.info "${e.timestamp.toLocalTime()} ${e.type} (${e.threadId}) - ${e.publisher.name()}${e.result ? ': ' + e.result : ''}"
                }
            }
            .findAll { e -> e.isEmitter() || e.isError() }
            .each { e ->
                // determine chains of publishers
                if (chains.find { chain ->
                    chain.isPartOfChain(e.publisher)
                } == null) {
                    chains << new Chain(e.publisher, event(e))
                } else {
                    chains.each { chain ->
                        chain.addPublisherIfPartOfChain(e.publisher)
                        chain.addResult(e.publisher, event(e))
                    }
                }
            }
        log.info new ObjectMapper().writeValueAsString(chains)
    }
}
