import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parents, users } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single parent by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const parent = await db
        .select()
        .from(parents)
        .where(eq(parents.id, parseInt(id)))
        .limit(1);

      if (parent.length === 0) {
        return NextResponse.json(
          { error: 'Parent not found', code: 'PARENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(parent[0], { status: 200 });
    }

    // List all parents with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(parents);

    if (search) {
      query = query.where(
        or(
          like(parents.relation, `%${search}%`),
          like(parents.occupation, `%${search}%`)
        )
      );
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, relation, occupation } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate userId exists in users table
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found with provided userId', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Create new parent
    const newParent = await db
      .insert(parents)
      .values({
        userId: parseInt(userId),
        relation: relation ? relation.trim() : null,
        occupation: occupation ? occupation.trim() : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newParent[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, relation, occupation } = body;

    // Check if parent exists
    const existingParent = await db
      .select()
      .from(parents)
      .where(eq(parents.id, parseInt(id)))
      .limit(1);

    if (existingParent.length === 0) {
      return NextResponse.json(
        { error: 'Parent not found', code: 'PARENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // If userId is being updated, validate it exists
    if (userId !== undefined) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'User not found with provided userId', code: 'USER_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (userId !== undefined) {
      updateData.userId = parseInt(userId);
    }
    if (relation !== undefined) {
      updateData.relation = relation ? relation.trim() : null;
    }
    if (occupation !== undefined) {
      updateData.occupation = occupation ? occupation.trim() : null;
    }

    // Update parent
    const updatedParent = await db
      .update(parents)
      .set(updateData)
      .where(eq(parents.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedParent[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if parent exists
    const existingParent = await db
      .select()
      .from(parents)
      .where(eq(parents.id, parseInt(id)))
      .limit(1);

    if (existingParent.length === 0) {
      return NextResponse.json(
        { error: 'Parent not found', code: 'PARENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete parent
    const deletedParent = await db
      .delete(parents)
      .where(eq(parents.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Parent deleted successfully',
        parent: deletedParent[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}