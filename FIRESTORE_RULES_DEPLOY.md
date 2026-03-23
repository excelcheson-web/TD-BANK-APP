# 🔥 DEPLOY FIRESTORE RULES NOW

## The Problem
Your admin panel shows "Missing or insufficient permissions" because the Firestore security rules are blocking reads.

## The Solution
You MUST deploy the updated rules to Firebase.

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Go to Firebase Console
Open this URL in your browser:
```
https://console.firebase.google.com/project/td-project-pro/firestore/rules
```

### Step 2: Replace the Rules
1. **Delete ALL text** in the rules editor
2. **Copy and paste** the rules below (exactly as shown)
3. Click **PUBLISH** (blue button)

---

## 📝 COMPLETE FIRESTORE RULES TO COPY

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

    // PROFILES COLLECTION - This is what fixes the admin panel
    match /profiles/{userId} {
      // ANY logged-in user can read all profiles (needed for admin)
      allow read: if isAuthenticated();
      
      // Users can only create their own profile
      allow create: if isAuthenticated() && isOwner(userId);
      
      // Users can update their own profile, admins can update any
      allow update: if isAuthenticated() && (
        isOwner(userId) || 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true
      );
      
      allow delete: if false;
      
      // Transactions subcollection
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

    // Users collection
    match /users/{userId} {
      allow read, create, update: if isAuthenticated() && isOwner(userId);
      allow delete: if false;
    }

    // Legacy transactions
    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || resource.data.recipientId == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }

    // Admin collection
    match /admin/{document=**} {
      allow read, write: if isAuthenticated() && 
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ VERIFICATION

After clicking **PUBLISH**:

1. Wait **30 seconds** for rules to propagate
2. Go to your admin panel: `https://login-tdpay.net/admin-portal-99.html`
3. Click **"🔄 Refresh Users"**
4. Users should now appear!

---

## 🚨 IMPORTANT

**The key change is:**
```javascript
// OLD (blocking admin):
allow read: if isAuthenticated() && isOwner(userId);

// NEW (allowing admin):
allow read: if isAuthenticated();
```

This allows any logged-in user to read all profiles, which is required for the admin panel to function.

---

## 📞 If It Still Doesn't Work

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Click **"🔄 Refresh Users"**
4. Screenshot any error messages
5. Check that you're logged in to a user account before accessing admin
