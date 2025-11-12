import { db } from '@/db';
import { subjects } from '@/db/schema';

async function main() {
    const sampleSubjects = [
        {
            subjectName: 'Mathematics',
            subjectCode: 'MAT8',
            classId: 1,
            teacherId: 1,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'English',
            subjectCode: 'ENG8',
            classId: 1,
            teacherId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Science',
            subjectCode: 'SCI8',
            classId: 1,
            teacherId: 3,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Social Studies',
            subjectCode: 'SOC8',
            classId: 1,
            teacherId: 4,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Mathematics',
            subjectCode: 'MAT9',
            classId: 2,
            teacherId: 1,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'English',
            subjectCode: 'ENG9',
            classId: 2,
            teacherId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Physics',
            subjectCode: 'PHY9',
            classId: 2,
            teacherId: 3,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Chemistry',
            subjectCode: 'CHE9',
            classId: 2,
            teacherId: 4,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Mathematics',
            subjectCode: 'MAT10',
            classId: 3,
            teacherId: 1,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'English',
            subjectCode: 'ENG10',
            classId: 3,
            teacherId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Physics',
            subjectCode: 'PHY10',
            classId: 3,
            teacherId: 3,
            createdAt: new Date().toISOString(),
        },
        {
            subjectName: 'Chemistry',
            subjectCode: 'CHE10',
            classId: 3,
            teacherId: 4,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(subjects).values(sampleSubjects);
    
    console.log('✅ Subjects seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});