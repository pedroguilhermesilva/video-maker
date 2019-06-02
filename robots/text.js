const algorithmia = require('algorithmia')
const algorithmiaKey = require ('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fecthContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    async function fecthContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponde.get()

        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkDown = removeBlankLinesAndMarkDown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkDown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkDown(text) {
            const allLines = text.split('\n')
            const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=') ) {
                    return false
                }
                return true 
            })

            return withoutBlankLinesAndMarkDown.join(' ')
        }
    }

    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
    function breakContentIntoSentences(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentences) => {
            content.sentences.push({
                text: sentences,
                keywords: [],
                images: []
            })
        })
    }

}

module.exports = robot