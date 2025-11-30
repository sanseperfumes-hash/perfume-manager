const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const user = await prisma.user.update({
            where: { username: 'facundo' },
            data: { email: 'facundoiglesias9@gmail.com' },
        })
        console.log('User updated:', user)
    } catch (e) {
        console.error('Error updating user:', e)
        // Try finding any user if facundo doesn't exist (fallback)
        const firstUser = await prisma.user.findFirst()
        if (firstUser) {
            const user = await prisma.user.update({
                where: { id: firstUser.id },
                data: { email: 'facundoiglesias9@gmail.com' },
            })
            console.log('First user updated instead:', user)
        }
    }
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
