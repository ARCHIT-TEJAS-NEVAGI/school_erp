import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import archiver from 'archiver';
import { Readable } from 'stream';
import { 
  users, students, teachers, parents, classes, sections, subjects,
  attendance, marks, feeInvoices, feePayments, paymentInstallments,
  staffAttendance, teacherRemarks, teacherLeaveRequests, calendarEvents,
  whatsappMessages, feeConcessions, timetables, documents, notifications,
  analyticsLogs, academicYears, feeTemplates, studentParents
} from '@/db/schema';
import { ne } from 'drizzle-orm';

// Helper function to convert data to CSV format
function convertToCSV(data: any[], tableName: string): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// POST: Export all tables to ZIP, then clear database (keep specified tables/records)
export async function POST(request: NextRequest) {
  try {
    console.log('Starting export and clear database operation...');
    
    // PHASE 1: EXPORT ALL TABLES TO ZIP
    console.log('Phase 1: Exporting all tables to CSV...');
    
    const tableExports = [
      { name: 'users', data: await db.select().from(users) },
      { name: 'students', data: await db.select().from(students) },
      { name: 'teachers', data: await db.select().from(teachers) },
      { name: 'parents', data: await db.select().from(parents) },
      { name: 'classes', data: await db.select().from(classes) },
      { name: 'sections', data: await db.select().from(sections) },
      { name: 'subjects', data: await db.select().from(subjects) },
      { name: 'attendance', data: await db.select().from(attendance) },
      { name: 'marks', data: await db.select().from(marks) },
      { name: 'fee_invoices', data: await db.select().from(feeInvoices) },
      { name: 'fee_payments', data: await db.select().from(feePayments) },
      { name: 'payment_installments', data: await db.select().from(paymentInstallments) },
      { name: 'staff_attendance', data: await db.select().from(staffAttendance) },
      { name: 'teacher_remarks', data: await db.select().from(teacherRemarks) },
      { name: 'teacher_leave_requests', data: await db.select().from(teacherLeaveRequests) },
      { name: 'calendar_events', data: await db.select().from(calendarEvents) },
      { name: 'whatsapp_messages', data: await db.select().from(whatsappMessages) },
      { name: 'fee_concessions', data: await db.select().from(feeConcessions) },
      { name: 'timetables', data: await db.select().from(timetables) },
      { name: 'documents', data: await db.select().from(documents) },
      { name: 'notifications', data: await db.select().from(notifications) },
      { name: 'analytics_logs', data: await db.select().from(analyticsLogs) },
      { name: 'academic_years', data: await db.select().from(academicYears) },
      { name: 'fee_templates', data: await db.select().from(feeTemplates) },
      { name: 'student_parents', data: await db.select().from(studentParents) },
    ];

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => {
      throw err;
    });

    let totalRecords = 0;
    let tablesExported = 0;

    // Add each table's CSV to the archive
    for (const table of tableExports) {
      if (table.data.length > 0) {
        const csv = convertToCSV(table.data, table.name);
        archive.append(csv, { name: `${table.name}.csv` });
        totalRecords += table.data.length;
        tablesExported++;
        console.log(`Exported ${table.name}: ${table.data.length} records`);
      } else {
        console.log(`Skipped ${table.name}: No records`);
      }
    }

    // Finalize the archive
    await archive.finalize();

    // Wait for all chunks to be collected
    await new Promise((resolve) => {
      archive.on('end', resolve);
    });

    const zipBuffer = Buffer.concat(chunks);
    console.log(`Export complete: ${totalRecords} records from ${tablesExported} tables`);

    // PHASE 2: CLEAR DATABASE
    console.log('\nPhase 2: Clearing database...');
    console.log('Following foreign key dependency order...');

    let tablesCleared = 0;

    try {
      // Delete in correct order to avoid foreign key constraint violations
      
      // 1. Student-Parents junction table
      await db.delete(studentParents);
      console.log('✓ Deleted studentParents');
      tablesCleared++;

      // 2. Attendance
      await db.delete(attendance);
      console.log('✓ Deleted attendance');
      tablesCleared++;

      // 3. Marks
      await db.delete(marks);
      console.log('✓ Deleted marks');
      tablesCleared++;

      // 4. Teacher Remarks
      await db.delete(teacherRemarks);
      console.log('✓ Deleted teacherRemarks');
      tablesCleared++;

      // 5. Fee Payments
      await db.delete(feePayments);
      console.log('✓ Deleted feePayments');
      tablesCleared++;

      // 6. Payment Installments
      await db.delete(paymentInstallments);
      console.log('✓ Deleted paymentInstallments');
      tablesCleared++;

      // 7. Fee Invoices
      await db.delete(feeInvoices);
      console.log('✓ Deleted feeInvoices');
      tablesCleared++;

      // 8. Fee Concessions
      await db.delete(feeConcessions);
      console.log('✓ Deleted feeConcessions');
      tablesCleared++;

      // 9. Timetables
      await db.delete(timetables);
      console.log('✓ Deleted timetables');
      tablesCleared++;

      // 10. Documents
      await db.delete(documents);
      console.log('✓ Deleted documents');
      tablesCleared++;

      // 11. Notifications
      await db.delete(notifications);
      console.log('✓ Deleted notifications');
      tablesCleared++;

      // 12. WhatsApp Messages
      await db.delete(whatsappMessages);
      console.log('✓ Deleted whatsappMessages');
      tablesCleared++;

      // 13. Staff Attendance
      await db.delete(staffAttendance);
      console.log('✓ Deleted staffAttendance');
      tablesCleared++;

      // 14. Teacher Leave Requests
      await db.delete(teacherLeaveRequests);
      console.log('✓ Deleted teacherLeaveRequests');
      tablesCleared++;

      // 15. Calendar Events
      await db.delete(calendarEvents);
      console.log('✓ Deleted calendarEvents');
      tablesCleared++;

      // 16. Subjects
      await db.delete(subjects);
      console.log('✓ Deleted subjects');
      tablesCleared++;

      // 17. Students
      await db.delete(students);
      console.log('✓ Deleted students');
      tablesCleared++;

      // 18. Teachers
      await db.delete(teachers);
      console.log('✓ Deleted teachers');
      tablesCleared++;

      // 19. Parents
      await db.delete(parents);
      console.log('✓ Deleted parents');
      tablesCleared++;

      // 20. Users (keep admin user with id = 1)
      await db.delete(users).where(ne(users.id, 1));
      console.log('✓ Deleted users (kept admin user id=1)');
      tablesCleared++;

      // 21. Analytics Logs
      await db.delete(analyticsLogs);
      console.log('✓ Deleted analyticsLogs');
      tablesCleared++;

      console.log('\n=== DATABASE CLEAR SUMMARY ===');
      console.log(`✓ Successfully cleared ${tablesCleared} tables`);
      console.log('\nTables KEPT (completely preserved):');
      console.log('  - academic_years (all records)');
      console.log('  - classes (all records)');
      console.log('  - sections (all records)');
      console.log('  - fee_templates (all records)');
      console.log('  - users (admin user id=1 only)');
      console.log('\nTables CLEARED (all records deleted):');
      console.log('  - All student, teacher, parent data');
      console.log('  - All attendance, marks, and academic records');
      console.log('  - All fee invoices, payments, and installments');
      console.log('  - All notifications, documents, and messages');
      console.log('  - All timetables and calendar events');
      console.log('  - All analytics logs');

    } catch (deleteError) {
      console.error('Error during database deletion:', deleteError);
      // Continue execution - data is already exported
      console.log('Warning: Some deletions may have failed, but data has been exported safely');
    }

    // Return the ZIP file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `school_database_backup_before_clear_${timestamp}.zip`;

    console.log(`\n✓ Returning backup file: ${filename}`);
    console.log(`✓ Total size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export and clear database error:', error);
    return NextResponse.json({ 
      error: 'Failed to export and clear database: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'EXPORT_CLEAR_ERROR'
    }, { status: 500 });
  }
}