import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, users, sections } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single student by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const student = await db
        .select({
          id: students.id,
          userId: students.userId,
          admissionNumber: students.admissionNumber,
          rollNumber: students.rollNumber,
          sectionId: students.sectionId,
          dateOfBirth: students.dateOfBirth,
          gender: students.gender,
          bloodGroup: students.bloodGroup,
          address: students.address,
          emergencyContact: students.emergencyContact,
          username: students.username,
          password: students.password,
          studentMobileNumber: students.studentMobileNumber,
          parentName: students.parentName,
          parentMobileNumber: students.parentMobileNumber,
          feesConcession: students.feesConcession,
          isIrregular: students.isIrregular,
          remarksColor: students.remarksColor,
          createdAt: students.createdAt,
          fullName: users.fullName,
        })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .where(eq(students.id, parseInt(id)))
        .limit(1);

      if (student.length === 0) {
        return NextResponse.json(
          { error: 'Student not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(student[0], { status: 200 });
    }

    // List students with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const sectionId = searchParams.get('sectionId');
    const isIrregular = searchParams.get('isIrregular');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db
      .select({
        id: students.id,
        userId: students.userId,
        admissionNumber: students.admissionNumber,
        rollNumber: students.rollNumber,
        sectionId: students.sectionId,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        bloodGroup: students.bloodGroup,
        address: students.address,
        emergencyContact: students.emergencyContact,
        username: students.username,
        password: students.password,
        studentMobileNumber: students.studentMobileNumber,
        parentName: students.parentName,
        parentMobileNumber: students.parentMobileNumber,
        feesConcession: students.feesConcession,
        isIrregular: students.isIrregular,
        remarksColor: students.remarksColor,
        createdAt: students.createdAt,
        fullName: users.fullName,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id));

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(students.admissionNumber, `%${search}%`),
          like(students.rollNumber, `%${search}%`),
          like(students.username, `%${search}%`),
          like(users.fullName, `%${search}%`)
        )
      );
    }

    if (sectionId) {
      const parsedSectionId = parseInt(sectionId);
      if (!isNaN(parsedSectionId)) {
        conditions.push(eq(students.sectionId, parsedSectionId));
      }
    }

    if (isIrregular !== null && isIrregular !== undefined) {
      const isIrregularBool = isIrregular === 'true';
      conditions.push(eq(students.isIrregular, isIrregularBool));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    const sortColumn = students[sort as keyof typeof students] ?? students.createdAt;
    query = order === 'asc' ? query.orderBy(sortColumn) : query.orderBy(desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

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
    const {
      userId,
      admissionNumber,
      sectionId,
      rollNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      username,
      password,
      studentMobileNumber,
      parentName,
      parentMobileNumber,
      feesConcession,
      isIrregular,
      remarksColor,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!admissionNumber) {
      return NextResponse.json(
        { error: 'admissionNumber is required', code: 'MISSING_ADMISSION_NUMBER' },
        { status: 400 }
      );
    }

    if (!sectionId) {
      return NextResponse.json(
        { error: 'sectionId is required', code: 'MISSING_SECTION_ID' },
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
        { error: 'User with provided userId does not exist', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate admissionNumber is unique
    const admissionExists = await db
      .select()
      .from(students)
      .where(eq(students.admissionNumber, admissionNumber.trim()))
      .limit(1);

    if (admissionExists.length > 0) {
      return NextResponse.json(
        { error: 'Admission number already exists', code: 'DUPLICATE_ADMISSION_NUMBER' },
        { status: 400 }
      );
    }

    // Validate username is unique if provided
    if (username) {
      const usernameExists = await db
        .select()
        .from(students)
        .where(eq(students.username, username.trim()))
        .limit(1);

      if (usernameExists.length > 0) {
        return NextResponse.json(
          { error: 'Username already exists', code: 'DUPLICATE_USERNAME' },
          { status: 400 }
        );
      }
    }

    // Validate sectionId exists in sections table
    const sectionExists = await db
      .select()
      .from(sections)
      .where(eq(sections.id, parseInt(sectionId)))
      .limit(1);

    if (sectionExists.length === 0) {
      return NextResponse.json(
        { error: 'Section with provided sectionId does not exist', code: 'SECTION_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate remarksColor if provided
    if (remarksColor && !['green', 'yellow', 'red'].includes(remarksColor)) {
      return NextResponse.json(
        { error: 'remarksColor must be green, yellow, or red', code: 'INVALID_REMARKS_COLOR' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const newStudent = await db
      .insert(students)
      .values({
        userId: parseInt(userId),
        admissionNumber: admissionNumber.trim(),
        sectionId: parseInt(sectionId),
        rollNumber: rollNumber?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address: address?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        username: username?.trim() || null,
        password: password || null,
        studentMobileNumber: studentMobileNumber?.trim() || null,
        parentName: parentName?.trim() || null,
        parentMobileNumber: parentMobileNumber?.trim() || null,
        feesConcession: feesConcession !== undefined ? parseFloat(feesConcession) : 0,
        isIrregular: isIrregular !== undefined ? Boolean(isIrregular) : false,
        remarksColor: remarksColor || 'green',
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newStudent[0], { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      userId,
      admissionNumber,
      sectionId,
      rollNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      username,
      password,
      studentMobileNumber,
      parentName,
      parentMobileNumber,
      feesConcession,
      isIrregular,
      remarksColor,
    } = body;

    // Check if student exists
    const existingStudent = await db
      .select()
      .from(students)
      .where(eq(students.id, parseInt(id)))
      .limit(1);

    if (existingStudent.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate userId if provided
    if (userId !== undefined) {
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'User with provided userId does not exist', code: 'USER_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Validate admissionNumber uniqueness if provided and different
    if (admissionNumber !== undefined && admissionNumber !== existingStudent[0].admissionNumber) {
      const admissionExists = await db
        .select()
        .from(students)
        .where(eq(students.admissionNumber, admissionNumber.trim()))
        .limit(1);

      if (admissionExists.length > 0) {
        return NextResponse.json(
          { error: 'Admission number already exists', code: 'DUPLICATE_ADMISSION_NUMBER' },
          { status: 400 }
        );
      }
    }

    // Validate username uniqueness if provided and different
    if (username !== undefined && username !== existingStudent[0].username) {
      const usernameExists = await db
        .select()
        .from(students)
        .where(eq(students.username, username.trim()))
        .limit(1);

      if (usernameExists.length > 0) {
        return NextResponse.json(
          { error: 'Username already exists', code: 'DUPLICATE_USERNAME' },
          { status: 400 }
        );
      }
    }

    // Validate sectionId if provided
    if (sectionId !== undefined) {
      const sectionExists = await db
        .select()
        .from(sections)
        .where(eq(sections.id, parseInt(sectionId)))
        .limit(1);

      if (sectionExists.length === 0) {
        return NextResponse.json(
          { error: 'Section with provided sectionId does not exist', code: 'SECTION_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Validate remarksColor if provided
    if (remarksColor !== undefined && !['green', 'yellow', 'red'].includes(remarksColor)) {
      return NextResponse.json(
        { error: 'remarksColor must be green, yellow, or red', code: 'INVALID_REMARKS_COLOR' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (userId !== undefined) updateData.userId = parseInt(userId);
    if (admissionNumber !== undefined) updateData.admissionNumber = admissionNumber.trim();
    if (sectionId !== undefined) updateData.sectionId = parseInt(sectionId);
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber?.trim() || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact?.trim() || null;
    if (username !== undefined) updateData.username = username?.trim() || null;
    if (password !== undefined) updateData.password = password || null;
    if (studentMobileNumber !== undefined) updateData.studentMobileNumber = studentMobileNumber?.trim() || null;
    if (parentName !== undefined) updateData.parentName = parentName?.trim() || null;
    if (parentMobileNumber !== undefined) updateData.parentMobileNumber = parentMobileNumber?.trim() || null;
    if (feesConcession !== undefined) updateData.feesConcession = parseFloat(feesConcession);
    if (isIrregular !== undefined) updateData.isIrregular = Boolean(isIrregular);
    if (remarksColor !== undefined) updateData.remarksColor = remarksColor;

    const updatedStudent = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, parseInt(id)))
      .returning();

    if (updatedStudent.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update student', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedStudent[0], { status: 200 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if student exists
    const existingStudent = await db
      .select()
      .from(students)
      .where(eq(students.id, parseInt(id)))
      .limit(1);

    if (existingStudent.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(students)
      .where(eq(students.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete student', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Student deleted successfully',
        student: deleted[0],
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