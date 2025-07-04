# TaskNab - Home Improvement Lead Marketplace

## Overview

TaskNab is a full-stack marketplace application that connects homeowners with verified home improvement service professionals. The platform allows homeowners to post projects and receive quotes, while service providers can purchase leads and manage their business operations. The application features a dual-sided marketplace with separate user experiences for homeowners and service providers.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the application
- **API Design**: RESTful API with session-based authentication
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Database**: PostgreSQL with Neon serverless driver
- **Schema**: Comprehensive relational design supporting users, projects, leads, quotes, reviews, and messaging
- **User Types**: Dual user system (homeowners and service providers)
- **Lead System**: Dynamic pricing based on category, budget, and urgency

## Key Components

### Authentication & Authorization
- Session-based authentication using express-session
- Bcrypt for password hashing
- Role-based access control for homeowners vs service providers
- Protected routes with user type validation

### Payment Processing
- Stripe integration for lead purchases
- Credit system for service providers
- Dynamic lead pricing algorithm
- Support for both one-time purchases and auto-purchasing

### Lead Management
- Real-time lead marketplace
- Geographic filtering by ZIP code
- Category-based lead classification
- Lead status tracking (new, contacted, quoted, won, lost)

### Project System
- Project creation and management for homeowners
- Multiple service categories (kitchen renovation, electrical, plumbing, etc.)
- Budget ranges and urgency levels
- Image upload support for project documentation

### Communication System
- In-app messaging between homeowners and service providers
- Quote submission and management
- Review and rating system

## Data Flow

1. **Homeowner Journey**:
   - Register and create account
   - Post project with details, budget, and requirements
   - Receive quotes from interested service providers
   - Communicate through messaging system
   - Select provider and leave reviews

2. **Service Provider Journey**:
   - Register with business credentials and verification
   - Browse and purchase leads in marketplace
   - Contact homeowners and submit quotes
   - Manage lead pipeline and track conversion
   - Build reputation through reviews

3. **Lead Generation & Distribution**:
   - Projects automatically become available leads
   - Dynamic pricing based on project characteristics
   - Geographic and category filtering for relevant matches
   - Real-time availability and purchase processing

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Payment Processing**: Stripe for payment handling
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Validation**: Zod for runtime type validation
- **Form Handling**: React Hook Form with resolver integration

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Development server and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database migration and schema management

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20, Web, and PostgreSQL 16 modules
- **Development**: `npm run dev` starts both frontend and backend
- **Production**: `npm run build` followed by `npm run start`
- **Database**: Automatic PostgreSQL provisioning with environment variables

### Build Process
- Frontend built to `dist/public` directory
- Backend bundled with esbuild for production
- Static file serving in production mode
- Environment-based configuration for development vs production

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe private key for payments
- `VITE_STRIPE_PUBLIC_KEY`: Stripe public key for frontend

## Recent Changes

✓ **Automatic Lead Distribution System** (June 24, 2025)
- Implemented automatic charging of 3-4 contractors when homeowners submit projects
- Added contractor budget management with daily/weekly spending limits
- Created payment method setup with Stripe integration
- Added lead credits system for prepaid purchases
- Built contractor settings page for budget and payment configuration

✓ **Competitive Pricing System** (June 24, 2025)
- Updated lead pricing to match Thumbtack rates (20-30% lower)
- Expanded to 12 service categories with competitive base prices
- Dynamic pricing algorithm based on project scope, budget, and urgency
- Complete Stripe payment system with automatic billing
- Budget enforcement to prevent overspending

✓ **Enhanced Database Schema** (June 24, 2025)
- Added contractor payment preferences and budget tracking
- Implemented automatic budget reset functionality
- Added lead credit balance management
- Enhanced user table with Stripe customer/payment method integration

✓ **Integrated Scheduler System** (June 24, 2025)
- Complete appointment booking system between homeowners and contractors
- Calendar interface with date selection and time slot management
- Contractor availability management with weekly schedules
- Appointment status tracking (scheduled, confirmed, completed, cancelled)
- Real-time availability checking to prevent double-booking

