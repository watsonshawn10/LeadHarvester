# Stripe Setup Guide

Follow these steps to connect your Stripe account to enable lead purchases and payments in your marketplace.

## Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and click "Start now"
2. Create your account with your business information
3. Complete the verification process (this may take a few minutes)

## Step 2: Get Your API Keys

1. Log into your Stripe Dashboard at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to the **API Keys** section: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. You'll see two keys you need:

### Publishable Key (Public)
- Starts with `pk_test_` (for testing) or `pk_live_` (for production)
- This is safe to use in your browser
- Copy this as your `VITE_STRIPE_PUBLIC_KEY`

### Secret Key (Private)
- Starts with `sk_test_` (for testing) or `sk_live_` (for production)
- Keep this secret - never share it publicly
- Copy this as your `STRIPE_SECRET_KEY`

## Step 3: Add Keys to Your Replit Project

1. In your Replit project, click on the **Secrets** tab (lock icon) in the left sidebar
2. Add two new secrets:
   - **Key**: `STRIPE_SECRET_KEY` **Value**: Your secret key (starts with `sk_`)
   - **Key**: `VITE_STRIPE_PUBLIC_KEY` **Value**: Your publishable key (starts with `pk_`)

## Step 4: Test the Integration

1. After adding the secrets, your application will automatically restart
2. Register as a service provider (business user)
3. Visit the "Find Leads" page from the navigation
4. Try purchasing a lead with a test card number

### Test Card Numbers

For testing payments, use these card numbers:
- **Success**: `4242424242424242`
- **Declined**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

Use any future expiry date (like 12/34) and any 3-digit CVC.

## Step 5: Go Live (When Ready)

1. Complete your Stripe account setup fully
2. Replace test keys with live keys in your secrets
3. Start accepting real payments!

## Troubleshooting

**"Stripe not configured" error**: Make sure both secrets are added correctly and the application has restarted.

**Payment fails**: Check that you're using valid test card numbers and that your keys are correct.

**Keys not working**: Verify you copied the full key including the `pk_` or `sk_` prefix.

## Important Notes

- Start with test keys (they contain `test` in the name)
- Test keys only work with test card numbers
- Live keys process real money - only use when ready for production
- Never share your secret key or commit it to version control

Your marketplace is now ready to process payments securely through Stripe!