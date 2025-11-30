const { Client } = require('pg')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')

// Hardcoded for reliability in this script
const connectionString = "postgresql://postgres:Facu1040@db.kagfyzcionaebnbykdmf.supabase.co:5432/postgres"

async function main() {
    const client = new Client({
        connectionString,
    })

    try {
        await client.connect()

        const hashedPassword = await bcrypt.hash('Facu1234', 10)
        const id = randomUUID()

        const query = `
      INSERT INTO "User" ("id", "username", "password", "role", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'ADMIN', NOW(), NOW())
      ON CONFLICT ("username") DO NOTHING
      RETURNING *;
    `

        const res = await client.query(query, [id, 'facundo', hashedPassword])

        if (res.rows.length > 0) {
            console.log('User created:', res.rows[0])
        } else {
            console.log('User already exists')
        }

    } catch (err) {
        console.error('Error seeding:', err)
        process.exit(1)
    } finally {
        await client.end()
    }
}

main()
