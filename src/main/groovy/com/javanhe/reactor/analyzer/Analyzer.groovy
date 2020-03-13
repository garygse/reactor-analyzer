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

/**
 * <p>Analyzes the various events that occur during the processing of a reactive pipeline.</p>
 * <p>Note that this class <em>MUST</em> be instantiated prior to the creation of the pipeline
 * to be tested. This is so that the event hooks are set up properly beforehand, otherwise the
 * <tt>Analyzer</tt> instance will be blind to the pipeline events.</p>
 */
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

    /**
     * Instructs the analyzer to log all events as they occur. This can result in a lot of noise, but
     * may also be beneficial to see subscription and completion events in addition to the emit and
     * error events.
     *
     * @param logAll enable logging of all events
     * @return this
     */
    Analyzer logEvents(boolean logAll) {
        this.logEvents = logAll
        this
    }

    /**
     * Removes the event hooks and global debugging from Reactor and effectively shuts down this
     * <tt>Analyzer</tt> instance from performing further analysis. After calling this method, any
     * attempt to invoke the {@link #doAnalysis(groovy.lang.Closure, boolean) analyze()} method will
     * result in an {@link IllegalStateException} being thrown.
     */
    void stop() {
        Hooks.resetOnEachOperator()
        Hooks.resetOnOperatorDebug()
        isActive = false
    }

    /**
     * Invokes the given {@link Flux} instance, allowing the events to be captured.
     *
     * @param flux the reactive pipeline to be analyzed
     * @param logStacktrace an optional parameter to log the stack trace if an exception is thrown (default <tt>false</tt>)
     */
    void analyze(Flux flux, boolean logStacktrace = false) {
        doAnalysis({
            flux.blockLast()
        }, logStacktrace)
    }

    /**
     * Invokes the given {@link Flux} instance, allowing the events to be captured.
     *
     * @param flux the reactive pipeline to be analyzed
     * @param timeout a {@link Duration} to apply as a time limit for the pipeline to complete
     * @param logStacktrace an optional parameter to log the stack trace if an exception is thrown (default <tt>false</tt>)
     */
    void analyze(Flux flux, Duration timeout, boolean logStacktrace = false) {
        doAnalysis({
            flux.timeout(timeout).blockLast()
        }, logStacktrace)
    }

    /**
     * Invokes the given {@link Mono} instance, allowing the events to be captured.
     *
     * @param mono the reactive pipeline to be analyzed
     * @param logStacktrace an optional parameter to log the stack trace if an exception is thrown (default <tt>false</tt>)
     */
    void analyze(Mono mono, boolean logStacktrace = false) {
        doAnalysis({
            mono.block()
        }, logStacktrace)
    }

    /**
     * Invokes the given {@link Mono} instance, allowing the events to be captured.
     *
     * @param mono the reactive pipeline to be analyzed
     * @param timeout a {@link Duration} to apply as a time limit for the pipeline to complete
     * @param logStacktrace an optional parameter to log the stack trace if an exception is thrown (default <tt>false</tt>)
     */
    void analyze(Mono mono, Duration timeout, boolean logStacktrace = false) {
        doAnalysis({
            mono.timeout(timeout).block()
        }, logStacktrace)
    }

    private void doAnalysis(Closure c, boolean logStackTrace) {
        checkIfActive()
        events.clear()
        try {
            c.call()
        } catch (Exception e) {
            def msg = 'Reactive stream ended in error...you may want to look into that!'
            logStackTrace ? log.warn(msg, e) : log.warn(msg)
        }
        process()
    }

    private void checkIfActive() {
        if (!isActive) {
            throw new IllegalStateException('This Analyzer instance has already been stopped. Create a new Analyzer BEFORE creating the Mono or Flux instance, and try running the analysis again.')
        }
    }

    private void process() {
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
