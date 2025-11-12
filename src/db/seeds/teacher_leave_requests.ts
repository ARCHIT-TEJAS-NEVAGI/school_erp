import { db } from '@/db';
import { teacherLeaveRequests } from '@/db/schema';

async function main() {
    const sampleTeacherLeaveRequests = [
        {
            teacherId: 1,
            startDate: '2025-01-15',
            endDate: '2025-01-15',
            reason: 'Medical appointment',
            status: 'approved',
            requestedAt: '2025-01-12T14:20:00',
            reviewedBy: 1,
            reviewedAt: '2025-01-14T10:30:00',
        },
        {
            teacherId: 1,
            startDate: '2025-02-10',
            endDate: '2025-02-11',
            reason: 'Family emergency',
            status: 'pending',
            requestedAt: '2025-02-07T09:15:00',
            reviewedBy: null,
            reviewedAt: null,
        },
        {
            teacherId: 2,
            startDate: '2025-01-20',
            endDate: '2025-01-21',
            reason: 'Attending workshop',
            status: 'approved',
            requestedAt: '2025-01-17T11:00:00',
            reviewedBy: 1,
            reviewedAt: '2025-01-19T15:45:00',
        },
        {
            teacherId: 2,
            startDate: '2025-02-14',
            endDate: '2025-02-14',
            reason: 'Sick leave',
            status: 'rejected',
            requestedAt: '2025-02-11T08:30:00',
            reviewedBy: 1,
            reviewedAt: '2025-02-13T16:20:00',
        },
        {
            teacherId: 3,
            startDate: '2025-01-25',
            endDate: '2025-01-27',
            reason: 'Personal work',
            status: 'pending',
            requestedAt: '2025-01-22T13:45:00',
            reviewedBy: null,
            reviewedAt: null,
        },
        {
            teacherId: 3,
            startDate: '2025-02-18',
            endDate: '2025-02-19',
            reason: 'Medical appointment',
            status: 'approved',
            requestedAt: '2025-02-15T10:20:00',
            reviewedBy: 1,
            reviewedAt: '2025-02-17T14:10:00',
        },
        {
            teacherId: 4,
            startDate: '2025-02-01',
            endDate: '2025-02-01',
            reason: 'Family emergency',
            status: 'pending',
            requestedAt: '2025-01-29T16:00:00',
            reviewedBy: null,
            reviewedAt: null,
        },
        {
            teacherId: 4,
            startDate: '2025-02-22',
            endDate: '2025-02-23',
            reason: 'Attending workshop',
            status: 'approved',
            requestedAt: '2025-02-19T09:30:00',
            reviewedBy: 1,
            reviewedAt: '2025-02-21T11:45:00',
        },
        {
            teacherId: 5,
            startDate: '2025-02-05',
            endDate: '2025-02-06',
            reason: 'Sick leave',
            status: 'rejected',
            requestedAt: '2025-02-02T12:15:00',
            reviewedBy: 1,
            reviewedAt: '2025-02-04T17:30:00',
        },
        {
            teacherId: 5,
            startDate: '2025-02-26',
            endDate: '2025-02-26',
            reason: 'Personal work',
            status: 'pending',
            requestedAt: '2025-02-23T14:50:00',
            reviewedBy: null,
            reviewedAt: null,
        },
    ];

    await db.insert(teacherLeaveRequests).values(sampleTeacherLeaveRequests);
    
    console.log('✅ Teacher leave requests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});