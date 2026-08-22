# Deshi Grocery - Complete Setup Guide

This guide will walk you through setting up your production-ready online halal grocery store from scratch.

## 📋 What You'll Build

- **Customer Website**: Browse products, add to cart, checkout with Stripe
- **Admin Dashboard**: Manage products, orders, and customers
- **Database**: Secure PostgreSQL database with Supabase
- **Payments**: Integrated Stripe payment processing
- **Deployment**: Hosted on Vercel's free tier

## ⏱️ Estimated Time: 30-45 minutes

---

## Part 1: Supabase Setup (10 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign in with GitHub (recommended) or email
4. Once logged in, click **"New project"**
5. Fill in the details:
   - **Organization**: Select or create new
   - **Name**: `deshi-grocery`
   - **Database Password**: Click "Generate a password" and **save it somewhere safe**
   - **Region**: Select **Europe (West) - eu-west-1** (closest to Dublin)
   - **Pricing Plan**: Free
6. Click **"Create new project"**
7. Wait 2-3 minutes for the project to initialize

### Step 2: Set Up Database Schema

1. Once your project is ready, click on **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open the file `/Users/mdyusuf/Documents/deshigrocery/supabase-schema.sql` on your computer
4. Copy the **entire content** of this file
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this is correct!
8. Click **"Table Editor"** in the left sidebar to verify tables were created
9. You should see: categories, products, customers, orders, order_items, etc.

### Step 3: Get Supabase API Keys

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"**
3. You'll see two important keys. **Copy these somewhere safe**:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGc......` (very long string)
   - Scroll down to **Project API keys** section
   - Copy the **service_role** key (keep this SECRET!)

---

## Part 2: Stripe Setup (5 minutes)

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click **"Start now"** or **"Sign in"**
3. Create a free account (no credit card needed for testing)
4. Complete account setup

### Step 2: Get Test API Keys

1. Once logged in, make sure you're in **TEST MODE** (toggle in top right should say "Test mode")
2. Click **"Developers"** in the top menu
3. Click **"API keys"**
4. You'll see two keys. **Copy these**:
   - **Publishable key**: `pk_test_..................`
   - **Secret key**: Click **"Reveal test key"**, then copy `sk_test_..................`

**Important**: Never share your Secret key publicly!

---

## Part 3: Configure Your Application (5 minutes)

### Step 1: Update Environment Variables

1. Navigate to your project folder:
   ```bash
   cd /Users/mdyusuf/Documents/deshigrocery
   ```

2. Open the file `.env.local` in your text editor

3. Replace the placeholder values with your actual keys:

```env
# Supabase - Paste your keys from Part 1, Step 3
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc.........................
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc.........................

# Stripe - Paste your keys from Part 2, Step 2
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..................
STRIPE_SECRET_KEY=sk_test_..................
STRIPE_WEBHOOK_SECRET=whsec_..................

# Site URL - Leave as is for now
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Save the file

---

## Part 4: Add Sample Data (5 minutes)

### Add Products via Supabase Dashboard

1. Go back to your Supabase dashboard
2. Click **"Table Editor"** → **"products"**
3. Click **"Insert row"** → **"Insert row"**
4. Fill in the form:

**Product 1: Chicken Breast**
- category_id: Click dropdown → select "Chicken" (the UUID will be auto-filled)
- name: `Organic Chicken Breast`
- slug: `organic-chicken-breast`
- description: `Fresh organic chicken breast, perfect for grilling or roasting`
- price: `12.99`
- stock_quantity: `50`
- is_available: ✅ (check the box)
- is_featured: ✅ (check the box)
- Click **"Save"**

**Product 2: Lamb Chops**
- category_id: Select "Lamb"
- name: `Premium Lamb Chops`
- slug: `premium-lamb-chops`
- description: `Tender lamb chops, grass-fed and halal certified`
- price: `18.99`
- stock_quantity: `30`
- is_available: ✅
- is_featured: ✅
- Click **"Save"**

**Product 3: Beef Mince**
- category_id: Select "Beef"
- name: `Lean Beef Mince`
- slug: `lean-beef-mince`
- description: `100% halal lean beef mince, 500g`
- price: `8.99`
- stock_quantity: `100`
- is_available: ✅
- is_featured: ✅
- Click **"Save"**

Repeat for a few more products to populate your store!

---

## Part 5: Run the Application (2 minutes)

### Start Development Server

1. Open Terminal and navigate to your project:
   ```bash
   cd /Users/mdyusuf/Documents/deshigrocery
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Wait for it to compile (10-20 seconds)

