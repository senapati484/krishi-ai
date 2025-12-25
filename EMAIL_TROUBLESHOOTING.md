# Email Verification Troubleshooting

## ✅ Your Email Configuration

Based on your `.env.local`, you have:
- ✅ EMAIL_HOST=smtp.gmail.com
- ✅ EMAIL_PORT=587
- ✅ EMAIL_USER=developersayan01@gmail.com
- ✅ EMAIL_PASS=auwppecnthaxgkgh (App Password)

## 🔧 Common Issues & Solutions

### 1. **Server Not Restarted**
**Problem:** Next.js only reads `.env.local` on server start.

**Solution:**
```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

### 2. **Gmail App Password Issues**
**Problem:** Gmail requires App Passwords for SMTP.

**Solution:**
1. Go to Google Account → Security
2. Enable 2-Step Verification (if not already)
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use that 16-character password (not your regular password)

### 3. **Gmail Security Settings**
**Problem:** Gmail might block "less secure apps"

**Solution:**
- App Passwords bypass this, so make sure you're using an App Password
- Check if "Less secure app access" is enabled (though App Passwords should work regardless)

### 4. **Check Server Logs**
When you click "Verify", check your terminal/console for:
- `✅ Email transporter verified successfully` - Connection OK
- `❌ Email transporter verification failed` - Connection issue
- `✅ Verification code sent to email` - Email sent successfully
- `❌ Error sending verification email` - Sending failed

### 5. **Development Mode**
In development, the code is shown in:
- Browser console: `[DEV MODE] Verification code: XXXXXX`
- Alert popup (if email fails)
- API response (check Network tab)

## 🧪 Testing Steps

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Check terminal logs** when clicking "Verify"

3. **Check browser console** for any errors

4. **Check Network tab** in browser DevTools:
   - Look for `/api/auth/verify-email` request
   - Check the response for error details

5. **Try sending a test email manually:**
   ```bash
   node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
     auth: {
       user: 'developersayan01@gmail.com',
       pass: 'auwppecnthaxgkgh'
     }
   });
   transporter.verify().then(() => console.log('✅ Connected')).catch(e => console.error('❌', e));
   "
   ```

## 📧 Email Should Arrive In:
- **Inbox** (usually within 1-2 minutes)
- **Spam/Junk folder** (check here too!)
- **Promotions tab** (if using Gmail tabs)

## 🔍 Debug Information

The code now logs:
- Email configuration status (without showing password)
- Transporter verification result
- Email sending result
- Detailed error messages

Check your server terminal for these logs when testing.

