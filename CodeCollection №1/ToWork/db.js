const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    password: 'diebold',
    host: 'localhost',
    port: 5432,
    database: "telegramdb"
})

module.exports = pool