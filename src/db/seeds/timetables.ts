import { db } from '@/db';
import { timetables } from '@/db/schema';

async function main() {
    const sampleTimetables = [
        {
            sectionId: 1,
            subjectId: 1,
            dayOfWeek: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 2,
            dayOfWeek: 'Monday',
            startTime: '10:00',
            endTime: '11:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 3,
            dayOfWeek: 'Tuesday',
            startTime: '09:00',
            endTime: '10:00',
            roomNumber: 'Lab 1',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 4,
            dayOfWeek: 'Tuesday',
            startTime: '10:00',
            endTime: '11:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 1,
            dayOfWeek: 'Wednesday',
            startTime: '09:00',
            endTime: '10:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 2,
            dayOfWeek: 'Wednesday',
            startTime: '10:00',
            endTime: '11:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 3,
            dayOfWeek: 'Thursday',
            startTime: '09:00',
            endTime: '10:00',
            roomNumber: 'Lab 1',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 4,
            dayOfWeek: 'Thursday',
            startTime: '10:00',
            endTime: '11:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 1,
            dayOfWeek: 'Friday',
            startTime: '09:00',
            endTime: '10:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
        {
            sectionId: 1,
            subjectId: 2,
            dayOfWeek: 'Friday',
            startTime: '10:00',
            endTime: '11:00',
            roomNumber: 'Room 101',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(timetables).values(sampleTimetables);
    
    console.log('✅ Timetables seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});