import { db } from '@/db';
import { feeInvoices } from '@/db/schema';

async function main() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const statusDistribution = [
        'pending', 'pending', 'pending', 'pending',
        'partial', 'partial', 'partial',
        'paid', 'paid',
        'overdue'
    ];

    const sampleInvoices = [
        {
            studentId: 1,
            invoiceNumber: 'INV-2024-001',
            totalAmount: 7500.00,
            paidAmount: 7500.00,
            dueAmount: 0.00,
            dueDate: new Date(currentYear, currentMonth, 10).toISOString(),
            status: 'paid',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 2,
            invoiceNumber: 'INV-2024-002',
            totalAmount: 6200.00,
            paidAmount: 3100.00,
            dueAmount: 3100.00,
            dueDate: new Date(currentYear, currentMonth, 15).toISOString(),
            status: 'partial',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 3,
            invoiceNumber: 'INV-2024-003',
            totalAmount: 5800.00,
            paidAmount: 0.00,
            dueAmount: 5800.00,
            dueDate: new Date(currentYear, currentMonth, 20).toISOString(),
            status: 'pending',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 4,
            invoiceNumber: 'INV-2024-004',
            totalAmount: 7200.00,
            paidAmount: 4800.00,
            dueAmount: 2400.00,
            dueDate: new Date(currentYear, currentMonth, 12).toISOString(),
            status: 'partial',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 5,
            invoiceNumber: 'INV-2024-005',
            totalAmount: 6500.00,
            paidAmount: 0.00,
            dueAmount: 6500.00,
            dueDate: new Date(currentYear, currentMonth, 25).toISOString(),
            status: 'pending',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 6,
            invoiceNumber: 'INV-2024-006',
            totalAmount: 5500.00,
            paidAmount: 0.00,
            dueAmount: 5500.00,
            dueDate: new Date(currentYear, currentMonth - 1, 5).toISOString(),
            status: 'overdue',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 7,
            invoiceNumber: 'INV-2024-007',
            totalAmount: 7800.00,
            paidAmount: 0.00,
            dueAmount: 7800.00,
            dueDate: new Date(currentYear, currentMonth, 18).toISOString(),
            status: 'pending',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 8,
            invoiceNumber: 'INV-2024-008',
            totalAmount: 6800.00,
            paidAmount: 6800.00,
            dueAmount: 0.00,
            dueDate: new Date(currentYear, currentMonth, 8).toISOString(),
            status: 'paid',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 9,
            invoiceNumber: 'INV-2024-009',
            totalAmount: 7100.00,
            paidAmount: 2400.00,
            dueAmount: 4700.00,
            dueDate: new Date(currentYear, currentMonth, 22).toISOString(),
            status: 'partial',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        },
        {
            studentId: 10,
            invoiceNumber: 'INV-2024-010',
            totalAmount: 5200.00,
            paidAmount: 0.00,
            dueAmount: 5200.00,
            dueDate: new Date(currentYear, currentMonth, 28).toISOString(),
            status: 'pending',
            academicYearId: 2,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(feeInvoices).values(sampleInvoices);
    
    console.log('✅ Fee invoices seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});