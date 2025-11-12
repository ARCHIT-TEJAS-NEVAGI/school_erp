CREATE TABLE `payment_installments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`installment_number` integer NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`payment_id` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `fee_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `fee_payments`(`id`) ON UPDATE no action ON DELETE no action
);
