import { db } from '@/db';
import { paymentInstallments } from '@/db/schema';

async function main() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const sampleInstallments = [
        // Invoice 1: Both installments paid
        {
            invoiceId: 1,
            installmentNumber: 1,
            amount: 3750,
            dueDate: today.toISOString(),
            paidAmount: 3750,
            status: 'paid',
            paymentId: 1,
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            invoiceId: 1,
            installmentNumber: 2,
            amount: 3750,
            dueDate: nextMonth.toISOString(),
            paidAmount: 3750,
            status: 'paid',
            paymentId: 2,
            createdAt: new Date('2024-01-15').toISOString(),
        },
        // Invoice 2: First paid, second pending
        {
            invoiceId: 2,
            installmentNumber: 1,
            amount: 3100,
            dueDate: today.toISOString(),
            paidAmount: 3100,
            status: 'paid',
            paymentId: 3,
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            invoiceId: 2,
            installmentNumber: 2,
            amount: 3100,
            dueDate: nextMonth.toISOString(),
            paidAmount: 0,
            status: 'pending',
            paymentId: null,
            createdAt: new Date('2024-01-20').toISOString(),
        },
        // Invoice 3: Both pending
        {
            invoiceId: 3,
            installmentNumber: 1,
            amount: 2900,
            dueDate: today.toISOString(),
            paidAmount: 0,
            status: 'pending',
            paymentId: null,
            createdAt: new Date('2024-02-01').toISOString(),
        },
        {
            invoiceId: 3,
            installmentNumber: 2,
            amount: 2900,
            dueDate: nextMonth.toISOString(),
            paidAmount: 0,
            status: 'pending',
            paymentId: null,
            createdAt: new Date('2024-02-01').toISOString(),
        },
        // Invoice 4: First overdue, second pending
        {
            invoiceId: 4,
            installmentNumber: 1,
            amount: 3600,
            dueDate: new Date('2024-01-10').toISOString(),
            paidAmount: 0,
            status: 'overdue',
            paymentId: null,
            createdAt: new Date('2024-01-05').toISOString(),
        },
        {
            invoiceId: 4,
            installmentNumber: 2,
            amount: 3600,
            dueDate: nextMonth.toISOString(),
            paidAmount: 0,
            status: 'pending',
            paymentId: null,
            createdAt: new Date('2024-01-05').toISOString(),
        },
        // Invoice 5: Both pending
        {
            invoiceId: 5,
            installmentNumber: 1,
            amount: 3250,
            dueDate: today.toISOString(),
            paidAmount: 0,
            status: 'pending',
            paymentId: null,
            createdAt: new Date('2024-02-10').toISOString(),
        },
        {
            invoiceId: 5,
            installmentNumber: 2,
            amount: 3250,
            dueDate: nextMonth.toISOString(),
            paidAmount: 0,
            status: 'pending',
            paymentId: null,
            createdAt: new Date('2024-02-10').toISOString(),
        },
    ];

    await db.insert(paymentInstallments).values(sampleInstallments);
    
    console.log('✅ Payment installments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});