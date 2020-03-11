package com.javanhe.reactor.analyzer.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import reactor.core.Scannable

class Chain {
    @JsonIgnore LinkedList<Scannable> publishers
    Map<Tuple3<Scannable, String, String>, LinkedList<?>> results

    Chain(Scannable publisher, Object result) {
        publishers = []
        publishers << publisher
        results = [:]
        results.put(getKey(publisher), [result] as LinkedList)
    }

    void addPublisherIfPartOfChain(Scannable publisher) {
        if (publishers.contains(publisher)) {
            return
        }
        if (isPartOfChain(publisher)) {
            publishers << publisher
            results.put(getKey(publisher), [] as LinkedList)
        }
    }

    boolean isPartOfChain(Scannable publisher) {
        if (publishers.contains(publisher)) {
            return true
        }
        if (publisher.hasProperty('source')) {
            return isPartOfChain(publisher.source)
        }
        false
    }

    void addResult(Scannable publisher, Object result) {
        def key = getKey(publisher)
        if (results.containsKey(key)) {
            results.get(key).add(result)
        }
    }

    private Tuple3<Scannable, String, String> getKey(Scannable publisher) {
        new Tuple3<>(publisher, publisher.stepName(), Integer.toHexString(System.identityHashCode(publisher)))
    }
}
