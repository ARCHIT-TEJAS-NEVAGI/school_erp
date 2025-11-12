import { db } from '@/db';
import { feePayments } from '@/db/schema';

async function main() {
    const samplePayments = [
        {
            invoiceId: 1,
            amount: 3500.00,
            paymentMethod: 'online',
            paymentDate: new Date('2024-12-05').toISOString(),
            transactionId: 'TXN-789456123',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 2,
            amount: 2800.00,
            paymentMethod: 'cash',
            paymentDate: new Date('2024-12-08').toISOString(),
            transactionId: null,
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 3,
            amount: 4200.00,
            paymentMethod: 'card',
            paymentDate: new Date('2024-12-10').toISOString(),
            transactionId: 'TXN-456789012',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 4,
            amount: 1500.00,
            paymentMethod: 'online',
            paymentDate: new Date('2024-12-12').toISOString(),
            transactionId: 'TXN-234567890',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 5,
            amount: 3200.00,
            paymentMethod: 'cash',
            paymentDate: new Date('2024-12-15').toISOString(),
            transactionId: null,
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 6,
            amount: 4500.00,
            paymentMethod: 'online',
            paymentDate: new Date('2024-12-18').toISOString(),
            transactionId: 'TXN-567890123',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 7,
            amount: 2100.00,
            paymentMethod: 'cash',
            paymentDate: new Date('2024-12-20').toISOString(),
            transactionId: null,
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 8,
            amount: 3800.00,
            paymentMethod: 'card',
            paymentDate: new Date('2024-12-22').toISOString(),
            transactionId: 'TXN-890123456',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 9,
            amount: 2500.00,
            paymentMethod: 'online',
            paymentDate: new Date('2024-12-25').toISOString(),
            transactionId: 'TXN-345678901',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 10,
            amount: 4000.00,
            paymentMethod: 'cash',
            paymentDate: new Date('2024-12-28').toISOString(),
            transactionId: null,
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 3,
            amount: 1800.00,
            paymentMethod: 'online',
            paymentDate: new Date('2024-12-30').toISOString(),
            transactionId: 'TXN-678901234',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 5,
            amount: 1300.00,
            paymentMethod: 'cheque',
            paymentDate: new Date('2025-01-02').toISOString(),
            transactionId: null,
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 7,
            amount: 2200.00,
            paymentMethod: 'card',
            paymentDate: new Date('2025-01-03').toISOString(),
            transactionId: 'TXN-901234567',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 1,
            amount: 1500.00,
            paymentMethod: 'cash',
            paymentDate: new Date('2025-01-04').toISOString(),
            transactionId: null,
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
        {
            invoiceId: 6,
            amount: 2000.00,
            paymentMethod: 'online',
            paymentDate: new Date('2025-01-05').toISOString(),
            transactionId: 'TXN-123456789',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(feePayments).values(samplePayments);
    
    console.log('✅ Fee payments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});