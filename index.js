require("isomorphic-fetch")
const cheerio = require("cheerio")
const fs = require("fs")
const { Webhook, MessageBuilder } = require("discord-webhook-nodejs")
const puppeteer = require("puppeteer")

const base = "https://ocjene.skole.hr"
const info = require("./info.json")
const webhookURL = fs.readFileSync("webhook.txt", "utf8")
const delay = 600000 // 10 mins in ms

function writePast (d) {
    fs.writeFileSync("past.json", JSON.stringify(d))
}

function readPast () {
    return JSON.parse(fs.readFileSync("past.json"))
}

async function getHTML () {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0)
    await page.goto(base + "/login", { waitUntil: "networkidle2", timeout: 0 })
    //find input fields where name="username" and name="password"
    await page.type("input[name=username]", info.username)
    await page.type("input[name=password]", info.password)
    await page.click("input[value=PRIJAVA]")
    await page.goto(base + "/exam", { waitUntil: "networkidle2", timeout: 0 })
    const html = await page.evaluate(() => document.body.innerHTML);
    await browser.close()
    return html
}

async function getTests () {
    const html = await getHTML()
    const $ = cheerio.load(html)
    let tests = []
    if ($(".row").length == 0) {
        return []
    }
    $(".row").each((i, el) => {
        let test = {}
        let text = $(this).find("span").toArray()
        test.name = text[0].text()
        test.note = text[1].text()
        test.date = text[2].text()
        tests.push(test)
    })
    return tests
}


setInterval(async () => {
    console.log("Fetching...")
    getTests().then(async (tests) => {
        if (tests == []) return
        let past = readPast()
        let newTests = []
        for (let i = 0; i < tests.length; i++) {
            if (past.findIndex((t) => t.name == tests[i].name) == -1) {
                newTests.push(tests[i])
            }
        }
        if (newTests.length == 0) return console.log("No new tests.")
        let webhook = new Webhook(webhookURL)
        for (let i = 0; i < newTests.length; i++) {
            let test = newTests[i]
            let embed = new MessageBuilder()
                .setTitle(test.name)
                .setDescription(test.note)
                .setColor("#ff00ff")
                .setTimestamp()
            webhook.send(embed)
        }
        writePast(tests)
    })
}, delay)

console.log("Running...")