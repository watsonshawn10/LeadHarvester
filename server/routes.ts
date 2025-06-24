import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertLeadSchema, insertQuoteSchema, insertReviewSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { z } from "zod";
import Stripe from "stripe";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      userType: string;
    }
  }
}

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
}

// Helper function to calculate lead price
function calculateLeadPrice(category: string, budget?: string, urgency?: string): number {
  let basePrice = 25; // Default base price
  
  // Adjust price based on category
  switch (category) {
    case 'kitchen-renovation':
      basePrice = 65;
      break;
    case 'basement-remodeling':
      basePrice = 45;
      break;
    case 'electrical':
      basePrice = 32;
      break;
    case 'plumbing':
      basePrice = 18;
      break;
    case 'landscaping':
      basePrice = 22;
      break;
    default:
      basePrice = 25;
  }

  // Adjust price based on budget
  if (budget) {
    if (budget.includes('over-25000')) {
      basePrice *= 2.5;
    } else if (budget.includes('10000-25000')) {
      basePrice *= 2;
    } else if (budget.includes('5000-10000')) {
      basePrice *= 1.5;
    }
  }

  // Adjust price based on urgency
  if (urgency === 'asap') {
    basePrice *= 1.5;
  } else if (urgency === 'within-week') {
    basePrice *= 1.2;
  }

  return Math.round(basePrice);
}

