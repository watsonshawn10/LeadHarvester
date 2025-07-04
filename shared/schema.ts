import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // 'homeowner' | 'service_provider' | 'admin'
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  profileImage: text("profile_image"),
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  services: text("services").array(),
  licenseNumber: text("license_number"),
  insuranceInfo: text("insurance_info"),
  isVerified: boolean("is_verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  autoLeadPurchase: boolean("auto_lead_purchase").default(false),
  maxLeadBudget: decimal("max_lead_budget", { precision: 10, scale: 2 }),
  preferredCategories: text("preferred_categories").array(),
  serviceRadius: integer("service_radius").default(25), // miles
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  leadCredits: decimal("lead_credits", { precision: 10, scale: 2 }).default("0.00"),
  dailyBudgetLimit: decimal("daily_budget_limit", { precision: 10, scale: 2 }),
  weeklyBudgetLimit: decimal("weekly_budget_limit", { precision: 10, scale: 2 }),
  dailySpentAmount: decimal("daily_spent_amount", { precision: 10, scale: 2 }).default("0.00"),
  weeklySpentAmount: decimal("weekly_spent_amount", { precision: 10, scale: 2 }).default("0.00"),
  lastDailyReset: timestamp("last_daily_reset"),
  lastWeeklyReset: timestamp("last_weekly_reset"),
  canReceiveFreeLeads: boolean("can_receive_free_leads").default(false),
  freeLeadsRemaining: integer("free_leads_remaining").default(0),
  
  // Login/Logout Preferences
  loginRedirectPreference: text("login_redirect_preference").default("dashboard"), // 'dashboard' | 'home' | 'marketplace' | 'last-page'
  logoutRedirectPreference: text("logout_redirect_preference").default("home"), // 'home' | 'login'
  rememberMeDefault: boolean("remember_me_default").default(true),
  sessionTimeout: integer("session_timeout").default(24), // hours
  autoLogoutEnabled: boolean("auto_logout_enabled").default(false),
  autoLogoutMinutes: integer("auto_logout_minutes").default(30),
  showLogoutConfirmation: boolean("show_logout_confirmation").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  homeownerId: integer("homeowner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  budget: text("budget"), // e.g., "$5,000-$8,000"
  urgency: text("urgency"), // 'asap' | 'within_week' | 'within_month' | 'flexible'
  zipCode: text("zip_code").notNull(),
  status: text("status").default("active"), // 'active' | 'in_progress' | 'completed' | 'cancelled'
  images: text("images").array(),
  requirements: jsonb("requirements"), // Additional project-specific requirements
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => users.id),
  status: text("status").default("new"), // 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'refunded'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  contactedAt: timestamp("contacted_at"),
  quotedAt: timestamp("quoted_at"),
  quoteAmount: decimal("quote_amount", { precision: 10, scale: 2 }),
  wonAt: timestamp("won_at"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  notes: text("notes"),
  isAutoPurchased: boolean("is_auto_purchased").default(false),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeRefundId: text("stripe_refund_id"),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"), // 'customer_no_response' | 'lead_quality' | 'duplicate' | 'other'
  customerResponseDeadline: timestamp("customer_response_deadline"),
  isEligibleForRefund: boolean("is_eligible_for_refund").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  timeline: text("timeline"),
  validUntil: timestamp("valid_until"),
  status: text("status").default("pending"), // 'pending' | 'accepted' | 'rejected' | 'expired'
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  homeownerId: integer("homeowner_id").notNull().references(() => users.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, image, file, system
  attachments: jsonb("attachments"), // Array of file URLs/metadata
  isRead: boolean("is_read").default(false),
  editedAt: timestamp("edited_at"),
  replyToId: integer("reply_to_id"), // For threading
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  homeownerId: integer("homeowner_id").notNull().references(() => users.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  homeownerId: integer("homeowner_id").notNull().references(() => users.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(60), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  location: text("location"),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  serviceProviderId: integer("service_provider_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  leads: many(leads),
  quotes: many(quotes),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  givenReviews: many(reviews, { relationName: "givenReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
  favoriteProviders: many(favorites, { relationName: "favoriteProviders" }),
  favoriteHomeowners: many(favorites, { relationName: "favoriteHomeowners" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  homeowner: one(users, {
    fields: [projects.homeownerId],
    references: [users.id],
  }),
  leads: many(leads),
  quotes: many(quotes),
  reviews: many(reviews),
  messages: many(messages),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  project: one(projects, {
    fields: [leads.projectId],
    references: [projects.id],
  }),
  serviceProvider: one(users, {
    fields: [leads.serviceProviderId],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  project: one(projects, {
    fields: [quotes.projectId],
    references: [projects.id],
  }),
  serviceProvider: one(users, {
    fields: [quotes.serviceProviderId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, {
    fields: [reviews.projectId],
    references: [projects.id],
  }),
  homeowner: one(users, {
    fields: [reviews.homeownerId],
    references: [users.id],
    relationName: "givenReviews",
  }),
  serviceProvider: one(users, {
    fields: [reviews.serviceProviderId],
    references: [users.id],
    relationName: "receivedReviews",
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
    relationName: "replyTo",
  }),
  replies: many(messages, { relationName: "replyTo" }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  homeowner: one(users, {
    fields: [favorites.homeownerId],
    references: [users.id],
    relationName: "favoriteProviders",
  }),
  serviceProvider: one(users, {
    fields: [favorites.serviceProviderId],
    references: [users.id],
    relationName: "favoriteHomeowners",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
