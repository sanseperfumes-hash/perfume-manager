
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const materials = await prisma.material.findMany({
        where: {
            OR: [
                { name: { contains: 'Caja' } },
                { name: { contains: 'Alcohol' } },
                { name: { contains: 'Frasco' } },
                { name: { contains: 'Etiqueta' } }
            ]
        },
        select: { id: true, name: true }
    });
    console.log(materials.map(m => m.name).sort().join('\n'));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
