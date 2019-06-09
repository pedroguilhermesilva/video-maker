const algorithmia = require('algorithmia')
const algorithmiaKey = require ('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd') //lib to sentence boundary detection

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
  });

const stage = require('./stage.js')

async function robot() {
    
    const content = stage.load()
    
    await fecthContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentence(content)
    await fetchKeywordsOfAllSentence(content)

    stage.save(content)

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

    function limitMaximumSentence(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)

    }

    async function fetchKeywordsOfAllSentence(content) {
        for(const sentence of content.sentences) {
            sentence.keywords = await fecthWatsonAndReturnKeywords(sentence.text)
        }
    }

    async function fecthWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features:{
                    keywords:{}
                }
            }, (error, response) =>{
                if(error){
                    reject(error)
                    return
                }
                const keywords = response.keywords.map((keyword) =>{
                    return keyword.text
                })
                resolve(keywords)
            })
        })
    }
}

module.exports = robot