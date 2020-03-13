package com.javanhe.reactor.analyzer

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
        analyzer.stop()
    }
}
