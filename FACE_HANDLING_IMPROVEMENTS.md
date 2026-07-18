# Face Handling Improvements for Multi-Company Support

## Problem Identified
When a user registers their face with Company 1 and later registers with Company 2, the face data from Company 1 gets removed, causing check-in failures for Company 1.

## Root Causes
1. **Global Face Storage**: Face descriptors stored globally by user publicId, not per company
2. **Overwriting Face Data**: New registrations overwrite existing face descriptors
3. **Insufficient Company Validation**: Check-in API doesn't properly validate company association

## Solutions Implemented

### 1. Enhanced Check-in Validation
**File**: `src/routes/admin/v1_api_user_check_in_or_check_out_with_face.ts`

```typescript
// Before: Commented out company validation
// if (!userDetails) {
//   return errorResponse(c, "BAD_REQUEST", "User not found in your company");
// }

// After: Proper company validation with informative response
if (!userDetails) {
  return c.json({ 
    success: true, 
    data: { 
      matched: false, 
      reason: "User not registered with this company",
      faceMatch: {
        label: faceMatch.label,
        distance: faceMatch.distance,
      }
    } 
  }, 200);
}
```

### 2. Face Data Preservation
**File**: `src/routes/admin/v1_api_add_user_with_face_images.ts`

```typescript
// Check if user already exists with this email in any company
const existingUserWithEmail = await db.query.accounts.findFirst({
  columns: { publicId: true, email: true, companyId: true, labelFaceDescriptorsString: true },
  where: (accounts, { eq }) => eq(accounts.email, form.email),
});

// Preserve existing face descriptors when registering with new company
let finalLfd;
if (existingUserWithEmail && existingUserWithEmail.labelFaceDescriptorsString && existingUserWithEmail.companyId !== form.companyId) {
  // Use existing face descriptors to preserve face data across companies
  finalLfd = faceApi.loadLabeledFaceDescriptorsFromString(existingUserWithEmail.labelFaceDescriptorsString);
} else {
  // Create new face descriptors
  finalLfd = faceApi.labelFaceDescriptors(user!.publicId, faceApiDescriptors);
}
```

### 3. Enhanced Database Services
**File**: `src/services/database.ts`

```typescript
// New method to check existing users by email across companies
public async getExistingUserByEmail(email: string, excludeCompanyId?: string) {
  return this.db.query.accounts.findFirst({
    columns: {
      publicId: true,
      companyId: true,
      labelFaceDescriptorsString: true,
      firstName: true,
      lastName: true,
    },
    where: (accounts, { eq, and, ne }) => {
      const filters = [eq(accounts.email, email)];
      if (excludeCompanyId) {
        filters.push(ne(accounts.companyId, excludeCompanyId));
      }
      return and(...filters);
    },
  });
}
```

## API Response Improvements

### Check-in/Check-out API Response
```json
{
  "success": true,
  "data": {
    "matched": true,
    "userDetails": {
      "firstName": "jay",
      "lastName": "thummar",
      "department": "DevOps",
      "designation": "Dev",
      "publicId": "acc_01jz7w9182fajb131jh59r1exb",
      "dob": "2025-07-03",
      "bioId": "BIO1751537452345YD5NG",
      "companyId": "6548b3257b3e79ab6ec57b0f"
    },
    "isCheckIn": true,
    "companyId": "6548b3257b3e79ab6ec57b0f",
    "faceMatch": {
      "label": "acc_01jz7w9182fajb131jh59r1exb",
      "distance": 0.16384479821228468
    }
  }
}
```

### When User Not Found in Company
```json
{
  "success": true,
  "data": {
    "matched": false,
    "reason": "User not registered with this company",
    "faceMatch": {
      "label": "acc_01jz7w9182fajb131jh59r1exb",
      "distance": 0.16384479821228468
    }
  }
}
```

## Validation Script
Created `validate-face-handling.ts` to check face data consistency across companies.

**Usage**:
```bash
npx tsx validate-face-handling.ts
```

## Key Benefits
1. **Face Data Preservation**: Users can register with multiple companies without losing face data
2. **Proper Company Validation**: Clear feedback when user tries to check-in with wrong company
3. **Consistent Face Recognition**: Same face works across all registered companies
4. **Better Error Handling**: Informative responses for debugging

## Testing Recommendations
1. Register user with Company A
2. Register same user (same email) with Company B
3. Test check-in with both companies
4. Verify face data consistency using validation script

## Future Enhancements
1. **Company-Specific Face Storage**: Store face descriptors per company for better isolation
2. **Face Data Synchronization**: Automatic sync when user updates face data
3. **Audit Logging**: Track face data changes across companies
4. **Bulk Migration**: Script to fix existing inconsistent face data