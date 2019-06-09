const robots = {
    input: require('./robots/input.js'),
    text: require('./robots/text.js'),
    stage: require('./robots/stage.js')
}

async function start() {

    robots.input()
    await robots.text()

    const content = robots.stage.load()
    console.dir(content, {depth: null })

}

start()