BEGIN;

-- Get the public_id first
WITH user_to_delete AS (
  SELECT public_id FROM accounts 
  WHERE first_name = 'Jane' AND last_name = 'Smith'
)
DELETE FROM attendance WHERE account_public_id IN (SELECT public_id FROM user_to_delete);

WITH user_to_delete AS (
  SELECT public_id FROM accounts 
  WHERE first_name = 'Jane' AND last_name = 'Smith'
)
DELETE FROM faces WHERE account_public_id IN (SELECT public_id FROM user_to_delete);

WITH user_to_delete AS (
  SELECT public_id FROM accounts 
  WHERE first_name = 'Jane' AND last_name = 'Smith'
)
DELETE FROM sessions WHERE account_public_id IN (SELECT public_id FROM user_to_delete);

WITH user_to_delete AS (
  SELECT public_id FROM accounts 
  WHERE first_name = 'Jane' AND last_name = 'Smith'
)
DELETE FROM leaves WHERE account_public_id IN (SELECT public_id FROM user_to_delete);

DELETE FROM accounts WHERE first_name = 'Jane' AND last_name = 'Smith';

COMMIT;
