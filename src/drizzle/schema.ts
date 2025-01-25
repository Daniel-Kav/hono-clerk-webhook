import { pgTable, serial, varchar, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

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


export const UsersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type TIUser = typeof UsersTable.$inferInsert; // Type for inserting a user
export type TSUser = typeof UsersTable.$inferSelect; // Type for selecting a user
