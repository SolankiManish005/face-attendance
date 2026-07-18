# Face Attendance System - API Changes Documentation

## Overview
This document outlines all the changes made to the Face Attendance System APIs, including new features, modifications, and testing procedures.

## 🔄 Changes Made

### 1. Database Schema Updates
- **Added `bioId` field**: Auto-generated unique biometric identifier
- **Added `companyId` field**: Company association for employees
- **Auto-generation**: `bioId` automatically creates unique IDs like `BIO1731234567890ABC12`

### 2. Employee Registration API Changes
**API**: `POST /v1/admin.addUserWithFaceImages`

**New Fields Added**:
- `bioId` (optional) - Biometric identifier
- `companyId` (optional) - Company identifier

**Changes**:
- Both fields are optional in the request
- `bioId` auto-generates if not provided
- Both fields are saved to database and returned in response

### 3. Employee Listing API Changes
**API**: `GET /v1/admin.listAllUserAccount`

**New Features**:
- **Company Filtering**: Added `companyId` query parameter
- **Data Isolation**: Only returns employees from specified company
- **Response Enhancement**: Includes `companyId` and `bioId` in response

### 4. Attendance APIs Enhanced
**APIs Updated**:
- `GET /v1/admin.listLatestAttendanceForAllUser`
- `GET /v1/admin.listLatestAttendanceForUserByPublicId`
- `GET /v1/admin.getUserAttendanceReportByType`

**Changes**:
- All attendance responses now include `bioId` field
- Better integration with biometric systems

### 5. Cron Job Schedule Update
**Change**: Updated from every 10 seconds to every 2 hours
- **Before**: `*/10 * * * * *` (development)
- **After**: `0 */2 * * *` (production)

---

## 🧪 Testing Guide

### Prerequisites
1. **Admin Authentication**: You need admin credentials to test most APIs
2. **Base URL**: Replace `{BASE_URL}` with your server URL (e.g., `http://localhost:3000`)
3. **Tools**: Use Postman, curl, or any API testing tool

### Step 1: Admin Login
**Purpose**: Get authentication token for API access

**Default Admin Credentials** (auto-created on first login attempt):
- Email: `admin@admin.com`
- Password: `admin@123456`

```bash
POST {BASE_URL}/v1/auth.adminSignInWithEmailAndPassword
Content-Type: application/json

{
  "email": "admin@admin.com",
  "password": "admin@123456"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "u": {
      "id": 1,
      "publicId": "account_xyz123",
      "email": "admin@admin.com",
      "firstName": "Admin",
      "lastName": "Admin",
      "role": "admin"
    },
    "accessToken": "your_auth_token_here"
  }
}
```

**Save the accessToken** - you'll need it for all subsequent API calls as `Bearer {accessToken}`.

### Step 2: Test Employee Registration (Enhanced)
**Purpose**: Test new bioId and companyId fields

```bash
POST {BASE_URL}/v1/admin.addUserWithFaceImages
Authorization: Bearer your_auth_token_here
Content-Type: multipart/form-data

Form Data:
- file: [Upload 2+ face images]
- firstName: "John"
- lastName: "Doe"
- email: "john.doe@company.com"
- mobile: "+1234567890"
- dob: "1990-01-01"
- bloodGroup: "A+"
- designation: "Software Engineer"
- department: "IT"
- companyId: "COMP001"
- bioId: "BIO123" (optional - will auto-generate if not provided)
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "userData": {
      "id": 1,
      "publicId": "account_xyz123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com",
      "bioId": "BIO123",
      "companyId": "COMP001",
      "faces": [...]
    }
  }
}
```

### Step 3: Test Auto-Generated bioId
**Purpose**: Verify bioId auto-generation

```bash
POST {BASE_URL}/v1/admin.addUserWithFaceImages
Authorization: Bearer your_auth_token_here
Content-Type: multipart/form-data

Form Data:
- file: [Upload 2+ face images]
- firstName: "Jane"
- lastName: "Smith"
- email: "jane.smith@company.com"
- mobile: "+1234567891"
- dob: "1992-05-15"
- bloodGroup: "B+"
- designation: "Designer"
- department: "Creative"
- companyId: "COMP002"
- (DO NOT include bioId - let it auto-generate)
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "userData": {
      "bioId": "BIO1731234567890ABC12", // Auto-generated
      "companyId": "COMP002"
    }
  }
}
```

### Step 4: Test Employee Listing (All Employees)
**Purpose**: List all employees without filtering

```bash
GET {BASE_URL}/v1/admin.listAllUserAccount
Authorization: Bearer your_auth_token_here
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "publicId": "account_xyz123",
        "firstName": "John",
        "lastName": "Doe",
        "bioId": "BIO123",
        "companyId": "COMP001",
        "department": "IT",
        "faces": [...]
      },
      {
        "publicId": "account_abc456",
        "firstName": "Jane",
        "lastName": "Smith",
        "bioId": "BIO1731234567890ABC12",
        "companyId": "COMP002",
        "department": "Creative",
        "faces": [...]
      }
    ]
  }
}
```

