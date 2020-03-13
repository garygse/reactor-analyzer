package com.javanhe.reactor.analyzer

import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

import java.time.Duration
import java.time.LocalDateTime

/**
 * A variety of simple and complex test cases used for demo purposes.
 */
class Test {

    static Flux<LocalDateTime> dateTimePerSecond(int count) {
        Flux.interval(Duration.ofSeconds(1))
                .map { i ->
                    LocalDateTime.now()
                }
                .take(count)
    }

    static Flux<String> alphabet() {
        Flux.fromIterable( Arrays.asList('abcdefghijklmnopqrstuvwxyz'.split('')) )
                .map { s -> s.toUpperCase() }
    }

    static Flux<String> alphabet(int count) {
        alphabet().take(count)
    }

    static Flux<Integer> numbersFromFiveToSeven() {
        Flux.range(5, 3)
    }

    static Flux<String> findMissingLetter() {
        // note: 'jumped' instead of 'jumps'...we want the 's' to be missing :)
        def words = ['the', 'quick', 'brown', 'fox', 'jumped', 'over', 'the',' lazy', 'dog']
        Flux.fromIterable(words)
                .flatMap {word -> Flux.fromArray(word.split("")) }
                .distinct()
                .sort()
                .zipWith(Flux.range(1, Integer.MAX_VALUE),
                        {string, count -> String.format("%2d. %s", count, string)})
    }

    static Mono<String> monoWithMutipleMaps() {
        Mono.first([Mono.just('test'), Mono.just('data')])
                .map { s -> 'fixed-output-1' }
                .map { s -> 'fixed-output-2' }
                .map { s -> 'fixed-output-3' }
                .map { s -> 'fixed-output-4' }
    }

    static Mono<String> monoWithException() {
        Mono.first([Mono.just([id: UUID.randomUUID().toString(), value: 'Test data'] as Object), Mono.just('data')])
                .map { s -> 'fixed-output' }
                .map { s -> throw new RuntimeException('Deliberate exception thrown for test purposes')}
    }

    static Flux<String> delayedHelloWorld() {
        Mono.just("Hello")
                .concatWith(Mono.just("world")
                        .delaySubscription(Duration.ofMillis(500))
                )
    }

    static Flux<String> firstEmitter() {
        def a = Mono.just('Which comes first?')
                    .delaySubscription(Duration.ofMillis(450))

        def b = Flux.just('Chicken', 'Egg')
                .delaySubscription(Duration.ofMillis(400))

        Flux.first(a, b)
    }

    static Mono<String> never() {
        Mono.never()
    }

    static Flux<String> neverFlux() {
        Flux.never()
    }

    static Flux<Integer> merge() {
        Flux<Integer> even = Flux.range(1, 10).filter { i -> i % 2 == 0 }
        Flux<Integer> odd = Flux.range(1, 10).filter { i -> i % 2 > 0 }

        Flux.merge(even, odd)
    }
}
