CREATE TABLE `fee_concessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`concession_type` text NOT NULL,
	`concession_percentage` real NOT NULL,
	`amount_waived` real NOT NULL,
	`reason` text NOT NULL,
	`approved_by` integer,
	`approved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
