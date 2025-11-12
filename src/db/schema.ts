import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Users table for authentication
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin', 'teacher', 'student', 'parent'
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Academic years table
export const academicYears = sqliteTable('academic_years', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  yearName: text('year_name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrent: integer('is_current', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Classes table
export const classes = sqliteTable('classes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  className: text('class_name').notNull(),
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  createdAt: text('created_at').notNull(),
});

// Teachers table
export const teachers = sqliteTable('teachers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  employeeId: text('employee_id').notNull().unique(),
  qualification: text('qualification'),
  specialization: text('specialization'),
  joiningDate: text('joining_date'),
  salary: real('salary'),
  createdAt: text('created_at').notNull(),
});

// Sections table
export const sections = sqliteTable('sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionName: text('section_name').notNull(),
  classId: integer('class_id').references(() => classes.id),
  classTeacherId: integer('class_teacher_id').references(() => teachers.id),
  createdAt: text('created_at').notNull(),
});

// Students table
export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  admissionNumber: text('admission_number').notNull().unique(),
  rollNumber: text('roll_number'),
  sectionId: integer('section_id').references(() => sections.id),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  bloodGroup: text('blood_group'),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  studentMobileNumber: text('student_mobile_number'),
  parentName: text('parent_name'),
  parentMobileNumber: text('parent_mobile_number'),
  feesConcession: real('fees_concession').default(0),
  isIrregular: integer('is_irregular', { mode: 'boolean' }).default(false),
  remarksColor: text('remarks_color').default('green'),
  studentLevel: text('student_level').default('L1'),
  totalFees: real('total_fees').default(0),
  admissionConcessionFees: real('admission_concession_fees').default(0),
  createdAt: text('created_at').notNull(),
});

// Parents table
export const parents = sqliteTable('parents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  relation: text('relation'),
  occupation: text('occupation'),
  createdAt: text('created_at').notNull(),
});

// Student-Parents junction table
export const studentParents = sqliteTable('student_parents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  parentId: integer('parent_id').references(() => parents.id),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Subjects table
export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectName: text('subject_name').notNull(),
  subjectCode: text('subject_code').notNull().unique(),
  classId: integer('class_id').references(() => classes.id),
  teacherId: integer('teacher_id').references(() => teachers.id),
  createdAt: text('created_at').notNull(),
});

// Timetables table
export const timetables = sqliteTable('timetables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionId: integer('section_id').references(() => sections.id),
  subjectId: integer('subject_id').references(() => subjects.id),
  dayOfWeek: text('day_of_week').notNull(), // 'Monday', 'Tuesday', etc.
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  roomNumber: text('room_number'),
  createdAt: text('created_at').notNull(),
});

// Attendance table
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  date: text('date').notNull(),
  status: text('status').notNull(), // 'present', 'absent', 'late', 'half_day'
  markedBy: integer('marked_by').references(() => users.id),
  markedAt: text('marked_at').notNull(),
  notes: text('notes'),
  biometricDeviceId: text('biometric_device_id'),
  createdAt: text('created_at').notNull(),
});

// Marks table
export const marks = sqliteTable('marks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  subjectId: integer('subject_id').references(() => subjects.id),
  examType: text('exam_type').notNull(),
  marksObtained: real('marks_obtained').notNull(),
  totalMarks: real('total_marks').notNull(),
  examDate: text('exam_date').notNull(),
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
});

// Fee templates table
export const feeTemplates = sqliteTable('fee_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateName: text('template_name').notNull(),
  classId: integer('class_id').references(() => classes.id),
  amount: real('amount').notNull(),
  feeType: text('fee_type').notNull(),
  frequency: text('frequency').notNull(), // 'monthly', 'quarterly', 'annually', 'one_time'
  createdAt: text('created_at').notNull(),
});

