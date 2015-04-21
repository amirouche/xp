var bogan = require('boganipsum')
console.log(bogan())
// Or, supply an options object with any of the following parameters:

paragraphs (default: 4) - how many paragraphs to generate
sentenceMin (default: 5) - the minimum number of sentences per paragraph
sentenceMax (default: 9) - the maximum number of sentences per paragraph
paragraphSeparator (default: '\n') - the character to separate paragraphs with
    
// generate a single sentence
bogan({ paragraphs: 1 })

// generate 10 short paragraphs
bogan({ paragraphs: 10, sentenceMin: 2, sentenceMax: 5 })

// generate some HTML bogan
// '<p>' + bogan({ paragraphSeparator: '</p><p>' }) + '</p>'
