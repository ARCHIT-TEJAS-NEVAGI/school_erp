import { db } from '@/db';
import { classes } from '@/db/schema';

async function main() {
    const sampleClasses = [
        {
            className: 'Class 8',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            className: 'Class 9',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            className: 'Class 10',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(classes).values(sampleClasses);
    
    console.log('✅ Classes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});