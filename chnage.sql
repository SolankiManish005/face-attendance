root@ananta-food:~/face-attendance# npm run load-env -- tsx update-bio-ids.ts

> hono-node-starter@1.0.0 load-env
> dotenv -e .env.local -- tsx update-bio-ids.ts

info: Connected to database {"dbTime":"2025-07-03T04:56:41.057Z","timestamp":"2025-07-03T04:56:41.060Z"}
debug: DB Query Escaped: select "id" from "accounts" where "accounts"."bio_id" is null {"timestamp":"2025-07-03T04:56:41.079Z"}
Found 15 users with null bio_id
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601094, "bio_id" = 'BIO1751518601094ZBKHQ' where "accounts"."id" = 15 {"timestamp":"2025-07-03T04:56:41.098Z"}
Updated user 15 with bio_id: BIO1751518601094ZBKHQ
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601107, "bio_id" = 'BIO1751518601106W00SB' where "accounts"."id" = 3 {"timestamp":"2025-07-03T04:56:41.109Z"}
Updated user 3 with bio_id: BIO1751518601106W00SB
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601111, "bio_id" = 'BIO1751518601111JWHJ0' where "accounts"."id" = 16 {"timestamp":"2025-07-03T04:56:41.113Z"}
Updated user 16 with bio_id: BIO1751518601111JWHJ0
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601114, "bio_id" = 'BIO1751518601114K2P4D' where "accounts"."id" = 9 {"timestamp":"2025-07-03T04:56:41.116Z"}
Updated user 9 with bio_id: BIO1751518601114K2P4D
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601117, "bio_id" = 'BIO1751518601117ATNNF' where "accounts"."id" = 11 {"timestamp":"2025-07-03T04:56:41.120Z"}
Updated user 11 with bio_id: BIO1751518601117ATNNF
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601121, "bio_id" = 'BIO17515186011213GE70' where "accounts"."id" = 12 {"timestamp":"2025-07-03T04:56:41.123Z"}
Updated user 12 with bio_id: BIO17515186011213GE70
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601124, "bio_id" = 'BIO1751518601124B5P6E' where "accounts"."id" = 13 {"timestamp":"2025-07-03T04:56:41.125Z"}
Updated user 13 with bio_id: BIO1751518601124B5P6E
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601127, "bio_id" = 'BIO17515186011274RQGX' where "accounts"."id" = 14 {"timestamp":"2025-07-03T04:56:41.128Z"}
Updated user 14 with bio_id: BIO17515186011274RQGX
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601130, "bio_id" = 'BIO1751518601130RFHPS' where "accounts"."id" = 19 {"timestamp":"2025-07-03T04:56:41.131Z"}
Updated user 19 with bio_id: BIO1751518601130RFHPS
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601133, "bio_id" = 'BIO17515186011320J4JQ' where "accounts"."id" = 20 {"timestamp":"2025-07-03T04:56:41.134Z"}
Updated user 20 with bio_id: BIO17515186011320J4JQ
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601135, "bio_id" = 'BIO175151860113560QES' where "accounts"."id" = 21 {"timestamp":"2025-07-03T04:56:41.136Z"}
Updated user 21 with bio_id: BIO175151860113560QES
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601138, "bio_id" = 'BIO1751518601138A3QEK' where "accounts"."id" = 17 {"timestamp":"2025-07-03T04:56:41.140Z"}
Updated user 17 with bio_id: BIO1751518601138A3QEK
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601142, "bio_id" = 'BIO1751518601142Q0DEW' where "accounts"."id" = 18 {"timestamp":"2025-07-03T04:56:41.143Z"}
Updated user 18 with bio_id: BIO1751518601142Q0DEW
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601145, "bio_id" = 'BIO17515186011450PU9D' where "accounts"."id" = 22 {"timestamp":"2025-07-03T04:56:41.145Z"}
Updated user 22 with bio_id: BIO17515186011450PU9D
debug: DB Query Escaped: update "accounts" set "updated_at" = 1751518601147, "bio_id" = 'BIO17515186011479BGEY' where "accounts"."id" = 2 {"timestamp":"2025-07-03T04:56:41.148Z"}
Updated user 2 with bio_id: BIO17515186011479BGEY
All null bio_id values updated successfully

