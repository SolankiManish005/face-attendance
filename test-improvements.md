# Testing Face Handling Improvements

## Quick Database Check

Run this SQL to check current face data status:

```bash
# Connect to your database and run:
psql -d your_database -f check-face-data.sql
```

## Manual Testing Steps

### 1. Test Current State
```bash
# Check existing users with multiple companies
SELECT email, COUNT(*) as companies, 
       STRING_AGG(company_id, ', ') as company_list
FROM accounts 
WHERE role = 'user' 
GROUP BY email 
HAVING COUNT(*) > 1;
```

### 2. Test Face Recognition
Use your existing API calls:

**Check-in with Company 1:**
```bash
curl -X POST /v1/admin.userCheckInOrCheckOutWithFace \
  -F "file=@face_image.jpg" \
  -F "companyId=663b510d3506f4bd299f6dd8" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check-in with Company 2:**
```bash
curl -X POST /v1/admin.userCheckInOrCheckOutWithFace \
  -F "file=@face_image.jpg" \
  -F "companyId=6548b3257b3e79ab6ec57b0f" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Expected Results

**✅ Success Case (User registered with company):**
```json
{
  "success": true,
  "data": {
    "matched": true,
    "userDetails": { ... },
    "isCheckIn": true,
    "companyId": "6548b3257b3e79ab6ec57b0f"
  }
}
```

**✅ Improved Case (User not registered with company):**
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

## Key Improvements Implemented

1. **Face Data Preservation** - Face descriptors preserved when registering with new companies
2. **Company Validation** - Clear feedback when user tries wrong company
3. **Consistent Recognition** - Same face works across all registered companies

## Verification Commands

```sql
-- Check face data consistency
SELECT 
    email,
    company_id,
    CASE 
        WHEN label_face_descriptors_string IS NOT NULL 
        AND label_face_descriptors_string != '{}' 
        THEN 'HAS_FACE' 
        ELSE 'NO_FACE' 
    END as status
FROM accounts 
WHERE email = 'user@example.com'
ORDER BY company_id;
```