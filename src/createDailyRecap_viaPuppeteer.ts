import { launch } from 'puppeteer'

const getCurrentDateFormatted = () => {
	const currentDate = new Date()
	const day = currentDate.getDate().toString().padStart(2, '0')
	const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
	const year = currentDate.getFullYear()
	const formattedDate = `${day}/${month}/${year}`
	return formattedDate
}

const dailyRecapsPageLink = 'https://www.notion.so/<id>'
const authCookie = {
	name: 'token_v2',
	value: '<cookie value>', //might expire
	domain: '.www.notion.so',
	path: '/',
	secure: true,
	httpOnly: true,
	// expires: 1694372196, //10 Sept 2023, 21:56:36
}

const cloneLastDailyRecap = async () => {
	const browser = await launch({ headless: false })
	const page = await browser.newPage()
	await page.setViewport({ width: 2560, height: 1440 })
	await page.setCookie(authCookie)
	await page.goto(dailyRecapsPageLink)
	await page.waitForNavigation({ waitUntil: 'networkidle0' })
	await page.screenshot({ path: 'example.png' })

	await browser.close()
}

cloneLastDailyRecap()