4. Open your browser and go to: [http://localhost:3000](http://localhost:3000)

5. You should see:
   - ✅ Homepage with hero section
   - ✅ Categories displayed
   - ✅ Featured products showing
   - ✅ Working navigation

### Test the Store

1. Click on a product
2. Click **"Add to Cart"**
3. Click the cart icon in the header
4. Click **"Proceed to Checkout"**
5. Fill in delivery details (use any Dublin address)
6. Click **"Pay with Stripe"**
7. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits
8. Complete payment
9. You should see success page and order confirmation!

---

## Part 6: Create Admin Account (3 minutes)

### Step 1: Register an Account

1. Go to [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Fill in your details:
   - Full Name: Your Name
   - Email: your.email@example.com
   - Phone: +353 87 1234567
   - Password: (at least 6 characters)
3. Click **"Create Account"**
4. Check your email for verification link (if using real email)
5. Click the verification link

### Step 2: Make Yourself an Admin

1. Go back to Supabase dashboard
2. Click **"Authentication"** in left sidebar
3. Click **"Users"**
4. Find your email and **click on it**
5. **Copy your User ID** (it's a long UUID like `a1b2c3d4-e5f6-...`)

6. Click **"Table Editor"** → **"admin_users"**
7. Click **"Insert row"**
8. Fill in:
   - id: Paste your User ID from step 5
   - email: Your email
   - full_name: Your name
   - role: `super_admin`
   - is_active: ✅ (check the box)
9. Click **"Save"**

### Step 3: Access Admin Dashboard

1. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
2. You should see the admin dashboard with:
   - Total products
   - Total orders
   - Total customers
   - Recent orders list

**Congratulations! Your admin panel is ready!**

---

## Part 7: Deploy to Vercel (10 minutes)

### Step 1: Push to GitHub

1. Initialize git (if not already done):
   ```bash
   cd /Users/mdyusuf/Documents/deshigrocery
   git init
   git add .
   git commit -m "Initial commit - Deshi Grocery"
   ```

2. Create a new repository on [github.com](https://github.com):
   - Click **"New repository"**
   - Name: `deshi-grocery`
   - Keep it Private
   - Don't initialize with README
   - Click **"Create repository"**

3. Push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/deshi-grocery.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (use GitHub account)
3. Click **"New Project"**
4. **Import** your `deshi-grocery` repository
5. Configure project:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Click **"Environment Variables"**

6. Add all variables from `.env.local` (one by one):
   - Name: `NEXT_PUBLIC_SUPABASE_URL`, Value: `your-url`
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Value: `your-key`
   - (Continue for all 6 variables)
   - **IMPORTANT**: Change `NEXT_PUBLIC_SITE_URL` to `https://your-site.vercel.app` (you'll get this URL after deployment)

7. Click **"Deploy"**
8. Wait 2-3 minutes for deployment
9. Once done, click **"Visit"** to see your live site!

### Step 3: Update Site URL

1. After deployment, copy your Vercel URL (e.g., `https://deshi-grocery-abc123.vercel.app`)
2. In Vercel dashboard, go to **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_SITE_URL`
4. Click **"Edit"** → Update to your Vercel URL → **"Save"**
5. Go to **"Deployments"** → Click the three dots on latest deployment → **"Redeploy"**

### Step 4: Update Supabase Settings

1. Go to Supabase dashboard
2. Click **"Authentication"** → **"URL Configuration"**
3. Update **"Site URL"**: `https://your-site.vercel.app`
4. Add to **"Redirect URLs"**: `https://your-site.vercel.app/**`
5. Click **"Save"**

---

## 🎉 You're Done!

Your online halal grocery store is now LIVE and accepting real orders!

### ✅ What You've Built:

- Professional e-commerce website
- Secure payment processing with Stripe
- Admin dashboard for managing everything
- Mobile-responsive design
- Deployed and accessible worldwide

### 📱 Next Steps:

1. **Add More Products**: Use Supabase Table Editor or Admin dashboard
2. **Customize Design**: Edit colors in `src/app/globals.css`
3. **Add Images**: Upload to Supabase Storage and link in products
4. **Set Up Domain**: Add custom domain in Vercel settings
5. **Enable Stripe Live Mode**: Switch to live keys when ready to accept real payments

### 💡 Tips for Success:

- Start with test mode until you're comfortable
- Add at least 20-30 products for a full catalog
- Test checkout process thoroughly before going live
- Keep your secret keys safe and never commit them to GitHub
- Monitor orders daily through admin dashboard

---

## 🆘 Troubleshooting

**Products not showing?**
- Check Supabase → Table Editor → products
- Make sure `is_available` is checked
- Refresh the page

**Can't login to admin?**
- Verify you added your user ID to `admin_users` table
- Check `is_active` is true
- Make sure you're using the correct email

**Checkout not working?**
- Verify Stripe keys are correct in `.env.local`
- Make sure you're using test card number: 4242 4242 4242 4242
- Check browser console for errors

**Deployment failed?**
- Make sure all environment variables are added
- Check Vercel build logs for specific errors
- Verify your GitHub repository is accessible

---

## 📞 Need Help?

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

**Built with ❤️ for Deshi Grocery Dublin**
