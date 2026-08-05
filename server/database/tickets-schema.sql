-- Issue Tickets module schema (hashibasha_org)

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  "dueDate" TIMESTAMP,
  "storeId" VARCHAR(255) NOT NULL,
  "assignedTo" VARCHAR(255) NOT NULL,
  "createdBy" VARCHAR(255) NOT NULL,
  "assignedTeamId" VARCHAR(255),
  "categoryId" VARCHAR(255),
  "assetId" VARCHAR(255),
  "ticketType" VARCHAR(50) NOT NULL DEFAULT 'custom',
  tags JSONB,
  attachments JSONB,
  comments JSONB,
  costs JSONB,
  "closureAnswers" JSONB,
  "claimedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "closedAt" TIMESTAMP,
  "actionHistory" JSONB,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets("organizationId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets("assignedTo");
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets("createdBy");
CREATE INDEX IF NOT EXISTS idx_tickets_store ON tickets("storeId");

CREATE TABLE IF NOT EXISTS ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tagName" VARCHAR(100) NOT NULL,
  "tagType" VARCHAR(50) NOT NULL DEFAULT 'ticket',
  "tagValues" JSONB,
  "isMandatory" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_tags_org ON ticket_tags("organizationId");

CREATE TABLE IF NOT EXISTS auto_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryName" VARCHAR(100) NOT NULL,
  "parentId" VARCHAR(255),
  "assigneeIds" JSONB,
  "teamIds" JSONB,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  "dueDateConfig" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_ticket_categories_org ON auto_ticket_categories("organizationId");
CREATE INDEX IF NOT EXISTS idx_auto_ticket_categories_parent ON auto_ticket_categories("parentId");

CREATE TABLE IF NOT EXISTS ticket_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleType" VARCHAR(50) NOT NULL,
  "targetStatuses" JSONB,
  "daysAfter" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_rules_org ON ticket_rules("organizationId");

CREATE TABLE IF NOT EXISTS ticket_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" VARCHAR(255) NOT NULL UNIQUE,
  "attachmentMandatory" BOOLEAN NOT NULL DEFAULT FALSE,
  "disableTicketDelete" BOOLEAN NOT NULL DEFAULT FALSE,
  "hidePriorities" BOOLEAN NOT NULL DEFAULT FALSE,
  "priorityLevels" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_closure_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "questionText" VARCHAR(500) NOT NULL,
  "questionType" VARCHAR(50) NOT NULL DEFAULT 'text',
  options JSONB,
  "isRequired" BOOLEAN NOT NULL DEFAULT TRUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_closure_questions_org ON ticket_closure_questions("organizationId");
