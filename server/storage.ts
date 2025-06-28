import { 
  users, 
  projects, 
  leads, 
  quotes, 
  reviews, 
  messages, 
  favorites,
  appointments,
  availability,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Lead,
  type InsertLead,
  type Quote,
  type InsertQuote,
  type Review,
  type InsertReview,
  type Message,
  type InsertMessage,
  type Favorite,
  type InsertFavorite,
  type Appointment,
  type InsertAppointment,
  type Availability,
  type InsertAvailability
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, lt, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getEligibleContractors(category: string, zipCode: string, budget: string): Promise<User[]>;
  checkAndResetBudgets(contractor: User): Promise<User>;
  canAffordLead(contractor: User, leadPrice: number): Promise<boolean>;
  updateSpentAmount(contractorId: number, amount: number): Promise<void>;
  
  // Admin methods for free leads
  grantFreeLeads(contractorId: number, count: number): Promise<User>;
  useFreeLeadCredit(contractorId: number): Promise<User>;
  getAllContractors(): Promise<User[]>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByHomeowner(homeownerId: number): Promise<Project[]>;
  getActiveProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  
  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByServiceProvider(serviceProviderId: number): Promise<Lead[]>;
  getLeadsByProject(projectId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead>;
  
  // Refund methods
  processLeadRefund(leadId: number, reason: string, refundPercentage?: number): Promise<Lead>;
  getLeadsEligibleForRefund(): Promise<Lead[]>;
  checkCustomerResponseStatus(projectId: number): Promise<boolean>;
  
  // Quote methods
  getQuote(id: number): Promise<Quote | undefined>;
  getQuotesByProject(projectId: number): Promise<Quote[]>;
  getQuotesByServiceProvider(serviceProviderId: number): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, updates: Partial<InsertQuote>): Promise<Quote>;
  
  // Review methods
  getReviewsByServiceProvider(serviceProviderId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Message methods
  getMessagesByProject(projectId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Favorite methods
  getFavoritesByHomeowner(homeownerId: number): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(homeownerId: number, serviceProviderId: number): Promise<void>;
  
  // Analytics methods
  getServiceProviderStats(serviceProviderId: number): Promise<{
    totalLeads: number;
    totalRevenue: number;
    conversionRate: number;
    avgLeadValue: number;
  }>;

  // Scheduling methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByUser(userId: number): Promise<Appointment[]>;
  getAppointmentsByProject(projectId: number): Promise<Appointment[]>;
  updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment>;
  cancelAppointment(id: number): Promise<Appointment>;
  
  // Availability methods
  setAvailability(availability: InsertAvailability): Promise<Availability>;
  getAvailability(serviceProviderId: number): Promise<Availability[]>;
  getAvailableSlots(serviceProviderId: number, date: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByHomeowner(homeownerId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.homeownerId, homeownerId))
      .orderBy(desc(projects.createdAt));
  }

  async getActiveProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.status, "active"))
      .orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByServiceProvider(serviceProviderId: number): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.serviceProviderId, serviceProviderId))
      .orderBy(desc(leads.createdAt));
  }

  async getLeadsByProject(projectId: number): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.projectId, projectId))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuotesByProject(projectId: number): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.projectId, projectId))
      .orderBy(desc(quotes.createdAt));
  }

  async getQuotesByServiceProvider(serviceProviderId: number): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.serviceProviderId, serviceProviderId))
      .orderBy(desc(quotes.createdAt));
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db
      .insert(quotes)
      .values(insertQuote)
      .returning();
    return quote;
  }

  async updateQuote(id: number, updates: Partial<InsertQuote>): Promise<Quote> {
    const [quote] = await db
      .update(quotes)
      .set(updates)
      .where(eq(quotes.id, id))
      .returning();
    return quote;
  }

  async getReviewsByServiceProvider(serviceProviderId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceProviderId, serviceProviderId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async getMessagesByProject(projectId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getFavoritesByHomeowner(homeownerId: number): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.homeownerId, homeownerId));
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values(insertFavorite)
      .returning();
    return favorite;
  }

  async removeFavorite(homeownerId: number, serviceProviderId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.homeownerId, homeownerId),
          eq(favorites.serviceProviderId, serviceProviderId)
        )
      );
  }

  async getServiceProviderStats(serviceProviderId: number): Promise<{
    totalLeads: number;
    totalRevenue: number;
    conversionRate: number;
    avgLeadValue: number;
  }> {
    const [stats] = await db
      .select({
        totalLeads: count(leads.id),
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${leads.revenue} IS NOT NULL THEN ${leads.revenue} ELSE 0 END), 0)`,
        wonLeads: sql<number>`COUNT(CASE WHEN ${leads.status} = 'won' THEN 1 END)`,
        totalLeadCost: sql<number>`COALESCE(SUM(${leads.price}), 0)`,
      })
      .from(leads)
      .where(eq(leads.serviceProviderId, serviceProviderId));

    const conversionRate = stats.totalLeads > 0 ? (stats.wonLeads / stats.totalLeads) * 100 : 0;
    const avgLeadValue = stats.totalLeads > 0 ? stats.totalLeadCost / stats.totalLeads : 0;

    return {
      totalLeads: stats.totalLeads,
      totalRevenue: Number(stats.totalRevenue),
      conversionRate: Number(conversionRate.toFixed(2)),
      avgLeadValue: Number(avgLeadValue.toFixed(2)),
    };
  }

  async getEligibleContractors(category: string, zipCode: string, budget: string): Promise<User[]> {
    const contractors = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.userType, 'service_provider'),
          eq(users.autoLeadPurchase, true),
          sql`${users.preferredCategories} @> ARRAY[${category}]`
        )
      );

    // Filter by service radius and budget preferences
    return contractors.filter(contractor => {
      // Simple zip code radius check (in production, use proper geolocation)
      const contractorZip = contractor.zipCode;
      if (contractorZip && Math.abs(parseInt(contractorZip) - parseInt(zipCode)) > 1000) {
        return false;
      }

      // Check budget preferences
      if (contractor.maxLeadBudget) {
        const maxBudget = parseFloat(contractor.maxLeadBudget);
        const projectBudgetValue = this.getBudgetValue(budget);
        if (projectBudgetValue > maxBudget) {
          return false;
        }
      }

      return true;
    });
  }

  private getBudgetValue(budget: string): number {
    // Convert budget string to numeric value for comparison
    if (budget?.includes('over-25000')) return 30000;
    if (budget?.includes('10000-25000')) return 17500;
    if (budget?.includes('5000-10000')) return 7500;
    if (budget?.includes('1000-5000')) return 3000;
    if (budget?.includes('under-1000')) return 500;
    return 5000; // default
  }

  async checkAndResetBudgets(contractor: User): Promise<User> {
    const now = new Date();
    const updates: Partial<InsertUser> = {};
    let needsUpdate = false;

    // Check daily budget reset
    if (contractor.lastDailyReset) {
      const lastReset = new Date(contractor.lastDailyReset);
      const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 1) {
        updates.dailySpentAmount = "0.00";
        updates.lastDailyReset = now;
        needsUpdate = true;
      }
    } else {
      updates.dailySpentAmount = "0.00";
      updates.lastDailyReset = now;
      needsUpdate = true;
    }

    // Check weekly budget reset (assuming week starts on Sunday)
    if (contractor.lastWeeklyReset) {
      const lastReset = new Date(contractor.lastWeeklyReset);
      const weeksDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24 * 7));
      
      if (weeksDiff >= 1) {
        updates.weeklySpentAmount = "0.00";
        updates.lastWeeklyReset = now;
        needsUpdate = true;
      }
    } else {
      updates.weeklySpentAmount = "0.00";
      updates.lastWeeklyReset = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      return await this.updateUser(contractor.id, updates);
    }

    return contractor;
  }

  async canAffordLead(contractor: User, leadPrice: number): Promise<boolean> {
    // Reset budgets if needed
    const updatedContractor = await this.checkAndResetBudgets(contractor);
    
    const dailySpent = parseFloat(updatedContractor.dailySpentAmount || '0');
    const weeklySpent = parseFloat(updatedContractor.weeklySpentAmount || '0');
    
    // Check daily budget limit
    if (updatedContractor.dailyBudgetLimit) {
      const dailyLimit = parseFloat(updatedContractor.dailyBudgetLimit);
      if (dailySpent + leadPrice > dailyLimit) {
        return false;
      }
    }

    // Check weekly budget limit
    if (updatedContractor.weeklyBudgetLimit) {
      const weeklyLimit = parseFloat(updatedContractor.weeklyBudgetLimit);
      if (weeklySpent + leadPrice > weeklyLimit) {
        return false;
      }
    }

    return true;
  }

  async updateSpentAmount(contractorId: number, amount: number): Promise<void> {
    const contractor = await this.getUser(contractorId);
    if (!contractor) return;

    const dailySpent = parseFloat(contractor.dailySpentAmount || '0');
    const weeklySpent = parseFloat(contractor.weeklySpentAmount || '0');

    await this.updateUser(contractorId, {
      dailySpentAmount: (dailySpent + amount).toString(),
      weeklySpentAmount: (weeklySpent + amount).toString(),
    });
  }

  // Admin methods for free leads management
  async grantFreeLeads(contractorId: number, count: number): Promise<User> {
    const contractor = await this.getUser(contractorId);
    if (!contractor) throw new Error('Contractor not found');
    
    const newFreeLeadsCount = (contractor.freeLeadsRemaining || 0) + count;
    
    return await this.updateUser(contractorId, {
      freeLeadsRemaining: newFreeLeadsCount,
      canReceiveFreeLeads: true,
    });
  }

  async useFreeLeadCredit(contractorId: number): Promise<User> {
    const contractor = await this.getUser(contractorId);
    if (!contractor) throw new Error('Contractor not found');
    
    const remainingFreeLeads = Math.max(0, (contractor.freeLeadsRemaining || 0) - 1);
    
    return await this.updateUser(contractorId, {
      freeLeadsRemaining: remainingFreeLeads,
      canReceiveFreeLeads: remainingFreeLeads > 0,
    });
  }

  async getAllContractors(): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.userType, 'service_provider'));
  }

  // Scheduling methods implementation
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(
        sql`${appointments.homeownerId} = ${userId} OR ${appointments.serviceProviderId} = ${userId}`
      )
      .orderBy(desc(appointments.scheduledAt));
  }

  async getAppointmentsByProject(projectId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.projectId, projectId))
      .orderBy(desc(appointments.scheduledAt));
  }

  async updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async cancelAppointment(id: number): Promise<Appointment> {
    return this.updateAppointment(id, { status: 'cancelled' });
  }

  // Availability methods implementation
  async setAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    // First, check if availability exists for this day
    const existing = await db.select()
      .from(availability)
      .where(
        and(
          eq(availability.serviceProviderId, insertAvailability.serviceProviderId),
          eq(availability.dayOfWeek, insertAvailability.dayOfWeek)
        )
      );

    if (existing.length > 0) {
      // Update existing availability
      const [updated] = await db
        .update(availability)
        .set(insertAvailability)
        .where(eq(availability.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new availability
      const [created] = await db
        .insert(availability)
        .values(insertAvailability)
        .returning();
      return created;
    }
  }

  async getAvailability(serviceProviderId: number): Promise<Availability[]> {
    return await db.select()
      .from(availability)
      .where(eq(availability.serviceProviderId, serviceProviderId))
      .orderBy(availability.dayOfWeek);
  }

  async getAvailableSlots(serviceProviderId: number, date: string): Promise<string[]> {
    const dayOfWeek = new Date(date).getDay();
    
    // Get availability for this day
    const dayAvailability = await db.select()
      .from(availability)
      .where(
        and(
          eq(availability.serviceProviderId, serviceProviderId),
          eq(availability.dayOfWeek, dayOfWeek),
          eq(availability.isAvailable, true)
        )
      );

    if (dayAvailability.length === 0) {
      return [];
    }

    // Get existing appointments for this date
    const existingAppointments = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.serviceProviderId, serviceProviderId),
          sql`DATE(${appointments.scheduledAt}) = ${date}`,
          sql`${appointments.status} != 'cancelled'`
        )
      );

    const slots: string[] = [];
    const startTime = dayAvailability[0].startTime;
    const endTime = dayAvailability[0].endTime;
    
    // Generate 1-hour slots between start and end time
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    
    while (start < end) {
      const slotTime = start.toTimeString().slice(0, 5);
      const slotEnd = new Date(start.getTime() + 60 * 60 * 1000);
      
      // Check if this slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration || 60) * 60 * 1000);
        return start < aptEnd && slotEnd > aptStart;
      });
      
      if (!hasConflict) {
        slots.push(slotTime);
      }
      
      start.setHours(start.getHours() + 1);
    }
    
    return slots;
  }

  // Refund methods implementation
  async processLeadRefund(leadId: number, reason: string, refundPercentage: number = 40): Promise<Lead> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    if (!lead.isEligibleForRefund) {
      throw new Error('Lead is not eligible for refund');
    }

    if (lead.status === 'refunded') {
      throw new Error('Lead has already been refunded');
    }

    // Calculate refund amount based on percentage
    const originalAmount = parseFloat(lead.price);
    const refundAmount = originalAmount * (refundPercentage / 100);

    // Process Stripe refund if payment was made via Stripe
    let stripeRefundId = null;
    if (lead.stripePaymentIntentId) {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        const refund = await stripe.refunds.create({
          payment_intent: lead.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100), // Convert to cents and apply percentage
          reason: 'requested_by_customer',
          metadata: {
            leadId: leadId.toString(),
            refundReason: reason,
            refundPercentage: refundPercentage.toString(),
            originalAmount: originalAmount.toString(),
            refundAmount: refundAmount.toString(),
          }
        });
        
        stripeRefundId = refund.id;
      } catch (error) {
        console.error('Stripe refund failed:', error);
        // Continue with credit refund if Stripe fails
      }
    }

    // Refund to contractor's credit balance (percentage amount)
    const contractor = await this.getUser(lead.serviceProviderId);
    if (contractor) {
      const currentCredits = parseFloat(contractor.leadCredits || '0');
      
      await this.updateUser(contractor.id, {
        leadCredits: (currentCredits + refundAmount).toString()
      });
    }

    // Update lead status
    const [updatedLead] = await db
      .update(leads)
      .set({
        status: 'refunded',
        refundedAt: new Date(),
        refundReason: reason,
        stripeRefundId,
        isEligibleForRefund: false,
      })
      .where(eq(leads.id, leadId))
      .returning();

    return updatedLead;
  }

  async getLeadsEligibleForRefund(): Promise<Lead[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.isEligibleForRefund, true),
          eq(leads.status, 'new'),
          sql`${leads.createdAt} < ${threeDaysAgo}`,
          sql`${leads.contactedAt} IS NULL`
        )
      );
  }

  async checkCustomerResponseStatus(projectId: number): Promise<boolean> {
    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) return false;

    const quotesCount = await db.select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(eq(quotes.projectId, projectId));

    const messagesCount = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.projectId, projectId));

    // Customer is considered responsive if they have quotes or messages
    return (quotesCount[0]?.count || 0) > 0 || (messagesCount[0]?.count || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
