import { db } from '@/db';
import { feeTemplates } from '@/db/schema';

async function main() {
    const sampleFeeTemplates = [
        {
            templateName: 'Tuition Fee - Class 8',
            classId: 1,
            amount: 5000,
            feeType: 'Tuition',
            frequency: 'monthly',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Tuition Fee - Class 9',
            classId: 2,
            amount: 5500,
            feeType: 'Tuition',
            frequency: 'monthly',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Tuition Fee - Class 10',
            classId: 3,
            amount: 6000,
            feeType: 'Tuition',
            frequency: 'monthly',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Transport Fee',
            classId: null,
            amount: 1000,
            feeType: 'Transport',
            frequency: 'monthly',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Library Fee',
            classId: null,
            amount: 500,
            feeType: 'Library',
            frequency: 'annually',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Sports Fee',
            classId: null,
            amount: 1000,
            feeType: 'Sports',
            frequency: 'annually',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Lab Fee - Science',
            classId: 1,
            amount: 2000,
            feeType: 'Laboratory',
            frequency: 'annually',
            createdAt: new Date().toISOString(),
        },
        {
            templateName: 'Exam Fee',
            classId: null,
            amount: 500,
            feeType: 'Examination',
            frequency: 'quarterly',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(feeTemplates).values(sampleFeeTemplates);
    
    console.log('✅ Fee templates seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});