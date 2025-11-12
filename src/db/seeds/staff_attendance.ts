import { db } from '@/db';
import { staffAttendance } from '@/db/schema';

async function main() {
    // Generate dates for the last 30 days (excluding Sundays)
    const getWeekdayDates = () => {
        const dates: string[] = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Skip Sundays (0 = Sunday)
            if (date.getDay() !== 0) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dates.push(`${year}-${month}-${day}`);
            }
        }
        
        return dates;
    };

    const weekdayDates = getWeekdayDates();
    
    // Status distribution helper
    const getStatus = (index: number): 'present' | 'absent' | 'late' => {
        const rand = index % 100;
        if (rand < 85) return 'present';
        if (rand < 95) return 'absent';
        return 'late';
    };

    const sampleAttendance = [
        // Teacher 1 - Good attendance
        { teacherId: 1, date: weekdayDates[0], status: 'present', markedBy: 1, createdAt: `${weekdayDates[0]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[1], status: 'present', markedBy: 1, createdAt: `${weekdayDates[1]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[2], status: 'present', markedBy: 1, createdAt: `${weekdayDates[2]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[3], status: 'late', markedBy: 1, createdAt: `${weekdayDates[3]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[4], status: 'present', markedBy: 1, createdAt: `${weekdayDates[4]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[5], status: 'present', markedBy: 1, createdAt: `${weekdayDates[5]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[6], status: 'present', markedBy: 1, createdAt: `${weekdayDates[6]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[7], status: 'present', markedBy: 1, createdAt: `${weekdayDates[7]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[8], status: 'present', markedBy: 1, createdAt: `${weekdayDates[8]}T09:00:00.000Z` },
        { teacherId: 1, date: weekdayDates[9], status: 'absent', markedBy: 1, createdAt: `${weekdayDates[9]}T09:00:00.000Z` },

        // Teacher 2 - Mostly present with occasional late
        { teacherId: 2, date: weekdayDates[0], status: 'present', markedBy: 1, createdAt: `${weekdayDates[0]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[1], status: 'present', markedBy: 1, createdAt: `${weekdayDates[1]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[2], status: 'late', markedBy: 1, createdAt: `${weekdayDates[2]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[3], status: 'present', markedBy: 1, createdAt: `${weekdayDates[3]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[4], status: 'present', markedBy: 1, createdAt: `${weekdayDates[4]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[5], status: 'present', markedBy: 1, createdAt: `${weekdayDates[5]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[6], status: 'present', markedBy: 1, createdAt: `${weekdayDates[6]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[7], status: 'present', markedBy: 1, createdAt: `${weekdayDates[7]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[8], status: 'present', markedBy: 1, createdAt: `${weekdayDates[8]}T09:00:00.000Z` },
        { teacherId: 2, date: weekdayDates[9], status: 'present', markedBy: 1, createdAt: `${weekdayDates[9]}T09:00:00.000Z` },

        // Teacher 3 - Good attendance with one absence
        { teacherId: 3, date: weekdayDates[0], status: 'present', markedBy: 1, createdAt: `${weekdayDates[0]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[1], status: 'present', markedBy: 1, createdAt: `${weekdayDates[1]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[2], status: 'present', markedBy: 1, createdAt: `${weekdayDates[2]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[3], status: 'present', markedBy: 1, createdAt: `${weekdayDates[3]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[4], status: 'absent', markedBy: 1, createdAt: `${weekdayDates[4]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[5], status: 'present', markedBy: 1, createdAt: `${weekdayDates[5]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[6], status: 'present', markedBy: 1, createdAt: `${weekdayDates[6]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[7], status: 'present', markedBy: 1, createdAt: `${weekdayDates[7]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[8], status: 'present', markedBy: 1, createdAt: `${weekdayDates[8]}T09:00:00.000Z` },
        { teacherId: 3, date: weekdayDates[9], status: 'present', markedBy: 1, createdAt: `${weekdayDates[9]}T09:00:00.000Z` },

        // Teacher 4 - Perfect attendance
        { teacherId: 4, date: weekdayDates[0], status: 'present', markedBy: 1, createdAt: `${weekdayDates[0]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[1], status: 'present', markedBy: 1, createdAt: `${weekdayDates[1]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[2], status: 'present', markedBy: 1, createdAt: `${weekdayDates[2]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[3], status: 'present', markedBy: 1, createdAt: `${weekdayDates[3]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[4], status: 'present', markedBy: 1, createdAt: `${weekdayDates[4]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[5], status: 'present', markedBy: 1, createdAt: `${weekdayDates[5]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[6], status: 'present', markedBy: 1, createdAt: `${weekdayDates[6]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[7], status: 'present', markedBy: 1, createdAt: `${weekdayDates[7]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[8], status: 'present', markedBy: 1, createdAt: `${weekdayDates[8]}T09:00:00.000Z` },
        { teacherId: 4, date: weekdayDates[9], status: 'present', markedBy: 1, createdAt: `${weekdayDates[9]}T09:00:00.000Z` },

        // Teacher 5 - Good attendance with some late arrivals
        { teacherId: 5, date: weekdayDates[0], status: 'present', markedBy: 1, createdAt: `${weekdayDates[0]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[1], status: 'late', markedBy: 1, createdAt: `${weekdayDates[1]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[2], status: 'present', markedBy: 1, createdAt: `${weekdayDates[2]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[3], status: 'present', markedBy: 1, createdAt: `${weekdayDates[3]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[4], status: 'present', markedBy: 1, createdAt: `${weekdayDates[4]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[5], status: 'absent', markedBy: 1, createdAt: `${weekdayDates[5]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[6], status: 'present', markedBy: 1, createdAt: `${weekdayDates[6]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[7], status: 'present', markedBy: 1, createdAt: `${weekdayDates[7]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[8], status: 'late', markedBy: 1, createdAt: `${weekdayDates[8]}T09:00:00.000Z` },
        { teacherId: 5, date: weekdayDates[9], status: 'present', markedBy: 1, createdAt: `${weekdayDates[9]}T09:00:00.000Z` },
    ];

    await db.insert(staffAttendance).values(sampleAttendance);
    
    console.log('✅ Staff attendance seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});