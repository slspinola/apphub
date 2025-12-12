# Database Connection Troubleshooting

## Issue: Cannot reach database server

If you encounter the error:
```
Can't reach database server at `db.xxxxx.supabase.co:6543`
```

## Common Causes and Solutions

### 1. Supabase Database is Paused (Most Common)

**Free tier Supabase databases pause after 1 week of inactivity.**

**Solution:**
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. If the database is paused, you'll see a "Resume" button
4. Click "Resume" to wake up the database
5. Wait 1-2 minutes for the database to fully start
6. Try running the script again

### 2. Network/Firewall Issues

**Check if you can reach the database:**
- Verify your internet connection
- Check if a VPN or firewall is blocking the connection
- Try accessing the Supabase dashboard to confirm the project is accessible

### 3. Incorrect Database Credentials

**Verify your `.env` file contains correct credentials:**
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

**To get correct credentials:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the connection strings
3. Update your `.env` file

### 4. Use Direct Connection for Scripts

If the pooled connection (port 6543) doesn't work, you can temporarily use the direct connection:

**Option A: Update DATABASE_URL temporarily**
```env
# Temporarily use DIRECT_URL for scripts
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

**Option B: Use DIRECT_URL in Prisma**
The Prisma schema supports both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct). 
For migrations and scripts, Prisma will use `DIRECT_URL` when available.

### 5. Verify Database is Running

**Test the connection:**
```bash
# Test if the script can connect
npx tsx check_db.ts
```

If `check_db.ts` works but `create_super_admin.ts` doesn't, the issue is specific to the script.

## Quick Fix Checklist

- [ ] Check Supabase dashboard - is database paused?
- [ ] Resume database if paused
- [ ] Verify `.env` file exists and contains DATABASE_URL
- [ ] Check internet connection
- [ ] Try running `npx tsx check_db.ts` to test connection
- [ ] Verify database credentials in Supabase dashboard
- [ ] Wait 1-2 minutes after resuming database before retrying

## After Fixing

Once the database is accessible, run:
```bash
npx tsx create_super_admin.ts
```

This will create the super administrator user with:
- Email: `spinola.development@outlook.com`
- Password: `qwerty123456`
- Role: `system_admin`


