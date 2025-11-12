import { db } from '@/db';
import { analyticsLogs } from '@/db/schema';

async function main() {
    const sampleAnalyticsLogs = [
        {
            logType: 'attendance_anomaly',
            relatedEntityType: 'student',
            relatedEntityId: 1,
            severity: 'warning',
            aiInsights: JSON.stringify({
                pattern: 'Consecutive absences detected',
                recommendation: 'Contact parent'
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'performance_analysis',
            relatedEntityType: 'student',
            relatedEntityId: 2,
            severity: 'info',
            aiInsights: JSON.stringify({
                trend: 'Improving marks',
                prediction: 'Good performance expected'
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'fee_defaulter',
            relatedEntityType: 'student',
            relatedEntityId: 3,
            severity: 'critical',
            aiInsights: JSON.stringify({
                outstanding: 5000,
                days_overdue: 15
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'teacher_workload',
            relatedEntityType: 'teacher',
            relatedEntityId: 1,
            severity: 'warning',
            aiInsights: JSON.stringify({
                classes_assigned: 8,
                recommendation: 'Redistribute classes'
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'class_performance',
            relatedEntityType: 'class',
            relatedEntityId: 1,
            severity: 'info',
            aiInsights: JSON.stringify({
                average_marks: 75,
                top_performers: 5
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'attendance_trend',
            relatedEntityType: 'section',
            relatedEntityId: 1,
            severity: 'info',
            aiInsights: JSON.stringify({
                attendance_rate: 85,
                trend: 'Stable'
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'fee_collection',
            relatedEntityType: 'general',
            relatedEntityId: null,
            severity: 'info',
            aiInsights: JSON.stringify({
                collected: 150000,
                pending: 50000
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'exam_performance',
            relatedEntityType: 'student',
            relatedEntityId: 5,
            severity: 'critical',
            aiInsights: JSON.stringify({
                failed_subjects: 2,
                recommendation: 'Extra coaching required'
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'parent_engagement',
            relatedEntityType: 'parent',
            relatedEntityId: 1,
            severity: 'info',
            aiInsights: JSON.stringify({
                meetings_attended: 3,
                engagement_level: 'High'
            }),
            createdAt: new Date().toISOString(),
        },
        {
            logType: 'system_health',
            relatedEntityType: 'general',
            relatedEntityId: null,
            severity: 'info',
            aiInsights: JSON.stringify({
                active_users: 50,
                database_size: '250MB'
            }),
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(analyticsLogs).values(sampleAnalyticsLogs);
    
    console.log('✅ Analytics logs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});