-- Reporting modules: action points, BI dashboards, courses, assessments

CREATE TABLE IF NOT EXISTS action_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  "dueDate" TIMESTAMP,
  "assignedTo" VARCHAR(255) NOT NULL,
  "createdBy" VARCHAR(255) NOT NULL,
  "closureAssignedTo" VARCHAR(255),
  "triggerType" VARCHAR(50) DEFAULT 'manual',
  "submissionId" VARCHAR(255),
  "questionId" VARCHAR(255),
  "workflowType" VARCHAR(50),
  "workflowId" VARCHAR(255),
  "storeId" VARCHAR(255),
  "autoTriggerConfig" JSONB,
  attachments JSONB,
  comments JSONB,
  "completedAt" TIMESTAMP,
  "closedAt" TIMESTAMP,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB,
  "includeActionPoints" BOOLEAN DEFAULT FALSE,
  "ticketType" VARCHAR(50),
  "processIds" TEXT DEFAULT '',
  "ownerIds" TEXT DEFAULT '',
  "assigneeIds" TEXT DEFAULT '',
  "readOnlyAssigneeIds" TEXT DEFAULT '',
  "chartsCount" INTEGER DEFAULT 0,
  "organizationId" VARCHAR(255) NOT NULL,
  "lastModifiedBy" VARCHAR(255),
  "createdBy" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  "chartType" VARCHAR(50) NOT NULL,
  config JSONB,
  data JSONB,
  "positionX" INTEGER DEFAULT 0,
  "positionY" INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  "dashboardId" UUID NOT NULL REFERENCES bi_dashboards(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryName" VARCHAR(100) NOT NULL,
  description TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  "categoryId" UUID REFERENCES course_categories(id),
  content JSONB,
  "quizId" JSONB,
  status VARCHAR(50) DEFAULT 'published',
  "assigneeProfiles" JSONB,
  "publishedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT TRUE,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "courseId" UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  "userId" VARCHAR(255) NOT NULL,
  progress INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'not_started',
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "quizScore" JSONB,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  questions JSONB,
  "passingScore" INTEGER DEFAULT 70,
  duration INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'published',
  "assigneeProfiles" JSONB,
  "publishedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "allowRetake" BOOLEAN DEFAULT FALSE,
  "maxAttempts" INTEGER DEFAULT 1,
  "isActive" BOOLEAN DEFAULT TRUE,
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessmentId" UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  "userId" VARCHAR(255) NOT NULL,
  answers JSONB,
  score INTEGER DEFAULT 0,
  percentage INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'completed',
  "attemptNumber" INTEGER DEFAULT 1,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "endedAt" TIMESTAMP,
  "timeTaken" INTEGER,
  "storeId" VARCHAR(255),
  "userEmail" VARCHAR(255),
  "organizationId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_points_org ON action_points("organizationId");
CREATE INDEX IF NOT EXISTS idx_bi_dashboards_org ON bi_dashboards("organizationId");
CREATE INDEX IF NOT EXISTS idx_courses_org ON courses("organizationId");
CREATE INDEX IF NOT EXISTS idx_assessments_org ON assessments("organizationId");
CREATE INDEX IF NOT EXISTS idx_assessment_results_org ON assessment_results("organizationId");
