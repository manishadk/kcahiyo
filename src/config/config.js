import dotenv from 'dotenv'

dotenv.config()

export default {
  port: process.env.PORT || 1234,
  database: {
    connection: {
      url: process.env.DB_URL
      // host: process.env.DB_HOST || '127.0.0.1',
      // user: process.env.DB_USER || 'root',
      // password: process.env.DB_PASSWORD || '',
      // database: process.env.DB_DATABASE || 'test',
      // dialect: process.env.DB_DIALECT || 'mysql'
    }
  },
  bcrypt: {
    saltRounds: 8
  },
  jwt: {
    jwtSecret: 'test!@#$%test',
    refreshJwtSecret: '!@#$%refresh!@#$%',
    accessExpInMin: 10,
    refreshExpInMin: 129600
  }
}
