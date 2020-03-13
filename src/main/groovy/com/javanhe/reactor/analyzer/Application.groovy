package com.javanhe.reactor.analyzer

import java.time.Duration

class Application {

    static void main(String[] args) {
        def analyzer = new Analyzer()
        analyzer.analyze Test.dateTimePerSecond(3)
        analyzer.analyze Test.alphabet()
        analyzer.analyze Test.alphabet(8)
        analyzer.analyze Test.numbersFromFiveToSeven()
        analyzer.analyze Test.findMissingLetter()
        analyzer.analyze Test.monoWithMutipleMaps()
        analyzer.analyze Test.monoWithException()
        analyzer.analyze Test.delayedHelloWorld()
        analyzer.analyze Test.firstEmitter()
        analyzer.analyze Test.neverMono(), Duration.ofMillis(1)
        analyzer.analyze Test.neverFlux(), Duration.ofMillis(1)
        analyzer.analyze Test.merge()
        analyzer.stop()
    }
}
