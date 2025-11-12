import { db } from '@/db';
import { settings } from '@/db/schema';

async function main() {
    try {
        const sampleSettings = [
            {
                key: 'whatsapp_attendance_template',
                value: '🎓 School Attendance Alert\n\nYour ward [Student Name] ([Admission No]) has reached the school.\n\n⏰ Time: [HH:MM AM/PM]\n📅 Date: [DD/MM/YYYY]\n✅ Status: PRESENT\n\nThank you!\n- School Management',
                updatedAt: new Date().toISOString(),
            },
        ];

        await db.insert(settings).values(sampleSettings);
        
        console.log('✅ Settings seeder completed successfully');
    } catch (error) {
        console.error('❌ Seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder execution failed:', error);
    process.exit(1);
});