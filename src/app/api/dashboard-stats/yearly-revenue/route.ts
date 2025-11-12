import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feePayments } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get current year and calculate date boundaries
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    // Query to sum all completed payments within the current year
    const result = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${feePayments.amount}), 0)`,
      })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.paymentStatus, 'completed'),
          gte(feePayments.paymentDate, startDate),
          lte(feePayments.paymentDate, endDate)
        )
      );

    // Extract the sum and convert to number
    const yearlyRevenue = Number(result[0]?.totalRevenue ?? 0);

    // Return response with metadata
    return NextResponse.json(
      {
        yearlyRevenue,
        year: currentYear,
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}