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
        Mono.first([Mono.just('test'), Mono.just('data')])
                .map { s -> 'fixed-output' }
                .map { s -> throw new RuntimeException('Deliberate exception thrown for test purposes')}
    }
}
