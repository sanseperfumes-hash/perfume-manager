const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Probando conexión a la base de datos...');
    try {
        const count = await prisma.user.count();
        console.log(`¡ÉXITO! Conexión establecida. Hay ${count} usuarios en la base de datos.`);
    } catch (error) {
        console.error('ERROR: No se pudo conectar a la base de datos.');
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
