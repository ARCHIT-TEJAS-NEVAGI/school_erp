import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teachers, users } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single teacher by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const teacher = await db
        .select({
          id: teachers.id,
          userId: teachers.userId,
          employeeId: teachers.employeeId,
          qualification: teachers.qualification,
          specialization: teachers.specialization,
          joiningDate: teachers.joiningDate,
          salary: teachers.salary,
          createdAt: teachers.createdAt,
          fullName: users.fullName,
        })
        .from(teachers)
        .leftJoin(users, eq(teachers.userId, users.id))
        .where(eq(teachers.id, parseInt(id)))
        .limit(1);

      if (teacher.length === 0) {
        return NextResponse.json(
          { error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(teacher[0], { status: 200 });
    }

    // List teachers with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const searchEmployeeId = searchParams.get('search');

    let query = db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        qualification: teachers.qualification,
        specialization: teachers.specialization,
        joiningDate: teachers.joiningDate,
        salary: teachers.salary,
        createdAt: teachers.createdAt,
        fullName: users.fullName,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id));

    if (searchEmployeeId) {
      query = query.where(
        or(
          like(teachers.employeeId, `%${searchEmployeeId}%`),
          like(users.fullName, `%${searchEmployeeId}%`)
        )
      ) as any;
    }

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
    const { userId, employeeId, qualification, specialization, joiningDate, salary } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId is required', code: 'MISSING_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Validate employeeId is a string
    if (typeof employeeId !== 'string') {
      return NextResponse.json(
        { error: 'employeeId must be a string', code: 'INVALID_EMPLOYEE_ID_TYPE' },
        { status: 400 }
      );
    }

    // Validate userId exists in users table
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate employeeId is unique
    const existingTeacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.employeeId, employeeId.trim()))
      .limit(1);

    if (existingTeacher.length > 0) {
      return NextResponse.json(
        { error: 'Employee ID already exists', code: 'DUPLICATE_EMPLOYEE_ID' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: {
      userId: number;
      employeeId: string;
      qualification?: string;
      specialization?: string;
      joiningDate?: string;
      salary?: number;
      createdAt: string;
    } = {
      userId,
      employeeId: employeeId.trim(),
      createdAt: new Date().toISOString(),
    };

    if (qualification) {
      insertData.qualification = typeof qualification === 'string' ? qualification.trim() : qualification;
    }

    if (specialization) {
      insertData.specialization = typeof specialization === 'string' ? specialization.trim() : specialization;
    }

    if (joiningDate) {
      insertData.joiningDate = joiningDate;
    }

    if (salary !== undefined && salary !== null) {
      if (typeof salary !== 'number' || salary < 0) {
        return NextResponse.json(
          { error: 'Salary must be a non-negative number', code: 'INVALID_SALARY' },
          { status: 400 }
        );
      }
      insertData.salary = salary;
    }

    const newTeacher = await db.insert(teachers).values(insertData).returning();

    return NextResponse.json(newTeacher[0], { status: 201 });
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

    // Check if teacher exists
    const existingTeacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, parseInt(id)))
      .limit(1);

    if (existingTeacher.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId, employeeId, qualification, specialization, joiningDate, salary } = body;

    // Validate userId if provided
    if (userId !== undefined) {
      const userExists = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 400 }
        );
      }
    }

    // Validate employeeId uniqueness if provided
    if (employeeId !== undefined) {
      if (typeof employeeId !== 'string') {
        return NextResponse.json(
          { error: 'employeeId must be a string', code: 'INVALID_EMPLOYEE_ID_TYPE' },
          { status: 400 }
        );
      }

      const duplicateCheck = await db
        .select()
        .from(teachers)
        .where(
          and(
            eq(teachers.employeeId, employeeId.trim()),
            eq(teachers.id, parseInt(id))
          )
        )
        .limit(1);

      // If found and it's not the current teacher, it's a duplicate
      if (duplicateCheck.length === 0) {
        const otherTeacher = await db
          .select()
          .from(teachers)
          .where(eq(teachers.employeeId, employeeId.trim()))
          .limit(1);

        if (otherTeacher.length > 0) {
          return NextResponse.json(
            { error: 'Employee ID already exists', code: 'DUPLICATE_EMPLOYEE_ID' },
            { status: 400 }
          );
        }
      }
    }

    // Validate salary if provided
    if (salary !== undefined && salary !== null) {
      if (typeof salary !== 'number' || salary < 0) {
        return NextResponse.json(
          { error: 'Salary must be a non-negative number', code: 'INVALID_SALARY' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      userId?: number;
      employeeId?: string;
      qualification?: string | null;
      specialization?: string | null;
      joiningDate?: string | null;
      salary?: number | null;
    } = {};

    if (userId !== undefined) {
      updateData.userId = userId;
    }

    if (employeeId !== undefined) {
      updateData.employeeId = employeeId.trim();
    }

    if (qualification !== undefined) {
      updateData.qualification = qualification ? qualification.trim() : null;
    }

    if (specialization !== undefined) {
      updateData.specialization = specialization ? specialization.trim() : null;
    }

    if (joiningDate !== undefined) {
      updateData.joiningDate = joiningDate;
    }

    if (salary !== undefined) {
      updateData.salary = salary;
    }

    const updated = await db
      .update(teachers)
      .set(updateData)
      .where(eq(teachers.id, parseInt(id)))
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

    // Check if teacher exists
    const existingTeacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, parseInt(id)))
      .limit(1);

    if (existingTeacher.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found', code: 'TEACHER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(teachers)
      .where(eq(teachers.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Teacher deleted successfully',
        teacher: deleted[0],
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