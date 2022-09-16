import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_KEY })
const databaseId = process.env.NOTION_DATABASE_ID

const getCurrentDate = () => {
	const currentDate = new Date()
	const day = currentDate.getDate().toString().padStart(2, '0')
	const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
	const year = currentDate.getFullYear()
	const formattedDate = `${day}/${month}/${year}`
	return formattedDate
}

const getDatabase = async (databaseId: string) => {
	try {
		const response = await notion.databases.retrieve({
			database_id: databaseId,
		})
		return response
	} catch (error) {
		console.error(error.body)
	}
}

const getDatabaseEntries = async (databaseId: string) => {
	try {
		const response = await notion.databases.query({
			database_id: databaseId,
			sorts: [
				{
					timestamp: 'created_time',
					direction: 'descending',
				},
			],
		})
		return response
	} catch (error) {
		console.error(error.body)
	}
}

const getPageContent = async (blockId: string) => {
	try {
		const response = await notion.blocks.children.list({
			block_id: blockId,
		})
		return response
	} catch (error) {
		console.error(error.body)
	}
}

const cloneLastDailyRecap = async () => {
	try {
		const dailyRecaps = await getDatabaseEntries(databaseId)
		const lastRecap = dailyRecaps.results[0]
		if (!('properties' in lastRecap))
			return console.error('Page properties not available')
		delete lastRecap.properties['Created time']

		const newDailyRecap = await notion.pages.create({
			parent: {
				type: 'database_id',
				database_id: databaseId,
			},
			properties: {
				title: [
					{
						text: {
							content: getCurrentDate(),
						},
					},
				],
			},
		})
		console.log('New Recap Page successfully added to the list')

		const lastRecapContent = await getPageContent(lastRecap.id)
		const lastRecapDatabase = lastRecapContent.results.find(
			block =>
				'child_database' in block && block.child_database.title !== '',
		)
		const lastRecapDatabaseInfo = await getDatabase(lastRecapDatabase.id)
		delete lastRecapDatabaseInfo.properties['Date Created']
		delete lastRecapDatabaseInfo.properties['Name']
		delete lastRecapDatabaseInfo.properties.Status['id']
		delete lastRecapDatabaseInfo.properties.Status['name']

		const lastTasks = await getDatabaseEntries(lastRecapDatabase.id)

		const newRecapDatabase = await notion.databases.create({
			parent: {
				page_id: newDailyRecap.id,
			},
			icon: { type: 'emoji', emoji: '✔️' },
			properties: {
				Name: {
					title: {},
				},
				...lastRecapDatabaseInfo.properties,
			},
			title: [
				{
					text: {
						content: getCurrentDate(),
					},
				},
			],
			is_inline: true,
		})

		lastTasks.results.forEach(async task => {
			if (
				!('properties' in task) ||
				!('Status' in task.properties) ||
				!('select' in task.properties.Status) ||
				!('title' in task.properties.Name) ||
				!('plain_text' in task.properties.Name.title[0])
			)
				return
			await notion.pages.create({
				parent: {
					type: 'database_id',
					database_id: newRecapDatabase.id,
				},
				properties: {
					title: [
						{
							text: {
								content:
									task.properties.Name.title[0].plain_text,
							},
						},
					],
					Status: {
						name: task.properties.Status.select.name,
					},
				},
			})
		})
		console.log('Successfully transferred tasks to new page database')
	} catch (error) {
		console.error(error.body)
	}
}

cloneLastDailyRecap()
