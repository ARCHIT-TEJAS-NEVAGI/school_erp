import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  students,
  teachers,
  parents,
  classes,
  sections,
  subjects,
  attendance,
  marks,
  feeInvoices,
  feePayments,
  paymentInstallments,
  staffAttendance,
  teacherRemarks,
  teacherLeaveRequests,
  calendarEvents,
  whatsappMessages,
  feeConcessions,
  timetables,
  documents,
  notifications,
  analyticsLogs,
  academicYears,
  feeTemplates,
  studentParents,
} from '@/db/schema';
import archiver from 'archiver';
import { Readable } from 'stream';

// Helper function to escape CSV values
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert booleans to string
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Stringify objects and arrays
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }

  // Convert to string
  const stringValue = String(value);

  // Check if escaping is needed
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// Helper function to convert array of objects to CSV
function convertToCSV(data: any[], tableName: string): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Extract headers from first record
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map((header) => escapeCSVValue(header)).join(',');

  // Create data rows
  const dataRows = data.map((record) => {
    return headers
      .map((header) => escapeCSVValue(record[header]))
      .join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

// Define all tables to export
const TABLES_TO_EXPORT = [
  { name: 'users', schema: users },
  { name: 'students', schema: students },
  { name: 'teachers', schema: teachers },
  { name: 'parents', schema: parents },
  { name: 'classes', schema: classes },
  { name: 'sections', schema: sections },
  { name: 'subjects', schema: subjects },
  { name: 'attendance', schema: attendance },
  { name: 'marks', schema: marks },
  { name: 'fee_invoices', schema: feeInvoices },
  { name: 'fee_payments', schema: feePayments },
  { name: 'payment_installments', schema: paymentInstallments },
  { name: 'staff_attendance', schema: staffAttendance },
  { name: 'teacher_remarks', schema: teacherRemarks },
  { name: 'teacher_leave_requests', schema: teacherLeaveRequests },
  { name: 'calendar_events', schema: calendarEvents },
  { name: 'whatsapp_messages', schema: whatsappMessages },
  { name: 'fee_concessions', schema: feeConcessions },
  { name: 'timetables', schema: timetables },
  { name: 'documents', schema: documents },
  { name: 'notifications', schema: notifications },
  { name: 'analytics_logs', schema: analyticsLogs },
  { name: 'academic_years', schema: academicYears },
  { name: 'fee_templates', schema: feeTemplates },
  { name: 'student_parents', schema: studentParents },
];

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database export...');

    // Create a timestamp for the filename
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');

    // Create a map to store CSV data for each table
    const csvDataMap = new Map<string, string>();

    // Process each table sequentially
    for (const table of TABLES_TO_EXPORT) {
      try {
        console.log(`Exporting table: ${table.name}...`);

        // Query all records from the table
        const records = await db.select().from(table.schema);

        console.log(`Found ${records.length} records in ${table.name}`);

        // Convert to CSV
        const csvData = convertToCSV(records, table.name);

        // Store in map
        csvDataMap.set(table.name, csvData);

        console.log(`Successfully exported ${table.name}`);
      } catch (error) {
        console.error(`Error exporting table ${table.name}:`, error);
        // Continue with other tables even if one fails
        csvDataMap.set(table.name, `Error exporting table: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Creating ZIP archive...');

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Create a promise to handle the archive completion
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        console.log('Archive completed');
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        reject(err);
      });
    });

    // Add CSV files to archive
    for (const [tableName, csvData] of csvDataMap.entries()) {
      if (csvData) {
        archive.append(csvData, { name: `${tableName}.csv` });
      }
    }

    // Finalize the archive
    await archive.finalize();

    // Wait for archive to complete
    const zipBuffer = await archivePromise;

    console.log(`Export complete. ZIP size: ${zipBuffer.length} bytes`);

    // Return ZIP file with proper headers
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="school_database_export_${timestamp}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Database export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export database: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'EXPORT_FAILED',
      },
      { status: 500 }
    );
  }
}