✓ **Mobile App Ready (PWA)** (June 24, 2025)
- Progressive Web App implementation for mobile devices
- Installable on both iPhone and Android home screens
- Offline functionality with service worker caching
- Push notification support for leads and appointments
- Mobile-optimized touch interface and responsive design
- App store submission ready (Google Play Store and Apple App Store)

✓ **Production Deployment Fixes** (June 28, 2025)
- Added comprehensive error handling to prevent server crashes during startup
- Implemented fallback static file serving for production mode
- Added NODE_ENV environment variable detection and configuration
- Created try-catch wrapper for entire startup process
- Enhanced production error logging and graceful error handling
- Fixed static file path resolution for deployment environment
- Created alternative production static file handler with multiple path detection
- Added graceful fallback application when static files are unavailable
- Enhanced deployment readiness checks with comprehensive validation
- Improved environment auto-detection for various deployment platforms

✓ **Percentage-Based Refund System** (June 28, 2025)
- Implemented configurable percentage refunds (defaults to 40%) instead of full refunds
- Added automatic detection of non-responsive customers after 3 days
- Enhanced lead distribution to charge 3-4 contractors per project automatically
- Integrated Stripe partial refund processing with detailed metadata tracking
- Added admin controls for bulk refund processing with custom percentages
- Created automated refund eligibility checking for non-responsive scenarios
- Added refund tracking fields to database schema (reason, amount, Stripe ID)
- Implemented credit-based refund system for contractor balance restoration

✓ **Real-Time Project Collaboration Chat** (June 28, 2025)
- Built comprehensive real-time messaging system using WebSocket infrastructure
- Created project-chat.tsx component with real-time messaging capabilities
- Enhanced messaging storage with support for message types, attachments, and read status
- Integrated chat functionality into project details page with tabbed interface
- Added WebSocket server on distinct path (/ws) to avoid HMR conflicts
- Implemented message threading, file attachments, and read receipts
- Added separate chat interfaces for homeowners and contractors
- Enhanced project details page with tabs for details, quotes, chat, and schedule

✓ **Enhanced Dashboard Navigation** (June 28, 2025)
- Redesigned homeowner dashboard with improved visual hierarchy and quick actions
- Added colorful metric cards with icons and clear visual indicators
- Created intuitive quick action buttons for common tasks (post project, browse pros, schedule)
- Enhanced contractor dashboard with performance metrics and business insights
- Added win rate tracking, revenue monitoring, and lead conversion analytics
- Implemented better color coding and visual feedback for both user types
- Improved navigation flow with prominent call-to-action buttons
- Added visual progress indicators and status badges throughout dashboards

✓ **User Preferences & Login/Logout Customization** (July 2, 2025)
- Built comprehensive user preferences system with database schema updates
- Added customizable login redirect options (dashboard, home, marketplace, last page)
- Implemented logout redirect preferences with default to sign-in page for easy user switching
- Created preferences page with settings for remember me defaults and session timeouts
- Added auto-logout configuration with time-based controls
- Integrated preferences navigation links in both desktop and mobile menus
- Enhanced authentication flow to respect user-specific redirect preferences
- Updated logout behavior to redirect to sign-in page by default instead of homepage

✓ **Animated Service Recommendation Carousel** (July 2, 2025)
- Created responsive service carousel with smooth animations and auto-rotation
- Integrated with service categories API for real-time data display
- Added navigation controls with left/right arrows and dot indicators
- Implemented auto-pause on hover and manual play/pause controls
- Featured service-specific Unsplash images that accurately represent each service type
- Added hover effects, rating displays, and pricing information
- Positioned prominently on home page between hero section and service categories
- Enhanced service discovery with visual service cards and "Get Quotes" call-to-action buttons

## Changelog
```
Changelog:
- June 24, 2025. Initial setup with basic marketplace functionality
- June 24, 2025. Added automatic lead distribution with budget controls
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```