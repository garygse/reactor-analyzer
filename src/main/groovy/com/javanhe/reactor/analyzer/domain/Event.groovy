package com.javanhe.reactor.analyzer.domain

import reactor.core.Scannable

import java.time.LocalDateTime

/**
 * Represents a step in the reactive process.
 */
class Event {
    Long threadId
    EventType type
    Scannable publisher
    Object result
    LocalDateTime timestamp

    Event(EventType type, Scannable publisher) {
        this(type, publisher, null)
    }

    Event(EventType type, Scannable publisher, Object result) {
        this.threadId = Thread.currentThread().id
        this.type = type
        this.publisher = publisher
        this.result = result
        this.timestamp = LocalDateTime.now()
    }

    boolean isEmitter() {
        type == EventType.EMIT
    }

    boolean isMainEmitter() {
        isEmitter() && publisher.steps().toList().size == 1
    }

    boolean isError() {
        type == EventType.ERROR
    }

}
