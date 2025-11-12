import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key')?.trim();

    if (!key) {
      return NextResponse.json(
        { error: 'key parameter is required', code: 'MISSING_KEY' },
        { status: 400 }
      );
    }

    const setting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (setting.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found', code: 'SETTING_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body.key?.trim();
    const value = body.value?.trim();

    if (!key) {
      return NextResponse.json(
        { error: 'key is required', code: 'MISSING_KEY' },
        { status: 400 }
      );
    }

    if (!value) {
      return NextResponse.json(
        { error: 'value is required', code: 'MISSING_VALUE' },
        { status: 400 }
      );
    }

    const existingSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json(
        { error: 'Setting not found', code: 'SETTING_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updated = await db
      .update(settings)
      .set({
        value,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(settings.key, key))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}