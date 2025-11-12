import { db } from '@/db';
import { calendarEvents } from '@/db/schema';

async function main() {
    const sampleEvents = [
        // Holidays (3 records)
        {
            title: 'Republic Day',
            description: 'National holiday celebrating the adoption of the Constitution of India. Special flag hoisting ceremony and cultural programs will be organized in the school premises.',
            eventType: 'holiday',
            eventDate: '2025-01-26',
            endDate: null,
            isHoliday: true,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'Holi Festival',
            description: 'Festival of colors celebrating the arrival of spring and victory of good over evil. School will remain closed for the celebration.',
            eventType: 'holiday',
            eventDate: '2025-03-14',
            endDate: null,
            isHoliday: true,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'Good Friday',
            description: 'Christian holiday commemorating the crucifixion of Jesus Christ. School will be closed for the observance.',
            eventType: 'holiday',
            eventDate: '2025-03-29',
            endDate: null,
            isHoliday: true,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        
        // Exams (3 records)
        {
            title: 'First Semester Exam - Mathematics',
            description: 'Final examination for Mathematics covering all topics from the first semester including algebra, geometry, trigonometry, and calculus. Duration: 3 hours. Students must report 30 minutes before the exam.',
            eventType: 'exam',
            eventDate: '2025-02-03',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'First Semester Exam - Science',
            description: 'Comprehensive science examination covering physics, chemistry, and biology topics from the first semester. Duration: 3 hours. Practical examination will be conducted separately.',
            eventType: 'exam',
            eventDate: '2025-02-05',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'First Semester Exam - English',
            description: 'English language and literature examination covering grammar, comprehension, essay writing, and prescribed textbooks. Duration: 3 hours. Students must bring their own writing materials.',
            eventType: 'exam',
            eventDate: '2025-02-07',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        
        // Events (4 records)
        {
            title: 'Annual Sports Day',
            description: 'School\'s annual sports day featuring various athletic competitions, track and field events, and team sports. Parents and guardians are invited to attend. Students must wear sports uniforms and report by 8:00 AM.',
            eventType: 'event',
            eventDate: '2025-02-14',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'School Anniversary Celebration',
            description: 'Celebrating the 25th anniversary of our institution with cultural performances, alumni meet, award ceremony for outstanding students and teachers, and a special address by the principal. A gala dinner will follow the main event.',
            eventType: 'event',
            eventDate: '2025-03-01',
            endDate: '2025-03-02',
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'Science Exhibition',
            description: 'Annual science exhibition showcasing innovative projects and experiments by students from all grades. Topics include robotics, environmental science, physics demonstrations, and chemistry experiments. Open to public viewing from 9:00 AM to 5:00 PM.',
            eventType: 'event',
            eventDate: '2025-03-18',
            endDate: '2025-03-19',
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'Cultural Day Celebration',
            description: 'Multicultural celebration featuring traditional dances, music performances, art exhibitions, and food stalls representing various cultures. Students are encouraged to wear traditional attire and participate in cultural activities.',
            eventType: 'event',
            eventDate: '2025-03-22',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        
        // Meetings (2 records)
        {
            title: 'Parent-Teacher Meeting',
            description: 'Quarterly parent-teacher meeting to discuss student academic progress, attendance records, behavioral observations, and areas of improvement. Time slots will be assigned to each parent to ensure individual attention. Please bring your ward\'s progress report.',
            eventType: 'meeting',
            eventDate: '2025-02-20',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
        {
            title: 'Budget Planning Meeting',
            description: 'Administrative meeting with school management, finance committee, and department heads to review current year expenses and plan budget allocation for the upcoming academic year. Discussion on infrastructure improvements, staff requirements, and resource allocation.',
            eventType: 'meeting',
            eventDate: '2025-01-30',
            endDate: null,
            isHoliday: false,
            createdBy: 1,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(calendarEvents).values(sampleEvents);
    
    console.log('✅ Calendar events seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});