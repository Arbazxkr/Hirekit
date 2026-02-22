import re

with open('server/supabase-schema.sql', 'r') as f:
    schema = f.read()

if "username TEXT" not in schema:
    schema = schema.replace(
        "avatar_url TEXT,", 
        "avatar_url TEXT,\n  username TEXT,"
    )

with open('server/supabase-schema.sql', 'w') as f:
    f.write(schema)

with open('server/src/services/database.ts', 'r') as f:
    db = f.read()

db = db.replace('name: string;', 'name: string;\n    username?: string;\n    avatar_url?: string;')

with open('server/src/services/database.ts', 'w') as f:
    f.write(db)

