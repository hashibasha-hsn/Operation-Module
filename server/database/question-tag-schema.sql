-- Question Tag Schema for Hashi Basha
-- PostgreSQL port: 5432, Password: Rasika

-- Connect to the user database
\c hashibasha_user;

-- Create question_tags table
CREATE TABLE IF NOT EXISTS question_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tagName" VARCHAR(100) NOT NULL,
    "values" TEXT[] DEFAULT '{}',
    "isActive" BOOLEAN DEFAULT true,
    "organizationId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for organizationId for better query performance
CREATE INDEX IF NOT EXISTS idx_question_tags_organizationId ON question_tags("organizationId");

-- Create index for tagName for search functionality
CREATE INDEX IF NOT EXISTS idx_question_tags_tagName ON question_tags("tagName");

-- Display created table
\d question_tags;
