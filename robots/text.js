const algorithmia = require('algorithmia')
const algorithmiaKey = require ('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd') //lib to sentence boundary detection

async function robot(content) {
    await fecthContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    //User Algorithmia and search the term on Wikipidia
    async function fecthContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkDown = removeBlankLinesAndMarkDown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkDown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkDown(text) {
            //Remove all break line
            const allLines = text.split('\n')
            //Check if array is empty our start with '=' and filter
            const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=') ) {
                    //delete line if condition is true
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
    
    //break all in sentences, divide it and put it in yours subtitle
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