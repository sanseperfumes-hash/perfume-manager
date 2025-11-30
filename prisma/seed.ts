import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('Facu1234', 10)

    const user = await prisma.user.upsert({
        where: { username: 'facundo' },
        update: {},
        create: {
            username: 'facundo',
            email: 'facundoiglesias9@gmail.com',
            password: hashedPassword,
            role: Role.ADMIN,
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
