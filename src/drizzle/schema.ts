import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

// Define the BooksTable schema
export const BooksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }),
  author: varchar('author', { length: 100 }),
  year: integer('year'),  // Nullable if year is optional in the database
});

// Types
export type TIBook = typeof BooksTable.$inferInsert;
export type TSBook = typeof BooksTable.$inferSelect;


export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  clerkId: varchar('clerk_id').notNull(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  email: varchar('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;