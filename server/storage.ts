import { 
  users, 
  projects, 
  leads, 
  quotes, 
  reviews, 
  messages, 
  favorites,
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
  type InsertFavorite
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getEligibleContractors(category: string, zipCode: string, budget: string): Promise<User[]>;
  
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
}

export const storage = new DatabaseStorage();
