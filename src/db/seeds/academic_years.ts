import { db } from '@/db';
import { academicYears } from '@/db/schema';

async function main() {
    const sampleAcademicYears = [
        {
            yearName: '2023-2024',
            startDate: '2023-04-01',
            endDate: '2024-03-31',
            isCurrent: false,
            createdAt: new Date().toISOString(),
        },
        {
            yearName: '2024-2025',
            startDate: '2024-04-01',
            endDate: '2025-03-31',
            isCurrent: true,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(academicYears).values(sampleAcademicYears);
    
    console.log('✅ Academic years seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});