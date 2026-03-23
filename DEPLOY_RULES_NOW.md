# 🚨 DEPLOY FIRESTORE RULES - STEP BY STEP

## The Error You're Seeing
```
[adminService] fetchAllUsers error: Missing or insufficient permissions.
```
**This means the Firestore security rules are still blocking access.**

---

## ✅ SOLUTION: Deploy Updated Rules

### Step 1: Open Firebase Console
Click this link or paste in browser:
```
https://console.firebase.google.com/project/td-project-pro/firestore/rules
```

### Step 2: Navigate to Firestore Rules
If the link above doesn't work:
1. Go to https://console.firebase.google.com/
2. Click your project: **td-project-pro**
3. In left sidebar, click **Firestore Database**
4. Click **Rules** tab (next to "Data")

### Step 3: Replace the Rules

**CURRENT RULES (blocking admin):**
```javascript
allow read: if isAuthenticated() && isOwner(userId);
```

**NEW RULES (allowing admin):**
```javascript
allow read: if isAuthenticated();
```

### Step 4: Copy & Paste These Exact Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /profiles/{userId} {
      // KEY FIX: Any logged-in user can read all profiles
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated() && isOwner(userId);
      
      allow update: if isAuthenticated() && (
        isOwner(userId) || 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true
      );
      
      allow delete: if false;
      
      match /transactions/{transactionId} {
        allow read: if isAuthenticated();
        allow create, update: if isAuthenticated() && (
          isOwner(userId) || 
          get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true
        );
        allow delete: if isAuthenticated() && 
          get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
      }
    }

    match /users/{userId} {
      allow read, create, update: if isAuthenticated() && isOwner(userId);
      allow delete: if false;
    }

    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || resource.data.recipientId == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }

    match /admin/{document=**} {
      allow read, write: if isAuthenticated() && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 5: Publish
1. **Delete ALL text** in the rules editor box
2. **Paste** the rules above
3. Click **PUBLISH** (blue button at top)
4. Wait for "Rules published successfully" message

---

## 🔄 VERIFY THE FIX

1. Wait **30 seconds** after publishing
2. Refresh your admin page: `https://login-tdpay.net/admin-portal-99.html`
3. Make sure you're **logged in** to a user account
4. Click **"🔄 Refresh Users"**
5. Users should now appear!

---

## ❌ IF STILL NOT WORKING

Check these common issues:

### Issue 1: Not Logged In
- The admin panel requires authentication
- Log in to a regular user account first
- Then access the admin panel

### Issue 2: Wrong Project
- Make sure you're editing rules for **td-project-pro**
- Check the project name at top of Firebase Console

### Issue 3: Rules Not Saved
- After clicking Publish, refresh the Firebase page
- Verify the new rules are still there
- If not, paste and publish again

### Issue 4: Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open admin panel in Incognito/Private window

---

## 📞 NEED HELP?

If you've followed all steps and it still doesn't work:

1. Screenshot the Firebase Console Rules page
2. Screenshot the browser console error
3. Confirm you clicked the blue **PUBLISH** button

The rules file is also saved at: `c:/Users/HP/Desktop/TD Bank app project/firestore.rules`
