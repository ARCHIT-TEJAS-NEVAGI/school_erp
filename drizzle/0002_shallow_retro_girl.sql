CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_date` text NOT NULL,
	`event_type` text NOT NULL,
	`is_holiday` integer DEFAULT false,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`timetable_id` integer,
	`marked_by` integer,
	`marked_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`timetable_id`) REFERENCES `timetables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teacher_leave_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text NOT NULL,
	`reviewed_by` integer,
	`reviewed_at` text,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teacher_remarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`remark_text` text NOT NULL,
	`remark_type` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient_type` text NOT NULL,
	`recipient_id` integer,
	`class_id` integer,
	`section_id` integer,
	`message_text` text NOT NULL,
	`sent_by` integer NOT NULL,
	`sent_at` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`phone_number` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `fee_invoices` ADD `concession_amount` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fee_invoices` ADD `final_amount` real NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `username` text;--> statement-breakpoint
ALTER TABLE `students` ADD `password` text;--> statement-breakpoint
ALTER TABLE `students` ADD `student_mobile_number` text;--> statement-breakpoint
ALTER TABLE `students` ADD `parent_name` text;--> statement-breakpoint
ALTER TABLE `students` ADD `parent_mobile_number` text;--> statement-breakpoint
ALTER TABLE `students` ADD `fees_concession` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `students` ADD `is_irregular` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `students` ADD `remarks_color` text DEFAULT 'green';--> statement-breakpoint
CREATE UNIQUE INDEX `students_username_unique` ON `students` (`username`);