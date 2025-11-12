import { db } from '@/db';
import { teachers } from '@/db/schema';

async function main() {
    const sampleTeachers = [
        {
            userId: 2,
            employeeId: 'EMP001',
            qualification: 'M.Sc. Mathematics',
            specialization: 'Mathematics',
            joiningDate: '2020-06-01',
            salary: 50000,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 3,
            employeeId: 'EMP002',
            qualification: 'M.A. English',
            specialization: 'English Literature',
            joiningDate: '2019-07-15',
            salary: 48000,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 4,
            employeeId: 'EMP003',
            qualification: 'M.Sc. Physics',
            specialization: 'Physics',
            joiningDate: '2021-04-10',
            salary: 52000,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 5,
            employeeId: 'EMP004',
            qualification: 'M.Sc. Chemistry',
            specialization: 'Chemistry',
            joiningDate: '2020-08-20',
            salary: 51000,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 6,
            employeeId: 'EMP005',
            qualification: 'B.Ed. Physical Education',
            specialization: 'Physical Education',
            joiningDate: '2022-01-05',
            salary: 45000,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(teachers).values(sampleTeachers);
    
    console.log('✅ Teachers seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});