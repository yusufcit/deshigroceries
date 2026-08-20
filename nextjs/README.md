# Deshi Grocery - Online Halal Meat & Fish Delivery

A production-ready e-commerce website for halal grocery delivery in Dublin, Ireland. Built with Next.js, TypeScript, Tailwind CSS, Supabase, and Stripe.

## ✨ Features

### Customer Features
- 🛒 Browse products by category
- 🔍 Search and filter products
- 🛍️ Shopping cart with persistent state
- 💳 Secure Stripe payment integration
- 📦 Order tracking and history
- 👤 User authentication and accounts
- 🚚 Delivery address management
- 📱 Mobile-first responsive design

### Admin Features
- 📊 Dashboard with sales analytics
- 📦 Product management (CRUD)
- 🏷️ Category management
- 📋 Order management and status updates
- 👥 Customer management
- 🚚 Delivery zone configuration

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Payments**: Stripe
- **State Management**: Zustand
- **Deployment**: Vercel (free tier compatible)

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- Stripe account (test mode)

## 🛠️ Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. In SQL Editor, run the contents of \`supabase-schema.sql\`
3. Get your project URL and API keys from Settings → API

### 3. Set Up Stripe

1. Get test keys from [stripe.com/dashboard](https://dashboard.stripe.com)
2. Copy Publishable and Secret keys

### 4. Configure Environment

Copy \`.env.local.example\` to \`.env.local\` and add your keys:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## 📦 Adding Products

### Via Supabase Dashboard

1. Go to Table Editor → products
2. Insert row with category_id, name, slug, price, stock
3. Set is_available = true, is_featured = true

## 👨‍💼 Create Admin User

1. Register via website
2. In Supabase Auth → Users, copy your user ID
3. In Table Editor → admin_users, insert:
   - id: your user ID
   - email: your email
   - role: super_admin
   - is_active: true

Access admin at \`/admin\`

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Update \`NEXT_PUBLIC_SITE_URL\` to your Vercel domain.

## 📞 Support

Check browser console for errors and verify:
- Supabase connection
- Stripe keys configured  
- Products have is_available = true

---

**Built for Deshi Grocery Dublin** 🛒
