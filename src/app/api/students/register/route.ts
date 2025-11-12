import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, students, parents, studentParents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Step 1: Validate Required Fields
    const {
      name,
      mobile,
      username,
      password,
      classId,
      sectionId,
      parentName,
      parentMobile,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      totalFees,
      admissionConcessionFees,
    } = body;

    // Validate required fields
    if (!name || !mobile || !username || !password || !classId || !sectionId || !parentName || !parentMobile) {
      return NextResponse.json({
        error: 'Missing required fields: name, mobile, username, password, classId, sectionId, parentName, parentMobile',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    // Validate field types
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        error: 'name must be a non-empty string',
        code: 'INVALID_NAME'
      }, { status: 400 });
    }

    if (typeof mobile !== 'string' || mobile.trim().length === 0) {
      return NextResponse.json({
        error: 'mobile must be a non-empty string',
        code: 'INVALID_MOBILE'
      }, { status: 400 });
    }

    if (typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json({
        error: 'username must be a non-empty string',
        code: 'INVALID_USERNAME'
      }, { status: 400 });
    }

    if (typeof password !== 'string' || password.trim().length < 6) {
      return NextResponse.json({
        error: 'password must be at least 6 characters',
        code: 'INVALID_PASSWORD'
      }, { status: 400 });
    }

    if (typeof parentName !== 'string' || parentName.trim().length === 0) {
      return NextResponse.json({
        error: 'parentName must be a non-empty string',
        code: 'INVALID_PARENT_NAME'
      }, { status: 400 });
    }

    if (typeof parentMobile !== 'string' || parentMobile.trim().length === 0) {
      return NextResponse.json({
        error: 'parentMobile must be a non-empty string',
        code: 'INVALID_PARENT_MOBILE'
      }, { status: 400 });
    }

    // Validate numeric IDs
    if (isNaN(parseInt(String(classId)))) {
      return NextResponse.json({
        error: 'classId must be a valid integer',
        code: 'INVALID_CLASS_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(String(sectionId)))) {
      return NextResponse.json({
        error: 'sectionId must be a valid integer',
        code: 'INVALID_SECTION_ID'
      }, { status: 400 });
    }

    // Validate fee fields if provided
    const parsedTotalFees = totalFees !== undefined ? parseFloat(String(totalFees)) : 0;
    const parsedAdmissionConcessionFees = admissionConcessionFees !== undefined ? parseFloat(String(admissionConcessionFees)) : 0;

    if (isNaN(parsedTotalFees) || parsedTotalFees < 0) {
      return NextResponse.json({
        error: 'totalFees must be a valid non-negative number',
        code: 'INVALID_TOTAL_FEES'
      }, { status: 400 });
    }

    if (isNaN(parsedAdmissionConcessionFees) || parsedAdmissionConcessionFees < 0) {
      return NextResponse.json({
        error: 'admissionConcessionFees must be a valid non-negative number',
        code: 'INVALID_ADMISSION_CONCESSION_FEES'
      }, { status: 400 });
    }

    // Step 2: Auto-generate admission number
    const admissionNumber = `ADM${Date.now()}`;
    const studentEmail = `${admissionNumber.toLowerCase()}@school.com`;

    // Step 3: Check if email already exists
    const existingUserEmail = await db.select()
      .from(users)
      .where(eq(users.email, studentEmail))
      .limit(1);

    if (existingUserEmail.length > 0) {
      return NextResponse.json({
        error: 'Email conflict - please retry',
        code: 'EMAIL_CONFLICT'
      }, { status: 400 });
    }

    // Step 4: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentTimestamp = new Date().toISOString();

    // Step 5: Create student user account
    const studentUser = await db.insert(users).values({
      email: studentEmail,
      passwordHash: hashedPassword,
      role: 'student',
      fullName: name.trim(),
      phone: mobile.trim(),
      isActive: true,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    }).returning();

    if (studentUser.length === 0) {
      return NextResponse.json({
        error: 'Failed to create student user account',
        code: 'USER_CREATION_FAILED'
      }, { status: 500 });
    }

    // Step 6: Create student record with fee information
    const studentData = {
      userId: studentUser[0].id,
      admissionNumber: admissionNumber,
      rollNumber: null,
      sectionId: parseInt(String(sectionId)),
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      bloodGroup: bloodGroup || null,
      address: address || null,
      emergencyContact: mobile.trim(),
      studentMobileNumber: mobile.trim(),
      parentName: parentName.trim(),
      parentMobileNumber: parentMobile.trim(),
      feesConcession: 0,
      isIrregular: false,
      remarksColor: 'green',
      totalFees: parsedTotalFees,
      admissionConcessionFees: parsedAdmissionConcessionFees,
      createdAt: currentTimestamp
    };

    const newStudent = await db.insert(students).values(studentData).returning();

    if (newStudent.length === 0) {
      await db.delete(users).where(eq(users.id, studentUser[0].id));
      return NextResponse.json({
        error: 'Failed to create student record',
        code: 'STUDENT_CREATION_FAILED'
      }, { status: 500 });
    }

    // Step 7: Check if parent exists by mobile number
    const existingParentUsers = await db.select()
      .from(users)
      .where(eq(users.phone, parentMobile.trim()))
      .limit(1);

    let parentUser;
    let isNewParent = false;
    const defaultParentPassword = 'parent123';
    
    if (existingParentUsers.length > 0) {
      parentUser = existingParentUsers[0];
    } else {
      const parentEmail = `${parentMobile.trim()}@school.com`;
      const parentHashedPassword = await bcrypt.hash(defaultParentPassword, 10);
      
      const createdParentUser = await db.insert(users).values({
        email: parentEmail,
        passwordHash: parentHashedPassword,
        role: 'parent',
        fullName: parentName.trim(),
        phone: parentMobile.trim(),
        isActive: true,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      }).returning();

      if (createdParentUser.length === 0) {
        await db.delete(students).where(eq(students.id, newStudent[0].id));
        await db.delete(users).where(eq(users.id, studentUser[0].id));
        return NextResponse.json({
          error: 'Failed to create parent user account',
          code: 'PARENT_USER_CREATION_FAILED'
        }, { status: 500 });
      }
      parentUser = createdParentUser[0];
      isNewParent = true;
    }

    // Step 8: Create or get parent record
    const existingParentRecord = await db.select()
      .from(parents)
      .where(eq(parents.userId, parentUser.id))
      .limit(1);

    let parentRecord;
    if (existingParentRecord.length > 0) {
      parentRecord = existingParentRecord[0];
    } else {
      const parentData = {
        userId: parentUser.id,
        relation: 'Guardian',
        occupation: null,
        createdAt: currentTimestamp
      };

      const newParent = await db.insert(parents).values(parentData).returning();

      if (newParent.length === 0) {
        await db.delete(students).where(eq(students.id, newStudent[0].id));
        await db.delete(users).where(eq(users.id, studentUser[0].id));
        if (isNewParent) {
          await db.delete(users).where(eq(users.id, parentUser.id));
        }
        return NextResponse.json({
          error: 'Failed to create parent record',
          code: 'PARENT_CREATION_FAILED'
        }, { status: 500 });
      }
      parentRecord = newParent[0];
    }

    // Step 9: Link student to parent
    const studentParentLink = await db.insert(studentParents).values({
      studentId: newStudent[0].id,
      parentId: parentRecord.id,
      isPrimary: true,
      createdAt: currentTimestamp
    }).returning();

    if (studentParentLink.length === 0) {
      return NextResponse.json({
        error: 'Failed to link student to parent',
        code: 'STUDENT_PARENT_LINK_FAILED'
      }, { status: 500 });
    }

    // Step 10: Return complete profile with credentials
    const response = {
      success: true,
      message: 'Student registered successfully',
      student: {
        id: newStudent[0].id,
        admissionNumber: newStudent[0].admissionNumber,
        userId: studentUser[0].id,
        fullName: studentUser[0].fullName,
        email: studentUser[0].email,
        phone: studentUser[0].phone,
        sectionId: newStudent[0].sectionId,
        dateOfBirth: newStudent[0].dateOfBirth,
        gender: newStudent[0].gender,
        bloodGroup: newStudent[0].bloodGroup,
        address: newStudent[0].address,
        totalFees: newStudent[0].totalFees,
        admissionConcessionFees: newStudent[0].admissionConcessionFees,
      },
      studentCredentials: {
        email: studentEmail,
        password: password,
        username: username.trim(),
        role: 'student'
      },
      parent: {
        id: parentRecord.id,
        userId: parentUser.id,
        fullName: parentUser.fullName,
        email: parentUser.email,
        phone: parentUser.phone,
        relation: parentRecord.relation,
        isNewParent: isNewParent
      },
      parentCredentials: {
        email: parentUser.email,
        password: isNewParent ? defaultParentPassword : '[Existing parent - use existing password]',
        phone: parentUser.phone,
        role: 'parent'
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('POST /api/students/register error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}