ALTER TABLE `calendar_events` ADD `end_date` text;--> statement-breakpoint
ALTER TABLE `teacher_remarks` ADD `subject_id` integer REFERENCES subjects(id);--> statement-breakpoint
ALTER TABLE `staff_attendance` DROP COLUMN `timetable_id`;--> statement-breakpoint
ALTER TABLE `staff_attendance` DROP COLUMN `marked_at`;