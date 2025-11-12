import { db } from '@/db';
import { feeConcessions } from '@/db/schema';

async function main() {
    const sampleFeeConcessions = [
        {
            studentId: 1,
            concessionType: 'merit',
            concessionPercentage: 15,
            amountWaived: 900,
            reason: 'Outstanding academic performance in previous year',
            approvedBy: 1,
            approvedAt: new Date('2024-12-05T10:30:00').toISOString(),
            createdAt: new Date('2024-12-03T09:15:00').toISOString(),
        },
        {
            studentId: 2,
            concessionType: 'merit',
            concessionPercentage: 20,
            amountWaived: 1200,
            reason: 'Top rank in class - consistent excellence',
            approvedBy: 1,
            approvedAt: new Date('2024-12-06T11:00:00').toISOString(),
            createdAt: new Date('2024-12-04T08:30:00').toISOString(),
        },
        {
            studentId: 3,
            concessionType: 'merit',
            concessionPercentage: 25,
            amountWaived: 1500,
            reason: 'Excellence in annual examinations and extracurricular activities',
            approvedBy: 1,
            approvedAt: new Date('2024-12-07T14:20:00').toISOString(),
            createdAt: new Date('2024-12-05T10:45:00').toISOString(),
        },
        {
            studentId: 4,
            concessionType: 'need',
            concessionPercentage: 30,
            amountWaived: 1800,
            reason: 'Family financial hardship - single parent income',
            approvedBy: 1,
            approvedAt: new Date('2024-12-08T09:45:00').toISOString(),
            createdAt: new Date('2024-12-05T15:20:00').toISOString(),
        },
        {
            studentId: 5,
            concessionType: 'need',
            concessionPercentage: 40,
            amountWaived: 2400,
            reason: 'Low income household - below poverty line certificate submitted',
            approvedBy: 1,
            approvedAt: new Date('2024-12-10T10:15:00').toISOString(),
            createdAt: new Date('2024-12-07T11:30:00').toISOString(),
        },
        {
            studentId: 6,
            concessionType: 'need',
            concessionPercentage: 50,
            amountWaived: 3000,
            reason: 'Economic need - family facing financial crisis',
            approvedBy: 1,
            approvedAt: new Date('2024-12-12T13:30:00').toISOString(),
            createdAt: new Date('2024-12-09T09:00:00').toISOString(),
        },
        {
            studentId: 7,
            concessionType: 'sibling',
            concessionPercentage: 10,
            amountWaived: 600,
            reason: 'Two siblings enrolled in school',
            approvedBy: 1,
            approvedAt: new Date('2024-12-14T11:45:00').toISOString(),
            createdAt: new Date('2024-12-11T14:20:00').toISOString(),
        },
        {
            studentId: 8,
            concessionType: 'sibling',
            concessionPercentage: 10,
            amountWaived: 600,
            reason: 'Multiple siblings studying in the institution',
            approvedBy: 1,
            approvedAt: new Date('2024-12-15T10:00:00').toISOString(),
            createdAt: new Date('2024-12-12T16:45:00').toISOString(),
        },
    ];

    await db.insert(feeConcessions).values(sampleFeeConcessions);
    
    console.log('✅ Fee concessions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});