// Fee invoices table
export const feeInvoices = sqliteTable('fee_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').default(0),
  dueAmount: real('due_amount').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull(),
  academicYearId: integer('academic_year_id').references(() => academicYears.id),
  concessionAmount: real('concession_amount').default(0),
  finalAmount: real('final_amount').notNull(),
  createdAt: text('created_at').notNull(),
});

// Fee payments table
export const feePayments = sqliteTable('fee_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => feeInvoices.id),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'cash', 'card', 'online', 'cheque'
  paymentDate: text('payment_date').notNull(),
  transactionId: text('transaction_id'),
  stripePaymentId: text('stripe_payment_id'),
  paymentStatus: text('payment_status').notNull(), // 'pending', 'completed', 'failed', 'refunded'
  createdAt: text('created_at').notNull(),
});

// Documents table
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  relatedToType: text('related_to_type').notNull(), // 'student', 'teacher', 'parent', 'general'
  relatedToId: integer('related_to_id'),
  documentName: text('document_name').notNull(),
  documentType: text('document_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  uploadedAt: text('uploaded_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipientId: integer('recipient_id').references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'attendance', 'fee', 'academic', 'general'
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  sentViaWhatsapp: integer('sent_via_whatsapp', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Analytics logs table
export const analyticsLogs = sqliteTable('analytics_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  logType: text('log_type').notNull(),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: integer('related_entity_id'),
  aiInsights: text('ai_insights', { mode: 'json' }),
  severity: text('severity').notNull(), // 'info', 'warning', 'critical'
  createdAt: text('created_at').notNull(),
});

// Add new payment_installments table at the end
export const paymentInstallments = sqliteTable('payment_installments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => feeInvoices.id).notNull(),
  installmentNumber: integer('installment_number').notNull(),
  amount: real('amount').notNull(),
  dueDate: text('due_date').notNull(),
  paidAmount: real('paid_amount').default(0).notNull(),
  status: text('status').notNull(), // 'pending', 'paid', 'overdue'
  paymentId: integer('payment_id').references(() => feePayments.id),
  createdAt: text('created_at').notNull(),
});

// Add new staff_attendance table
export const staffAttendance = sqliteTable('staff_attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  date: text('date').notNull(),
  status: text('status').notNull(), // 'present', 'absent', 'late', 'half_day'
  markedBy: integer('marked_by').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Add new teacher_remarks table
export const teacherRemarks = sqliteTable('teacher_remarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  remarkText: text('remark_text').notNull(),
  remarkType: text('remark_type').notNull(),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull(),
  subjectId: integer('subject_id').references(() => subjects.id),
});

// Add new teacher_leave_requests table
export const teacherLeaveRequests = sqliteTable('teacher_leave_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'),
  requestedAt: text('requested_at').notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: text('reviewed_at'),
});

// Add new calendar_events table
export const calendarEvents = sqliteTable('calendar_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  eventType: text('event_type').notNull(),
  eventDate: text('event_date').notNull(),
  endDate: text('end_date'),
  isHoliday: integer('is_holiday', { mode: 'boolean' }).default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Add new whatsapp_messages table
export const whatsappMessages = sqliteTable('whatsapp_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipientType: text('recipient_type').notNull(),
  recipientId: integer('recipient_id'),
  classId: integer('class_id').references(() => classes.id),
  sectionId: integer('section_id').references(() => sections.id),
  messageText: text('message_text').notNull(),
  sentBy: integer('sent_by').references(() => users.id).notNull(),
  sentAt: text('sent_at').notNull(),
  status: text('status').notNull().default('pending'),
  phoneNumber: text('phone_number'),
});

// Add new fee_concessions table
export const feeConcessions = sqliteTable('fee_concessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id).notNull(),
  concessionType: text('concession_type').notNull(),
  concessionPercentage: real('concession_percentage').notNull(),
  amountWaived: real('amount_waived').notNull(),
  reason: text('reason').notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: text('approved_at'),
  createdAt: text('created_at').notNull(),
});

// Add new settings table at the end
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});