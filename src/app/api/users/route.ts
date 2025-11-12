import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const VALID_ROLES = ['admin', 'teacher', 'student', 'parent'];
const BCRYPT_SALT_ROUNDS = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const user = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        }, { status: 404 });
      }

      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = user[0];
      return NextResponse.json(userWithoutPassword, { status: 200 });
    }

    // List users with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const roleFilter = searchParams.get('role');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(users);

    // Build conditions array
    const conditions = [];

    // Search across fullName, email, and role
    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.role, `%${search}%`)
        )
      );
    }

    // Filter by role
    if (roleFilter && VALID_ROLES.includes(roleFilter)) {
      conditions.push(eq(users.role, roleFilter));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Apply sorting
    const sortColumn = users[sort as keyof typeof users] || users.createdAt;
    query = order === 'asc' 
      ? query.orderBy(sortColumn)
      : query.orderBy(desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // Remove passwordHash from all results
    const usersWithoutPasswords = results.map(({ passwordHash, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, fullName, phone, avatarUrl } = body;

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!password || !password.trim()) {
      return NextResponse.json({ 
        error: "Password is required",
        code: "MISSING_PASSWORD" 
      }, { status: 400 });
    }

    if (!role || !role.trim()) {
      return NextResponse.json({ 
        error: "Role is required",
        code: "MISSING_ROLE" 
      }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ 
        error: "Full name is required",
        code: "MISSING_FULL_NAME" 
      }, { status: 400 });
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        error: "Password must be at least 8 characters long",
        code: "PASSWORD_TOO_SHORT" 
      }, { status: 400 });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Prepare user data
    const userData = {
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role.trim(),
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : null,
      avatarUrl: avatarUrl ? avatarUrl.trim() : null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert user
    const newUser = await db.insert(users)
      .values(userData)
      .returning();

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { email, password, role, fullName, phone, avatarUrl, isActive } = body;

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and add email if provided
    if (email !== undefined) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return NextResponse.json({ 
          error: "Email cannot be empty",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT" 
        }, { status: 400 });
      }

      // Check if email is already taken by another user
      const emailCheck = await db.select()
        .from(users)
        .where(eq(users.email, trimmedEmail.toLowerCase()))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== parseInt(id)) {
        return NextResponse.json({ 
          error: "Email already exists",
          code: "EMAIL_EXISTS" 
        }, { status: 400 });
      }

      updates.email = trimmedEmail.toLowerCase();
    }

    // Validate and hash password if provided
    if (password !== undefined) {
      const trimmedPassword = password.trim();
      if (!trimmedPassword) {
        return NextResponse.json({ 
          error: "Password cannot be empty",
          code: "INVALID_PASSWORD" 
        }, { status: 400 });
      }

      if (trimmedPassword.length < 8) {
        return NextResponse.json({ 
          error: "Password must be at least 8 characters long",
          code: "PASSWORD_TOO_SHORT" 
        }, { status: 400 });
      }

      updates.passwordHash = await bcrypt.hash(trimmedPassword, BCRYPT_SALT_ROUNDS);
    }

    // Validate and add role if provided
    if (role !== undefined) {
      const trimmedRole = role.trim();
      if (!VALID_ROLES.includes(trimmedRole)) {
        return NextResponse.json({ 
          error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
          code: "INVALID_ROLE" 
        }, { status: 400 });
      }
      updates.role = trimmedRole;
    }

    // Add other fields if provided
    if (fullName !== undefined) {
      const trimmedFullName = fullName.trim();
      if (!trimmedFullName) {
        return NextResponse.json({ 
          error: "Full name cannot be empty",
          code: "INVALID_FULL_NAME" 
        }, { status: 400 });
      }
      updates.fullName = trimmedFullName;
    }

    if (phone !== undefined) {
      updates.phone = phone ? phone.trim() : null;
    }

    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    }

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    // Update user
    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete user
    const deletedUser = await db.delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = deletedUser[0];

    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: userWithoutPassword 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}