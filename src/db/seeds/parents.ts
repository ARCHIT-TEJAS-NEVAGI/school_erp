import { db } from '@/db';
import { parents } from '@/db/schema';

async function main() {
    const sampleParents = [
        {
            userId: 37,
            relation: 'Father',
            occupation: 'Engineer',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 38,
            relation: 'Mother',
            occupation: 'Doctor',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 39,
            relation: 'Father',
            occupation: 'Teacher',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 40,
            relation: 'Mother',
            occupation: 'Businessman',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 41,
            relation: 'Father',
            occupation: 'Accountant',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 42,
            relation: 'Mother',
            occupation: 'Engineer',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 43,
            relation: 'Father',
            occupation: 'Doctor',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 44,
            relation: 'Mother',
            occupation: 'Teacher',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 45,
            relation: 'Father',
            occupation: 'Businessman',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 46,
            relation: 'Mother',
            occupation: 'Accountant',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 47,
            relation: 'Father',
            occupation: 'Engineer',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 48,
            relation: 'Mother',
            occupation: 'Doctor',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 49,
            relation: 'Father',
            occupation: 'Teacher',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 50,
            relation: 'Mother',
            occupation: 'Businessman',
            createdAt: new Date().toISOString(),
        },
        {
            userId: 51,
            relation: 'Father',
            occupation: 'Accountant',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(parents).values(sampleParents);
    
    console.log('✅ Parents seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});