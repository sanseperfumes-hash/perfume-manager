const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({})

async function main() {
    const hashedPassword = await bcrypt.hash('Facu1234', 10)

    const user = await prisma.user.upsert({
        where: { username: 'facundo' },
        update: {},
        create: {
            username: 'facundo',
            password: hashedPassword,
            role: 'ADMIN', // Using string directly as enum might not be exported in JS easily without types
        },
    })

    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
