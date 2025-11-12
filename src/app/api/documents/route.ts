import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single document by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const document = await db.select()
        .from(documents)
        .where(eq(documents.id, parseInt(id)))
        .limit(1);

      if (document.length === 0) {
        return NextResponse.json({ 
          error: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(document[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const uploadedBy = searchParams.get('uploadedBy');
    const relatedToType = searchParams.get('relatedToType');
    const relatedToId = searchParams.get('relatedToId');

    let query = db.select().from(documents);

    // Build filter conditions
    const conditions = [];

    if (uploadedBy) {
      if (isNaN(parseInt(uploadedBy))) {
        return NextResponse.json({ 
          error: "Valid uploadedBy ID is required",
          code: "INVALID_UPLOADED_BY" 
        }, { status: 400 });
      }
      conditions.push(eq(documents.uploadedBy, parseInt(uploadedBy)));
    }

    if (relatedToType) {
      const validTypes = ['student', 'teacher', 'parent', 'general'];
      if (!validTypes.includes(relatedToType)) {
        return NextResponse.json({ 
          error: "Invalid relatedToType. Must be one of: student, teacher, parent, general",
          code: "INVALID_RELATED_TO_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(documents.relatedToType, relatedToType));
    }

    if (relatedToId) {
      if (isNaN(parseInt(relatedToId))) {
        return NextResponse.json({ 
          error: "Valid relatedToId is required",
          code: "INVALID_RELATED_TO_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(documents.relatedToId, parseInt(relatedToId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(documents.uploadedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

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
    const { uploadedBy, relatedToType, relatedToId, documentName, documentType, fileUrl, fileSize } = body;

    // Validate required fields
    if (!uploadedBy) {
      return NextResponse.json({ 
        error: "uploadedBy is required",
        code: "MISSING_UPLOADED_BY" 
      }, { status: 400 });
    }

    if (!relatedToType) {
      return NextResponse.json({ 
        error: "relatedToType is required",
        code: "MISSING_RELATED_TO_TYPE" 
      }, { status: 400 });
    }

    if (!documentName || documentName.trim() === '') {
      return NextResponse.json({ 
        error: "documentName is required",
        code: "MISSING_DOCUMENT_NAME" 
      }, { status: 400 });
    }

    if (!documentType || documentType.trim() === '') {
      return NextResponse.json({ 
        error: "documentType is required",
        code: "MISSING_DOCUMENT_TYPE" 
      }, { status: 400 });
    }

    if (!fileUrl || fileUrl.trim() === '') {
      return NextResponse.json({ 
        error: "fileUrl is required",
        code: "MISSING_FILE_URL" 
      }, { status: 400 });
    }

    // Validate uploadedBy exists in users table
    if (isNaN(parseInt(uploadedBy))) {
      return NextResponse.json({ 
        error: "Valid uploadedBy ID is required",
        code: "INVALID_UPLOADED_BY" 
      }, { status: 400 });
    }

    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(uploadedBy)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "User with uploadedBy ID does not exist",
        code: "USER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate relatedToType
    const validTypes = ['student', 'teacher', 'parent', 'general'];
    if (!validTypes.includes(relatedToType)) {
      return NextResponse.json({ 
        error: "Invalid relatedToType. Must be one of: student, teacher, parent, general",
        code: "INVALID_RELATED_TO_TYPE" 
      }, { status: 400 });
    }

    // Validate relatedToId if provided
    if (relatedToId !== undefined && relatedToId !== null) {
      if (isNaN(parseInt(relatedToId))) {
        return NextResponse.json({ 
          error: "Valid relatedToId is required",
          code: "INVALID_RELATED_TO_ID" 
        }, { status: 400 });
      }
    }

    // Validate fileSize if provided
    if (fileSize !== undefined && fileSize !== null) {
      if (isNaN(parseInt(fileSize)) || parseInt(fileSize) < 0) {
        return NextResponse.json({ 
          error: "Valid fileSize is required",
          code: "INVALID_FILE_SIZE" 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const insertData: any = {
      uploadedBy: parseInt(uploadedBy),
      relatedToType: relatedToType.trim(),
      documentName: documentName.trim(),
      documentType: documentType.trim(),
      fileUrl: fileUrl.trim(),
      uploadedAt: new Date().toISOString(),
    };

    if (relatedToId !== undefined && relatedToId !== null) {
      insertData.relatedToId = parseInt(relatedToId);
    }

    if (fileSize !== undefined && fileSize !== null) {
      insertData.fileSize = parseInt(fileSize);
    }

    // Insert document
    const newDocument = await db.insert(documents)
      .values(insertData)
      .returning();

    return NextResponse.json(newDocument[0], { status: 201 });

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

    // Check if document exists
    const existingDocument = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (existingDocument.length === 0) {
      return NextResponse.json({ 
        error: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { uploadedBy, relatedToType, relatedToId, documentName, documentType, fileUrl, fileSize } = body;

    // Prepare update data
    const updateData: any = {};

    // Validate and add uploadedBy if provided
    if (uploadedBy !== undefined) {
      if (isNaN(parseInt(uploadedBy))) {
        return NextResponse.json({ 
          error: "Valid uploadedBy ID is required",
          code: "INVALID_UPLOADED_BY" 
        }, { status: 400 });
      }

      const userExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(uploadedBy)))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json({ 
          error: "User with uploadedBy ID does not exist",
          code: "USER_NOT_FOUND" 
        }, { status: 400 });
      }

      updateData.uploadedBy = parseInt(uploadedBy);
    }

    // Validate and add relatedToType if provided
    if (relatedToType !== undefined) {
      const validTypes = ['student', 'teacher', 'parent', 'general'];
      if (!validTypes.includes(relatedToType)) {
        return NextResponse.json({ 
          error: "Invalid relatedToType. Must be one of: student, teacher, parent, general",
          code: "INVALID_RELATED_TO_TYPE" 
        }, { status: 400 });
      }
      updateData.relatedToType = relatedToType.trim();
    }

    // Validate and add relatedToId if provided
    if (relatedToId !== undefined) {
      if (relatedToId !== null) {
        if (isNaN(parseInt(relatedToId))) {
          return NextResponse.json({ 
            error: "Valid relatedToId is required",
            code: "INVALID_RELATED_TO_ID" 
          }, { status: 400 });
        }
        updateData.relatedToId = parseInt(relatedToId);
      } else {
        updateData.relatedToId = null;
      }
    }

    // Add documentName if provided
    if (documentName !== undefined) {
      if (!documentName || documentName.trim() === '') {
        return NextResponse.json({ 
          error: "documentName cannot be empty",
          code: "INVALID_DOCUMENT_NAME" 
        }, { status: 400 });
      }
      updateData.documentName = documentName.trim();
    }

    // Add documentType if provided
    if (documentType !== undefined) {
      if (!documentType || documentType.trim() === '') {
        return NextResponse.json({ 
          error: "documentType cannot be empty",
          code: "INVALID_DOCUMENT_TYPE" 
        }, { status: 400 });
      }
      updateData.documentType = documentType.trim();
    }

    // Add fileUrl if provided
    if (fileUrl !== undefined) {
      if (!fileUrl || fileUrl.trim() === '') {
        return NextResponse.json({ 
          error: "fileUrl cannot be empty",
          code: "INVALID_FILE_URL" 
        }, { status: 400 });
      }
      updateData.fileUrl = fileUrl.trim();
    }

    // Validate and add fileSize if provided
    if (fileSize !== undefined) {
      if (fileSize !== null) {
        if (isNaN(parseInt(fileSize)) || parseInt(fileSize) < 0) {
          return NextResponse.json({ 
            error: "Valid fileSize is required",
            code: "INVALID_FILE_SIZE" 
          }, { status: 400 });
        }
        updateData.fileSize = parseInt(fileSize);
      } else {
        updateData.fileSize = null;
      }
    }

    // Update document
    const updatedDocument = await db.update(documents)
      .set(updateData)
      .where(eq(documents.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedDocument[0], { status: 200 });

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

    // Check if document exists
    const existingDocument = await db.select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);

    if (existingDocument.length === 0) {
      return NextResponse.json({ 
        error: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete document
    const deletedDocument = await db.delete(documents)
      .where(eq(documents.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Document deleted successfully',
      document: deletedDocument[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}