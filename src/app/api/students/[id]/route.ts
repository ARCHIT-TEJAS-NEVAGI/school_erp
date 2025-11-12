import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { students, sections, users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const studentId = parseInt(id);

    // Check if student exists
    const existingStudent = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (existingStudent.length === 0) {
      return NextResponse.json(
        { 
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    let hasUpdates = false;

    // Validate and add studentLevel if provided
    if (body.studentLevel !== undefined) {
      const validLevels = ['L1', 'L2', 'L3'];
      if (!validLevels.includes(body.studentLevel)) {
        return NextResponse.json(
          { 
            error: 'Student level must be L1, L2, or L3',
            code: 'INVALID_STUDENT_LEVEL' 
          },
          { status: 400 }
        );
      }
      updates.studentLevel = body.studentLevel;
      hasUpdates = true;
    }

    // Validate and add totalFees if provided
    if (body.totalFees !== undefined) {
      const totalFees = Number(body.totalFees);
      if (isNaN(totalFees) || totalFees < 0) {
        return NextResponse.json(
          { 
            error: 'Total fees must be a valid non-negative number',
            code: 'INVALID_TOTAL_FEES' 
          },
          { status: 400 }
        );
      }
      updates.totalFees = totalFees;
      hasUpdates = true;
    }

    // Validate and add admissionConcessionFees if provided
    if (body.admissionConcessionFees !== undefined) {
      const admissionConcessionFees = Number(body.admissionConcessionFees);
      if (isNaN(admissionConcessionFees) || admissionConcessionFees < 0) {
        return NextResponse.json(
          { 
            error: 'Admission concession fees must be a valid non-negative number',
            code: 'INVALID_ADMISSION_CONCESSION_FEES' 
          },
          { status: 400 }
        );
      }
      updates.admissionConcessionFees = admissionConcessionFees;
      hasUpdates = true;
    }

    // Validate and add feesConcession if provided
    if (body.feesConcession !== undefined) {
      const feesConcession = Number(body.feesConcession);
      if (isNaN(feesConcession) || feesConcession < 0) {
        return NextResponse.json(
          { 
            error: 'Fees concession must be a valid non-negative number',
            code: 'INVALID_FEES_CONCESSION' 
          },
          { status: 400 }
        );
      }
      updates.feesConcession = feesConcession;
      hasUpdates = true;
    }

    // Validate and add remarksColor if provided
    if (body.remarksColor !== undefined) {
      const validColors = ['green', 'yellow', 'red'];
      if (!validColors.includes(body.remarksColor)) {
        return NextResponse.json(
          { 
            error: 'Remarks color must be green, yellow, or red',
            code: 'INVALID_REMARKS_COLOR' 
          },
          { status: 400 }
        );
      }
      updates.remarksColor = body.remarksColor;
      hasUpdates = true;
    }

    // Validate and add isIrregular if provided
    if (body.isIrregular !== undefined) {
      updates.isIrregular = Boolean(body.isIrregular);
      hasUpdates = true;
    }

    // Validate and add sectionId if provided
    if (body.sectionId !== undefined) {
      if (body.sectionId !== null) {
        const sectionExists = await db
          .select()
          .from(sections)
          .where(eq(sections.id, parseInt(body.sectionId)))
          .limit(1);

        if (sectionExists.length === 0) {
          return NextResponse.json(
            { 
              error: 'Section not found',
              code: 'SECTION_NOT_FOUND' 
            },
            { status: 400 }
          );
        }
      }
      updates.sectionId = body.sectionId === null ? null : parseInt(body.sectionId);
      hasUpdates = true;
    }

    // Validate and add userId if provided
    if (body.userId !== undefined) {
      if (body.userId !== null) {
        const userExists = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(body.userId)))
          .limit(1);

        if (userExists.length === 0) {
          return NextResponse.json(
            { 
              error: 'User not found',
              code: 'USER_NOT_FOUND' 
            },
            { status: 400 }
          );
        }
      }
      updates.userId = body.userId === null ? null : parseInt(body.userId);
      hasUpdates = true;
    }

    // Validate and add admissionNumber if provided (check uniqueness)
    if (body.admissionNumber !== undefined) {
      const duplicateCheck = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.admissionNumber, body.admissionNumber),
            ne(students.id, studentId)
          )
        )
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json(
          { 
            error: 'Admission number already exists',
            code: 'DUPLICATE_ADMISSION_NUMBER' 
          },
          { status: 400 }
        );
      }
      updates.admissionNumber = body.admissionNumber;
      hasUpdates = true;
    }

    // Add basic fields if provided
    if (body.rollNumber !== undefined) {
      updates.rollNumber = body.rollNumber;
      hasUpdates = true;
    }

    if (body.dateOfBirth !== undefined) {
      updates.dateOfBirth = body.dateOfBirth;
      hasUpdates = true;
    }

    if (body.gender !== undefined) {
      updates.gender = body.gender;
      hasUpdates = true;
    }

    if (body.bloodGroup !== undefined) {
      updates.bloodGroup = body.bloodGroup;
      hasUpdates = true;
    }

    if (body.address !== undefined) {
      updates.address = body.address;
      hasUpdates = true;
    }

    if (body.emergencyContact !== undefined) {
      updates.emergencyContact = body.emergencyContact;
      hasUpdates = true;
    }

    if (body.studentMobileNumber !== undefined) {
      updates.studentMobileNumber = body.studentMobileNumber;
      hasUpdates = true;
    }

    if (body.parentName !== undefined) {
      updates.parentName = body.parentName;
      hasUpdates = true;
    }

    if (body.parentMobileNumber !== undefined) {
      updates.parentMobileNumber = body.parentMobileNumber;
      hasUpdates = true;
    }

    // Check if any updates were provided
    if (!hasUpdates) {
      return NextResponse.json(
        { 
          error: 'No fields provided to update',
          code: 'NO_UPDATES' 
        },
        { status: 400 }
      );
    }

    // Update the student record
    const updatedStudent = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, studentId))
      .returning();

    return NextResponse.json(updatedStudent[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}