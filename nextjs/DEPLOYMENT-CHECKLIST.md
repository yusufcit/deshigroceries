# Deployment Checklist for Deshi Grocery

Use this checklist before going live with real customers.

## Pre-Launch Checklist

### Database & Backend
- [ ] Supabase project created and configured
- [ ] Database schema executed successfully  
- [ ] All tables created (categories, products, orders, etc.)
- [ ] Row Level Security (RLS) policies active
- [ ] Admin user created in admin_users table
- [ ] Sample data added to test functionality

### Environment Configuration
- [ ] `.env.local` configured with all keys
- [ ] Supabase URL and keys added
- [ ] Stripe keys added (test mode initially)
- [ ] Site URL configured correctly
- [ ] No secrets committed to Git

### Products & Content
- [ ] At least 10-20 products added
- [ ] All active categories have products
- [ ] Product images uploaded (or placeholder ready)
- [ ] Product prices set correctly
- [ ] Stock quantities configured
- [ ] Product descriptions written

### Payment Testing
- [ ] Stripe test mode working
- [ ] Test checkout completed successfully
- [ ] Order created in database after payment
- [ ] Order confirmation page displays correctly
- [ ] Test card 4242 4242 4242 4242 works

### Admin Dashboard
- [ ] Admin user can login
- [ ] Dashboard displays correct statistics
- [ ] Can view products list
- [ ] Can view orders list
- [ ] Can update order status

### Customer Experience
- [ ] Homepage loads correctly
- [ ] Categories display properly
- [ ] Products show up in shop page
- [ ] Search works (if implemented)
- [ ] Add to cart functions correctly
- [ ] Cart persists on page refresh
- [ ] Checkout form validates properly
- [ ] Can register new account
- [ ] Can login to existing account

### Mobile Responsiveness
- [ ] Test on iPhone/Android
- [ ] Navigation menu works on mobile
- [ ] Product cards display correctly
- [ ] Cart page is mobile-friendly
- [ ] Checkout form usable on small screens
- [ ] Images load and scale properly

### Performance
- [ ] Homepage loads in < 3 seconds
- [ ] Images are optimized
- [ ] No console errors in browser
- [ ] No 404 errors for assets
- [ ] Fonts load correctly

## Deployment Steps

### 1. GitHub
- [ ] Code pushed to GitHub repository
- [ ] Repository is private (recommended)
- [ ] `.env.local` not committed
- [ ] `.gitignore` excludes sensitive files

### 2. Vercel Deployment
- [ ] Project connected to Vercel
- [ ] All environment variables added
- [ ] Framework preset set to Next.js
- [ ] Build completed successfully
- [ ] Site is accessible at Vercel URL

### 3. DNS & Domain (Optional)
- [ ] Custom domain purchased
- [ ] DNS configured in Vercel
- [ ] SSL certificate active (auto by Vercel)
- [ ] Site accessible via custom domain

### 4. Post-Deployment
- [ ] Site URL updated in environment variables
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhook configured (production)
- [ ] Test complete checkout on production
- [ ] Admin dashboard accessible
- [ ] All pages loading correctly

## Going Live with Real Payments

### Before Enabling Stripe Live Mode:
- [ ] Business registered and verified
- [ ] Bank account connected to Stripe
- [ ] Tax information submitted
- [ ] Terms of service & privacy policy pages added
- [ ] Return/refund policy defined
- [ ] Customer support email configured

### Stripe Live Mode
- [ ] Stripe account fully activated
- [ ] Live API keys obtained
- [ ] Update environment variables with live keys
- [ ] Webhook endpoint updated with live secret
- [ ] Test live payment with real card
- [ ] Verify order completes correctly

## Post-Launch Monitoring

### Daily Tasks
- [ ] Check for new orders
- [ ] Process pending orders
- [ ] Respond to customer inquiries
- [ ] Monitor Stripe dashboard for payments

### Weekly Tasks
- [ ] Review sales analytics
- [ ] Update low-stock products
- [ ] Add new products
- [ ] Check website performance
- [ ] Review customer feedback

### Monthly Tasks
- [ ] Analyze sales trends
- [ ] Update featured products
- [ ] Review and update pricing
- [ ] Backup database
- [ ] Review security logs

## Emergency Contacts

- **Supabase Support**: support@supabase.com
- **Stripe Support**: support@stripe.com
- **Vercel Support**: support@vercel.com

## Rollback Plan

If something goes wrong:

1. **Database Issues**: 
   - Check Supabase status page
   - Review SQL logs in Supabase dashboard
   - Contact Supabase support

2. **Payment Issues**:
   - Switch back to test mode
   - Check Stripe dashboard for errors
   - Review webhook logs

3. **Website Down**:
   - Check Vercel deployment logs
   - Verify environment variables
   - Redeploy previous version in Vercel

4. **Complete Rollback**:
   - Go to Vercel Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

---

## 🎉 Launch Day!

When everything is checked:

1. Switch Stripe to live mode
2. Update environment variables with live keys
3. Announce on social media
4. Send email to test customers
5. Monitor first few orders closely
6. Celebrate! 🎊

**Good luck with your launch!**
