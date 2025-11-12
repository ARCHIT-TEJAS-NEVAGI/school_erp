import { db } from '@/db';
import { teacherRemarks } from '@/db/schema';

async function main() {
    // Calculate dates for the last 30 days
    const today = new Date();
    const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    });

    const sampleRemarks = [
        // Positive remarks (9 records - 60%)
        {
            studentId: 1,
            teacherId: 1,
            remarkType: 'positive',
            remarkText: 'Excellent participation in class discussions and shows genuine curiosity',
            subjectId: 1,
            date: dates[2],
            createdAt: new Date(dates[2]).toISOString(),
        },
        {
            studentId: 3,
            teacherId: 2,
            remarkType: 'positive',
            remarkText: 'Outstanding project work and creativity in assignments',
            subjectId: 2,
            date: dates[5],
            createdAt: new Date(dates[5]).toISOString(),
        },
        {
            studentId: 5,
            teacherId: 3,
            remarkType: 'positive',
            remarkText: 'Shows great improvement in recent weeks and demonstrates strong understanding',
            subjectId: null,
            date: dates[8],
            createdAt: new Date(dates[8]).toISOString(),
        },
        {
            studentId: 2,
            teacherId: 4,
            remarkType: 'positive',
            remarkText: 'Very attentive and well-behaved student, sets good example for peers',
            subjectId: 3,
            date: dates[10],
            createdAt: new Date(dates[10]).toISOString(),
        },
        {
            studentId: 7,
            teacherId: 5,
            remarkType: 'positive',
            remarkText: 'Consistently completes homework on time with excellent quality',
            subjectId: 4,
            date: dates[12],
            createdAt: new Date(dates[12]).toISOString(),
        },
        {
            studentId: 4,
            teacherId: 1,
            remarkType: 'positive',
            remarkText: 'Demonstrates strong leadership qualities and helps organize group activities',
            subjectId: null,
            date: dates[15],
            createdAt: new Date(dates[15]).toISOString(),
        },
        {
            studentId: 8,
            teacherId: 2,
            remarkType: 'positive',
            remarkText: 'Actively helps peers understand difficult concepts with patience',
            subjectId: 1,
            date: dates[18],
            createdAt: new Date(dates[18]).toISOString(),
        },
        {
            studentId: 6,
            teacherId: 3,
            remarkType: 'positive',
            remarkText: 'Excellent problem-solving skills displayed in class exercises',
            subjectId: 2,
            date: dates[20],
            createdAt: new Date(dates[20]).toISOString(),
        },
        {
            studentId: 9,
            teacherId: 4,
            remarkType: 'positive',
            remarkText: 'Shows genuine interest in the subject and asks thoughtful questions',
            subjectId: 3,
            date: dates[22],
            createdAt: new Date(dates[22]).toISOString(),
        },
        // Neutral remarks (4 records - 27%)
        {
            studentId: 10,
            teacherId: 5,
            remarkType: 'neutral',
            remarkText: 'Average performance in class activities, maintains steady progress',
            subjectId: 4,
            date: dates[6],
            createdAt: new Date(dates[6]).toISOString(),
        },
        {
            studentId: 3,
            teacherId: 1,
            remarkType: 'neutral',
            remarkText: 'Participates occasionally in discussions, could be more engaged',
            subjectId: null,
            date: dates[11],
            createdAt: new Date(dates[11]).toISOString(),
        },
        {
            studentId: 7,
            teacherId: 2,
            remarkType: 'neutral',
            remarkText: 'Follows classroom rules appropriately and completes most assignments',
            subjectId: 1,
            date: dates[16],
            createdAt: new Date(dates[16]).toISOString(),
        },
        {
            studentId: 5,
            teacherId: 3,
            remarkType: 'neutral',
            remarkText: 'Completes most assignments on time but could improve quality of work',
            subjectId: 2,
            date: dates[24],
            createdAt: new Date(dates[24]).toISOString(),
        },
        // Negative remarks (2 records - 13%)
        {
            studentId: 2,
            teacherId: 4,
            remarkType: 'negative',
            remarkText: 'Needs improvement in homework submission and meeting deadlines',
            subjectId: 3,
            date: dates[7],
            createdAt: new Date(dates[7]).toISOString(),
        },
        {
            studentId: 8,
            teacherId: 5,
            remarkType: 'negative',
            remarkText: 'Requires more focus during lessons and less distraction from peers',
            subjectId: null,
            date: dates[14],
            createdAt: new Date(dates[14]).toISOString(),
        },
    ];

    await db.insert(teacherRemarks).values(sampleRemarks);
    
    console.log('✅ Teacher remarks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});