// Automatic lead distribution function
async function distributeLeadsAutomatically(project: any) {
  if (!stripe) {
    console.log('Stripe not configured, skipping automatic lead distribution');
    return;
  }

  try {
    // Get eligible contractors
    const eligibleContractors = await storage.getEligibleContractors(
      project.category, 
      project.zipCode, 
      project.budget || ''
    );

    // Limit to top 3-4 contractors (sorted by rating)
    const selectedContractors = eligibleContractors
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 4);

    const leadPrice = calculateLeadPrice(project.category, project.budget, project.urgency);

    // Process each contractor
    for (const contractor of selectedContractors) {
      try {
        // Check if contractor has sufficient credits or payment method
        if (!contractor.stripeCustomerId || !contractor.stripePaymentMethodId) {
          console.log(`Skipping contractor ${contractor.id} - no payment method`);
          continue;
        }

        // Check budget limits
        const canAfford = await storage.canAffordLead(contractor, leadPrice);
        if (!canAfford) {
          console.log(`Skipping contractor ${contractor.id} - exceeds budget limits`);
          continue;
        }

        // Check if contractor has sufficient lead credits
        const contractorCredits = parseFloat(contractor.leadCredits || '0');
        let paymentIntentId: string | null = null;
        
        if (contractorCredits >= leadPrice) {
          // Deduct from credits
          await storage.updateUser(contractor.id, {
            leadCredits: (contractorCredits - leadPrice).toString()
          });
        } else {
          // Charge via Stripe
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: leadPrice * 100, // Convert to cents
              currency: 'usd',
              customer: contractor.stripeCustomerId,
              payment_method: contractor.stripePaymentMethodId,
              confirm: true,
              return_url: 'https://your-domain.com/return',
              metadata: {
                contractorId: contractor.id.toString(),
                projectId: project.id.toString(),
                leadPrice: leadPrice.toString(),
              },
            });

            if (paymentIntent.status !== 'succeeded') {
              console.log(`Payment failed for contractor ${contractor.id}`);
              continue;
            }
            
            paymentIntentId = paymentIntent.id;
          } catch (paymentError) {
            console.log(`Payment denied for contractor ${contractor.id}:`, paymentError);
            continue;
          }
        }

        // Update spent amounts
        await storage.updateSpentAmount(contractor.id, leadPrice);

        // Create the lead
        await storage.createLead({
          projectId: project.id,
          serviceProviderId: contractor.id,
          price: leadPrice.toString(),
          status: 'new',
          isAutoPurchased: true,
          stripePaymentIntentId: paymentIntentId,
        });

        console.log(`Lead automatically distributed to contractor ${contractor.id} for project ${project.id}`);
      } catch (error) {
        console.error(`Failed to process contractor ${contractor.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in automatic lead distribution:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session?.user) {
      req.user = req.session.user;
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      req.session!.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
      };

      res.json({ user: req.session!.user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session!.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
      };

      res.json({ user: req.session!.user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session!.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session?.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getActiveProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/my", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjectsByHomeowner(req.user!.id);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'homeowner') {
        return res.status(403).json({ message: "Only homeowners can create projects" });
      }

      const validatedData = insertProjectSchema.parse({
        ...req.body,
        homeownerId: req.user!.id,
      });
      
      const project = await storage.createProject(validatedData);

      // Automatically distribute leads to eligible contractors
      distributeLeadsAutomatically(project);

      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.homeownerId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      const updatedProject = await storage.updateProject(projectId, updates);
      res.json(updatedProject);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Lead routes
  app.get("/api/leads/my", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can view leads" });
      }

      const leads = await storage.getLeadsByServiceProvider(req.user!.id);
      
      // Enhance leads with project information
      const enhancedLeads = await Promise.all(
        leads.map(async (lead) => {
          const project = await storage.getProject(lead.projectId);
          return { ...lead, project };
        })
      );

      res.json(enhancedLeads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/leads", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can purchase leads" });
      }

      const validatedData = insertLeadSchema.parse({
        ...req.body,
        serviceProviderId: req.user!.id,
      });
      
      const lead = await storage.createLead(validatedData);
      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (lead.serviceProviderId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      
      // Auto-set timestamps based on status changes
      if (updates.status === 'contacted' && !lead.contactedAt) {
        updates.contactedAt = new Date();
      } else if (updates.status === 'quoted' && !lead.quotedAt) {
        updates.quotedAt = new Date();
      } else if (updates.status === 'won' && !lead.wonAt) {
        updates.wonAt = new Date();
      }
      
      const updatedLead = await storage.updateLead(leadId, updates);
      res.json(updatedLead);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Quote routes
  app.get("/api/quotes/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const quotes = await storage.getQuotesByProject(projectId);
      res.json(quotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quotes", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can create quotes" });
      }

      const validatedData = insertQuoteSchema.parse({
        ...req.body,
        serviceProviderId: req.user!.id,
      });
      
      const quote = await storage.createQuote(validatedData);
      res.json(quote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can view analytics" });
      }

      const stats = await storage.getServiceProviderStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Review routes
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'homeowner') {
        return res.status(403).json({ message: "Only homeowners can create reviews" });
      }

      const validatedData = insertReviewSchema.parse({
        ...req.body,
        homeownerId: req.user!.id,
      });
      
      const review = await storage.createReview(validatedData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Message routes
  app.get("/api/messages/project/:projectId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const messages = await storage.getMessagesByProject(projectId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id,
      });
      
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment variables." });
      }

      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can purchase leads" });
      }

      const { amount, leadId } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user!.id.toString(),
          leadId: leadId?.toString() || '',
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Lead purchase endpoint
  app.post("/api/purchase-lead", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can purchase leads" });
      }

      const { projectId, amount } = req.body;

      // Check if project exists and is active
      const project = await storage.getProject(projectId);
      if (!project || project.status !== 'active') {
        return res.status(400).json({ message: "Project not available" });
      }

      // Check if user already has a lead for this project
      const existingLeads = await storage.getLeadsByProject(projectId);
      const userHasLead = existingLeads.some(lead => lead.serviceProviderId === req.user!.id);
      
      if (userHasLead) {
        return res.status(400).json({ message: "You already have access to this lead" });
      }

      // Create the lead
      const lead = await storage.createLead({
        projectId,
        serviceProviderId: req.user!.id,
        price: amount,
        status: 'new',
      });

      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get available leads for purchase
  app.get("/api/available-leads", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can view available leads" });
      }

      const projects = await storage.getActiveProjects();
      
      // Filter out projects where user already has leads
      const userLeads = await storage.getLeadsByServiceProvider(req.user!.id);
      const userProjectIds = new Set(userLeads.map(lead => lead.projectId));
      
      const availableProjects = projects.filter(project => 
        !userProjectIds.has(project.id) && project.homeownerId !== req.user!.id
      );

      // Calculate lead prices based on project scope and category
      const leadsWithPricing = availableProjects.map(project => {
        let basePrice = 25; // Default base price
        
        // Adjust price based on category
        switch (project.category) {
          case 'kitchen-renovation':
            basePrice = 65;
            break;
          case 'basement-remodeling':
            basePrice = 45;
            break;
          case 'electrical':
            basePrice = 32;
            break;
          case 'plumbing':
            basePrice = 18;
            break;
          case 'landscaping':
            basePrice = 22;
            break;
          default:
            basePrice = 25;
        }

        // Adjust price based on budget
        if (project.budget) {
          if (project.budget.includes('over-25000')) {
            basePrice *= 2.5;
          } else if (project.budget.includes('10000-25000')) {
            basePrice *= 2;
          } else if (project.budget.includes('5000-10000')) {
            basePrice *= 1.5;
          }
        }

        // Adjust price based on urgency
        if (project.urgency === 'asap') {
          basePrice *= 1.5;
        } else if (project.urgency === 'within-week') {
          basePrice *= 1.2;
        }

        return {
          ...project,
          leadPrice: Math.round(basePrice),
        };
      });

      res.json(leadsWithPricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Contractor payment settings routes
  app.get("/api/contractor/payment-settings", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can access payment settings" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        autoLeadPurchase: user.autoLeadPurchase,
        dailyBudgetLimit: user.dailyBudgetLimit,
        weeklyBudgetLimit: user.weeklyBudgetLimit,
        dailySpentAmount: user.dailySpentAmount,
        weeklySpentAmount: user.weeklySpentAmount,
        leadCredits: user.leadCredits,
        hasPaymentMethod: !!user.stripePaymentMethodId,
        preferredCategories: user.preferredCategories || [],
        serviceRadius: user.serviceRadius,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/contractor/payment-settings", requireAuth, async (req, res) => {
    try {
      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can update payment settings" });
      }

      const {
        autoLeadPurchase,
        dailyBudgetLimit,
        weeklyBudgetLimit,
        preferredCategories,
        serviceRadius,
      } = req.body;

      const updates: Partial<InsertUser> = {};
      
      if (typeof autoLeadPurchase === 'boolean') {
        updates.autoLeadPurchase = autoLeadPurchase;
      }
      
      if (dailyBudgetLimit !== undefined) {
        updates.dailyBudgetLimit = dailyBudgetLimit ? dailyBudgetLimit.toString() : null;
      }
      
      if (weeklyBudgetLimit !== undefined) {
        updates.weeklyBudgetLimit = weeklyBudgetLimit ? weeklyBudgetLimit.toString() : null;
      }
      
      if (preferredCategories) {
        updates.preferredCategories = preferredCategories;
      }
      
      if (serviceRadius !== undefined) {
        updates.serviceRadius = serviceRadius;
      }

      const updatedUser = await storage.updateUser(req.user!.id, updates);
      
      res.json({
        autoLeadPurchase: updatedUser.autoLeadPurchase,
        dailyBudgetLimit: updatedUser.dailyBudgetLimit,
        weeklyBudgetLimit: updatedUser.weeklyBudgetLimit,
        dailySpentAmount: updatedUser.dailySpentAmount,
        weeklySpentAmount: updatedUser.weeklySpentAmount,
        leadCredits: updatedUser.leadCredits,
        hasPaymentMethod: !!updatedUser.stripePaymentMethodId,
        preferredCategories: updatedUser.preferredCategories || [],
        serviceRadius: updatedUser.serviceRadius,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/contractor/setup-payment-method", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can setup payment methods" });
      }

      const { paymentMethodId } = req.body;
      const user = await storage.getUser(req.user!.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          metadata: {
            userId: user.id.toString(),
          },
        });
        customerId = customer.id;
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Update user with Stripe customer ID and payment method
      await storage.updateUser(user.id, {
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethodId,
      });

      res.json({ success: true, message: "Payment method setup successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/contractor/add-credits", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      if (req.user!.userType !== 'service_provider') {
        return res.status(403).json({ message: "Only service providers can add credits" });
      }

      const { amount } = req.body; // Amount in dollars
      const user = await storage.getUser(req.user!.id);

      if (!user || !user.stripeCustomerId || !user.stripePaymentMethodId) {
        return res.status(400).json({ message: "Payment method not setup" });
      }

      // Create payment intent for adding credits
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: user.stripePaymentMethodId,
        confirm: true,
        return_url: 'https://your-domain.com/return',
        metadata: {
          type: 'credit_purchase',
          userId: user.id.toString(),
          creditAmount: amount.toString(),
        },
      });

      if (paymentIntent.status === 'succeeded') {
        // Add credits to user account
        const currentCredits = parseFloat(user.leadCredits || '0');
        await storage.updateUser(user.id, {
          leadCredits: (currentCredits + amount).toString(),
        });

        res.json({ success: true, newCreditBalance: currentCredits + amount });
      } else {
        res.status(400).json({ message: "Payment failed" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Service categories endpoint
  app.get("/api/service-categories", (req, res) => {
    const categories = [
      {
        id: 1,
        name: "House Painting",
        description: "Interior and exterior painting services",
        basePrice: 25,
        prosAvailable: 1247,
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
      },
      {
        id: 2,
        name: "Basement Remodeling",
        description: "Complete basement renovation services",
        basePrice: 45,
        prosAvailable: 892,
        image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
      },
      {
        id: 3,
        name: "Kitchen Renovation",
        description: "Full kitchen remodeling and design",
        basePrice: 65,
        prosAvailable: 634,
        image: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
      },
      {
        id: 4,
        name: "Plumbing Services",
        description: "Installation, repair, and maintenance",
        basePrice: 18,
        prosAvailable: 1543,
        image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
      },
      {
        id: 5,
        name: "Electrical Work",
        description: "Licensed electrical installation and repair",
        basePrice: 32,
        prosAvailable: 987,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
      },
      {
        id: 6,
        name: "Landscaping",
        description: "Garden design and outdoor maintenance",
        basePrice: 22,
        prosAvailable: 756,
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
      }
    ];
    res.json(categories);
  });

  const httpServer = createServer(app);

  return httpServer;
}