### Step 5: Test Company Filtering
**Purpose**: Test data isolation by company

```bash
GET {BASE_URL}/v1/admin.listAllUserAccount?companyId=COMP001
Authorization: Bearer your_auth_token_here
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "publicId": "account_xyz123",
        "firstName": "John",
        "lastName": "Doe",
        "bioId": "BIO123",
        "companyId": "COMP001"
      }
      // Only employees from COMP001 should appear
    ]
  }
}
```

### Step 6: Test Attendance with bioId
**Purpose**: Verify bioId appears in attendance records

First, create some attendance records (employees need to check in):

```bash
POST {BASE_URL}/v1/admin.userCheckInOrCheckOutWithFace
Authorization: Bearer your_auth_token_here
Content-Type: multipart/form-data

Form Data:
- file: [Upload face image for recognition]
```

Then check attendance:

```bash
GET {BASE_URL}/v1/admin.listLatestAttendanceForAllUser
Authorization: Bearer your_auth_token_here
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "accountPublicId": "account_xyz123",
        "firstName": "John",
        "lastName": "Doe",
        "bioId": "BIO123",
        "department": "IT",
        "checkInDate": "2024-01-15",
        "checkInTime": "09:00:00",
        "checkOutTime": "17:30:00",
        "duration": "8 hours 30 minutes"
      }
    ]
  }
}
```

### Step 7: Test Attendance Reports with bioId
**Purpose**: Verify bioId in attendance reports

```bash
GET {BASE_URL}/v1/admin.getUserAttendanceReportByType?reportType=daily&accountPublicId=account_xyz123
Authorization: Bearer your_auth_token_here
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "type": "daily",
    "report": [
      {
        "publicId": "account_xyz123",
        "firstName": "John",
        "lastName": "Doe",
        "bioId": "BIO123",
        "workDate": "2024-01-15",
        "totalEntries": 1,
        "totalHoursWorked": 8.5
      }
    ]
  }
}
```

---

## 🔍 Testing Scenarios

### Scenario 1: Multi-Company Setup
1. Create employees with different `companyId` values
2. Test filtering by each company
3. Verify data isolation works correctly

### Scenario 2: bioId Auto-Generation
1. Create employee without providing `bioId`
2. Verify unique `bioId` is generated
3. Create another employee and verify different `bioId`

### Scenario 3: Attendance Tracking
1. Register employees with `bioId`
2. Record attendance using face recognition
3. Check attendance reports include `bioId`

### Scenario 4: Backward Compatibility
1. Test existing functionality still works
2. Verify optional fields don't break existing flows

---

## 🚨 Common Issues & Solutions

### Issue 1: Route Not Found (404)
**Problem**: Getting "ROUTE_NOT_FOUND" error
**Solution**: 
- Ensure the server is running
- Check the correct base URL
- Verify the endpoint path is exactly: `/v1/auth.adminSignInWithEmailAndPassword`
- Try accessing the API documentation at `{BASE_URL}/docs`

### Issue 2: Authentication Failed
**Problem**: Getting 401 Unauthorized
**Solution**: 
- Use default credentials: `admin@admin.com` / `admin@123456`
- Ensure you're using the correct admin token from login
- Use `Bearer {accessToken}` format in Authorization header

### Issue 2: File Upload Failed
**Problem**: Employee registration fails with file error
**Solution**: Ensure you're uploading at least 2 face images in supported formats (JPEG, PNG, WebP)

### Issue 3: Face Not Detected
**Problem**: Getting "Face not detected" error
**Solution**: Use clear face images with good lighting and single person per image

### Issue 4: Company Filter Not Working
**Problem**: Getting all employees instead of filtered ones
**Solution**: Ensure `companyId` parameter is correctly spelled and has valid value

---

## 📋 API Reference Summary

| API Endpoint | Method | Changes Made | New Parameters |
|--------------|--------|--------------|----------------|
| `/v1/admin.addUserWithFaceImages` | POST | Added bioId, companyId fields | `bioId`, `companyId` |
| `/v1/admin.listAllUserAccount` | GET | Added company filtering, bioId in response | `companyId` (query) |
| `/v1/admin.listLatestAttendanceForAllUser` | GET | Added bioId in response | None |
| `/v1/admin.listLatestAttendanceForUserByPublicId` | GET | Added bioId in response | None |
| `/v1/admin.getUserAttendanceReportByType` | GET | Added bioId in response | None |

---

## 🎯 Success Criteria

Your testing is successful if:
- ✅ Employees can be created with optional `bioId` and `companyId`
- ✅ `bioId` auto-generates when not provided
- ✅ Company filtering returns only relevant employees
- ✅ All attendance APIs include `bioId` in responses
- ✅ Existing functionality continues to work
- ✅ Cron job runs every 2 hours instead of every 10 seconds

---

## 📞 Support

If you encounter issues during testing:
1. Check the server logs for detailed error messages
2. Verify all required fields are provided
3. Ensure proper authentication tokens are used
4. Confirm file uploads meet the requirements (2+ images, supported formats)

---

*Last Updated: $(date)*
*Version: 1.0*