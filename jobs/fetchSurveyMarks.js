const fetch = require("node-fetch")
const cheerio = require("cheerio")
const db = require("../lib/db")

async function fetchSurveyMarks() {
  const surveyDaySummary = await fetchSurveyDaySummary()
  return db.insertSurveyMarks(surveyDaySummary)
}

const fetchSurveyDaySummary = async () => {
  const URL = "https://app.evalandgo.com/reports/300257/pages/15069245/items/44373343/show"
  const response = await fetch(URL)
  const htmlContent = await response.text()
  const parsedDom = cheerio.load(htmlContent)

  const headerRow = parsedDom("table thead tr:first-child th")
  const timeInterval = headerRow.last().text().trim()
  const surveyDate = extractCurrentDateFromTimeInterval(timeInterval)

  const contentRow = parsedDom("table tbody td")
  const markCount = Number(contentRow.eq(2).text().trim())
  const averageMark = Number(contentRow.eq(3).text().trim())

  return { markCount, averageMark, surveyDate }
}

function extractCurrentDateFromTimeInterval(timeInterval) {
  const todayDate = timeInterval.split("-").map(date => date.trim())[1] // Format: 18/11
  const [todayDay, todayMonth] = todayDate.split("/")
  const formattedDate = `${new Date().getFullYear()}-${todayMonth}-${todayDay}` // Format: 2022-18-11

  return formattedDate
}

fetchSurveyMarks()
