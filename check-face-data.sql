-- Quick SQL script to check face data consistency across companies

-- Find users with same email but different companies
SELECT 
    email,
    COUNT(*) as company_count,
    STRING_AGG(company_id, ', ') as companies,
    STRING_AGG(first_name || ' ' || COALESCE(last_name, ''), ', ') as names,
    STRING_AGG(
        CASE 
            WHEN label_face_descriptors_string IS NOT NULL AND label_face_descriptors_string != '{}' 
            THEN 'HAS_FACE' 
            ELSE 'NO_FACE' 
        END, 
        ', '
    ) as face_status
FROM accounts 
WHERE role = 'user'
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- Check specific user face data consistency
SELECT 
    public_id,
    email,
    company_id,
    first_name,
    last_name,
    CASE 
        WHEN label_face_descriptors_string IS NOT NULL AND label_face_descriptors_string != '{}' 
        THEN 'HAS_FACE_DATA' 
        ELSE 'NO_FACE_DATA' 
    END as face_status,
    LENGTH(label_face_descriptors_string) as descriptor_length
FROM accounts 
WHERE email IN (
    SELECT email 
    FROM accounts 
    WHERE role = 'user'
    GROUP BY email 
    HAVING COUNT(*) > 1
)
ORDER BY email, company_id;