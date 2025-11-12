import { db } from '@/db';
import { sections } from '@/db/schema';

async function main() {
    const sampleSections = [
        {
            sectionName: 'A',
            classId: 1,
            classTeacherId: 1,
            createdAt: new Date().toISOString(),
        },
        {
            sectionName: 'B',
            classId: 1,
            classTeacherId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            sectionName: 'A',
            classId: 2,
            classTeacherId: 3,
            createdAt: new Date().toISOString(),
        },
        {
            sectionName: 'B',
            classId: 2,
            classTeacherId: 4,
            createdAt: new Date().toISOString(),
        },
        {
            sectionName: 'A',
            classId: 3,
            classTeacherId: 5,
            createdAt: new Date().toISOString(),
        },
        {
            sectionName: 'B',
            classId: 3,
            classTeacherId: 1,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(sections).values(sampleSections);
    
    console.log('✅ Sections seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});