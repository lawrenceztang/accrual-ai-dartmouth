# Stripe Journal Automation

A Next.js application that automates the creation of journal entries from Stripe transactions with configurable program mappings and Excel export capabilities.

## Features

- 🔄 **Automatic Stripe Syncing**: Fetches transactions from Stripe API with program names from custom fields
- 📊 **Program Mapping System**: Configure debit and credit account codes for each program
- 📈 **Double-Entry Bookkeeping**: Automatic creation of balanced journal entries
- 📑 **Excel Export**: Download journal entries in Excel format for accounting systems
- 🎯 **Batch Processing**: Review and approve journal entries before completion
- ⚡ **Real-time Dashboard**: Monitor transaction processing and batch status

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe API
- **Exports**: Excel (XLSX)

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accrual-ai-dartmouth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment to Vercel

### Automatic Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

3. **Set Environment Variables**
   In your Vercel project dashboard:
   - Go to Settings → Environment Variables
   - Add the following variables:
     - `STRIPE_SECRET_KEY` → Your Stripe secret key
     - `NEXT_PUBLIC_SUPABASE_URL` → Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Your Supabase anon key

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Your app will be available at `https://your-project.vercel.app`

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add STRIPE_SECRET_KEY
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Usage Workflow

### 1. Configure Program Mappings

1. Navigate to "Manage Program Mappings"
2. Click "Add New Mapping"
3. Enter the program name from your Stripe transactions
4. Configure separate debit and credit account codes:
   - **Debit Entry**: Cash/Bank account codes
   - **Credit Entry**: Revenue account codes
5. Save the mapping

### 2. Process Transactions

1. **Automatic Sync**: Transactions are automatically synced when you visit the dashboard
2. **Create Journal Entry**: Click "Create Journal Entry" to process pending transactions
3. **Review Batch**: Review the current journal entry batch details
4. **Download Excel**: Click "Download Excel" to get the journal entries file
5. **Upload to Accounting System**: Import the Excel file into your accounting system
6. **Mark Complete**: Click "Journal Entry Uploaded" when done

### 3. Monitor Progress

The dashboard displays:
- Pending transactions waiting for journal entry creation
- Current journal entry batch with transaction count and total amount
- Completed journal entry batches
- Warning alerts for unmapped programs

## API Endpoints

- `POST /api/sync-transactions` - Sync transactions from Stripe
- `POST /api/create-journal-batch` - Create journal entry batch
- `GET /api/download-batch-excel` - Download Excel file
- `POST /api/complete-journal-batch` - Mark batch as complete
- `POST /api/cancel-journal-batch` - Cancel batch

## Database Schema

### program_mappings
- Stores the mapping between program names and journal entry fields

### stripe_transactions
- Stores synced Stripe transaction data

### journal_entries
- Stores generated journal entries with Oracle upload status

## Stripe Integration Details

The application looks for program names in the following order:
1. Payment Intent metadata (`program_name`)
2. Charge metadata (`program_name`)
3. Checkout Session custom field (`checkout_custom_field_1_value`)

## Error Handling

- Missing environment variables are validated at startup
- API errors are logged and displayed to users
- Database connection issues are handled gracefully
- Stripe API rate limiting is respected
- Oracle API failures are tracked per journal entry

## Security Considerations

- All API keys are stored in environment variables
- Supabase Row Level Security is enabled
- Input validation on all forms
- Error messages don't expose sensitive information

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **Stripe transactions not syncing**: Check Stripe API key and webhook configuration
2. **Program mappings not working**: Ensure program names match exactly between Stripe and mappings
3. **Oracle upload failures**: Verify Oracle API URL and authentication
4. **Database connection issues**: Check Supabase credentials and network connectivity

### Logs

Check the browser console and server logs for detailed error messages.
