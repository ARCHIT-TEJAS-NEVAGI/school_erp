import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sections, classes, teachers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const classIdParam = searchParams.get('classId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single section by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const section = await db
        .select()
        .from(sections)
        .where(eq(sections.id, parseInt(id)))
        .limit(1);

      if (section.length === 0) {
        return NextResponse.json(
          { error: 'Section not found', code: 'SECTION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(section[0], { status: 200 });
    }

    // List sections with optional classId filter
    let query = db.select().from(sections);

    if (classIdParam) {
      const classId = parseInt(classIdParam);
      if (isNaN(classId)) {
        return NextResponse.json(
          { error: 'Valid classId is required', code: 'INVALID_CLASS_ID' },
          { status: 400 }
        );
      }
      query = query.where(eq(sections.classId, classId));
    }

    const results = await query
      .orderBy(desc(sections.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionName, classId, classTeacherId } = body;

    // Validate required fields
    if (!sectionName || !sectionName.trim()) {
      return NextResponse.json(
        { error: 'Section name is required', code: 'MISSING_SECTION_NAME' },
        { status: 400 }
      );
    }

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required', code: 'MISSING_CLASS_ID' },
        { status: 400 }
      );
    }

    // Validate classId is a valid number
    const parsedClassId = parseInt(classId);
    if (isNaN(parsedClassId)) {
      return NextResponse.json(
        { error: 'Valid class ID is required', code: 'INVALID_CLASS_ID' },
        { status: 400 }
      );
    }

    // Validate classId exists in classes table
    const existingClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, parsedClassId))
      .limit(1);

    if (existingClass.length === 0) {
      return NextResponse.json(
        { error: 'Class not found', code: 'CLASS_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate classTeacherId if provided
    let parsedClassTeacherId = null;
    if (classTeacherId) {
      parsedClassTeacherId = parseInt(classTeacherId);
      if (isNaN(parsedClassTeacherId)) {
        return NextResponse.json(
          { error: 'Valid class teacher ID is required', code: 'INVALID_CLASS_TEACHER_ID' },
          { status: 400 }
        );
      }

      const existingTeacher = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, parsedClassTeacherId))
        .limit(1);

      if (existingTeacher.length === 0) {
        return NextResponse.json(
          { error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    // Prepare insert data
    const insertData: {
      sectionName: string;
      classId: number;
      classTeacherId?: number | null;
      createdAt: string;
    } = {
      sectionName: sectionName.trim(),
      classId: parsedClassId,
      createdAt: new Date().toISOString(),
    };

    if (parsedClassTeacherId !== null) {
      insertData.classTeacherId = parsedClassTeacherId;
    }

    // Insert new section
    const newSection = await db
      .insert(sections)
      .values(insertData)
      .returning();

    return NextResponse.json(newSection[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if section exists
    const existingSection = await db
      .select()
      .from(sections)
      .where(eq(sections.id, parsedId))
      .limit(1);

    if (existingSection.length === 0) {
      return NextResponse.json(
        { error: 'Section not found', code: 'SECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sectionName, classId, classTeacherId } = body;

    // Prepare update data
    const updateData: {
      sectionName?: string;
      classId?: number;
      classTeacherId?: number | null;
    } = {};

    // Validate and add sectionName if provided
    if (sectionName !== undefined) {
      if (!sectionName.trim()) {
        return NextResponse.json(
          { error: 'Section name cannot be empty', code: 'INVALID_SECTION_NAME' },
          { status: 400 }
        );
      }
      updateData.sectionName = sectionName.trim();
    }

    // Validate and add classId if provided
    if (classId !== undefined) {
      const parsedClassId = parseInt(classId);
      if (isNaN(parsedClassId)) {
        return NextResponse.json(
          { error: 'Valid class ID is required', code: 'INVALID_CLASS_ID' },
          { status: 400 }
        );
      }

      const existingClass = await db
        .select()
        .from(classes)
        .where(eq(classes.id, parsedClassId))
        .limit(1);

      if (existingClass.length === 0) {
        return NextResponse.json(
          { error: 'Class not found', code: 'CLASS_NOT_FOUND' },
          { status: 404 }
        );
      }

      updateData.classId = parsedClassId;
    }

    // Validate and add classTeacherId if provided
    if (classTeacherId !== undefined) {
      if (classTeacherId === null) {
        updateData.classTeacherId = null;
      } else {
        const parsedClassTeacherId = parseInt(classTeacherId);
        if (isNaN(parsedClassTeacherId)) {
          return NextResponse.json(
            { error: 'Valid class teacher ID is required', code: 'INVALID_CLASS_TEACHER_ID' },
            { status: 400 }
          );
        }

        const existingTeacher = await db
          .select()
          .from(teachers)
          .where(eq(teachers.id, parsedClassTeacherId))
          .limit(1);

        if (existingTeacher.length === 0) {
          return NextResponse.json(
            { error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' },
            { status: 404 }
          );
        }

        updateData.classTeacherId = parsedClassTeacherId;
      }
    }

    // Update section
    const updatedSection = await db
      .update(sections)
      .set(updateData)
      .where(eq(sections.id, parsedId))
      .returning();

    return NextResponse.json(updatedSection[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);

    // Check if section exists
    const existingSection = await db
      .select()
      .from(sections)
      .where(eq(sections.id, parsedId))
      .limit(1);

    if (existingSection.length === 0) {
      return NextResponse.json(
        { error: 'Section not found', code: 'SECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete section
    const deletedSection = await db
      .delete(sections)
      .where(eq(sections.id, parsedId))
      .returning();

    return NextResponse.json(
      {
        message: 'Section deleted successfully',
        section: deletedSection[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}