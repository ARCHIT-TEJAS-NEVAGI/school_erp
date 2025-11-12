import { db } from '@/db';
import { attendance } from '@/db/schema';

async function main() {
    const sampleAttendance = [];
    
    // Status distribution weights
    const statusWeights = [
        { status: 'present', weight: 0.80 },
        { status: 'absent', weight: 0.10 },
        { status: 'late', weight: 0.05 },
        { status: 'half_day', weight: 0.05 }
    ];
    
    // Helper function to get weighted random status
    function getWeightedStatus() {
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (const { status, weight } of statusWeights) {
            cumulativeWeight += weight;
            if (random <= cumulativeWeight) {
                return status;
            }
        }
        return 'present';
    }
    
    // Helper function to get notes based on status
    function getNotes(status: string) {
        if (status === 'absent') {
            const absentNotes = [
                'Medical leave',
                'Family emergency',
                'Sick leave',
                'Medical appointment',
                'Personal reasons',
                null
            ];
            return absentNotes[Math.floor(Math.random() * absentNotes.length)];
        }
        if (status === 'late') {
            const lateNotes = [
                'Traffic delay',
                'Bus delay',
                null
            ];
            return lateNotes[Math.floor(Math.random() * lateNotes.length)];
        }
        return null;
    }
    
    // Generate attendance for last 30 days
    const today = new Date();
    const markedByIds = [1, 2, 3, 4, 5, 6]; // Admin (1) and Teachers (2-6)
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - dayOffset);
        
        // Skip Sundays
        if (currentDate.getDay() === 0) {
            continue;
        }
        
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Set marked time to 9:30 AM on the attendance date
        const markedAtDate = new Date(currentDate);
        markedAtDate.setHours(9, 30, 0, 0);
        const markedAtString = markedAtDate.toISOString();
        
        // Create attendance for students 1-10
        for (let studentId = 1; studentId <= 10; studentId++) {
            const status = getWeightedStatus();
            const notes = getNotes(status);
            const markedBy = markedByIds[Math.floor(Math.random() * markedByIds.length)];
            
            sampleAttendance.push({
                studentId,
                date: dateString,
                status,
                markedBy,
                markedAt: markedAtString,
                notes,
                biometricDeviceId: null,
                createdAt: markedAtString,
            });
        }
    }

    await db.insert(attendance).values(sampleAttendance);
    
    console.log(`✅ Attendance seeder completed successfully - ${sampleAttendance.length} records created`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});