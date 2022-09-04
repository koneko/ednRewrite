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
	const keys = ["name", "note", "date"]
    let $ = cheerio.load(html),
        elements = $(".row"),
        tests;
    return elements.length == 0 ? [] : (
        tests = [],
        elements.each((i, el) => {
            let values = $(this).find("span").toArray().map(a => a.text())
			tests.push(Object.fromEntries(values.map((el, i) => [keys[i], el])))  // {name: ..., note: ..., date: ...}
        }), tests
    )
}


setInterval(async () => {
    console.log("Fetching...")
    getTests().then(async (tests) => {
        if (tests == []) return
        let past = readPast(),
            newTests = []
        for (let i of tests) {
            if (past.findIndex((t) => t.name == i.name) == -1) {
                newTests.push(i)
            }
        }
        if (newTests.length == 0) return console.log("No new tests.")
        for (let test of tests) {
            let embed = new MessageBuilder()
                .setTitle(test.name)
                .setDescription(test.note)
                .setColor("#ff00ff")
                .setTimestamp()
            new Webhook(webhookURL).send(embed)
        }
        writePast(tests)
    })
}, delay)

console.log("Running...")