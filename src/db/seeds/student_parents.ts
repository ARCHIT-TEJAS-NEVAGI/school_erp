import { db } from '@/db';
import { studentParents } from '@/db/schema';

async function main() {
    const sampleStudentParents = [
        // Students 1-2 → Parent 1
        {
            studentId: 1,
            parentId: 1,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 2,
            parentId: 1,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 3-4 → Parent 2
        {
            studentId: 3,
            parentId: 2,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 4,
            parentId: 2,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 5-6 → Parent 3
        {
            studentId: 5,
            parentId: 3,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 6,
            parentId: 3,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 7-8 → Parent 4
        {
            studentId: 7,
            parentId: 4,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 8,
            parentId: 4,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 9-10 → Parent 5
        {
            studentId: 9,
            parentId: 5,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 10,
            parentId: 5,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 11-12 → Parent 6
        {
            studentId: 11,
            parentId: 6,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 12,
            parentId: 6,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 13-14 → Parent 7
        {
            studentId: 13,
            parentId: 7,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 14,
            parentId: 7,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 15-16 → Parent 8
        {
            studentId: 15,
            parentId: 8,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 16,
            parentId: 8,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 17-18 → Parent 9
        {
            studentId: 17,
            parentId: 9,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 18,
            parentId: 9,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 19-20 → Parent 10
        {
            studentId: 19,
            parentId: 10,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 20,
            parentId: 10,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 21-22 → Parent 11
        {
            studentId: 21,
            parentId: 11,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 22,
            parentId: 11,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 23-24 → Parent 12
        {
            studentId: 23,
            parentId: 12,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 24,
            parentId: 12,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 25-26 → Parent 13
        {
            studentId: 25,
            parentId: 13,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 26,
            parentId: 13,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 27-28 → Parent 14
        {
            studentId: 27,
            parentId: 14,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 28,
            parentId: 14,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        // Students 29-30 → Parent 15
        {
            studentId: 29,
            parentId: 15,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 30,
            parentId: 15,
            isPrimary: true,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(studentParents).values(sampleStudentParents);
    
    console.log('✅ Student-Parents junction seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});