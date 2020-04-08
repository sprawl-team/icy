const dotenv = require('dotenv')

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envFound = dotenv.config({ path: '../.env' })
if (!envFound) throw new Error("⚠️  Couldn't find .env file")

module.exports = {
  keyFilename: process.env.KEYFILENAME,
  db_host: process.env.DB_HOST,
  port: process.env.PORT,
  projectId: process.env.PROJECT_ID,
  line: {
    channelAccessToken: process.env.DEV_CHANNEL_TOKEN,
    channelSecret: process.env.DEV_CHANNEL_SECRET,
  },
}
