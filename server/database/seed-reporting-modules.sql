-- Sample data for reporting modules (organization: default-org)

INSERT INTO course_categories (id, "categoryName", description, "organizationId")
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Compliance', 'Compliance training', 'default-org'),
  ('11111111-1111-1111-1111-111111111102', 'Operations', 'Store operations', 'default-org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (id, title, description, "categoryId", content, status, "publishedAt", "isActive", "organizationId")
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Food Safety Basics', 'Intro to food safety standards', '11111111-1111-1111-1111-111111111101', '[{"type":"video","title":"Module 1"}]', 'published', NOW() - INTERVAL '30 days', TRUE, 'default-org'),
  ('22222222-2222-2222-2222-222222222202', 'Customer Service Excellence', 'Service standards for frontline staff', '11111111-1111-1111-1111-111111111102', '[{"type":"doc","title":"Guide"}]', 'published', NOW() - INTERVAL '14 days', TRUE, 'default-org'),
  ('22222222-2222-2222-2222-222222222203', 'Cash Handling', 'POS and cash management', '11111111-1111-1111-1111-111111111102', '[{"type":"video","title":"POS Training"}]', 'published', NOW() - INTERVAL '7 days', TRUE, 'default-org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_progress (id, "courseId", "userId", progress, status, "startedAt", "completedAt", "organizationId")
VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'admin-user-id', 100, 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', 'default-org'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 'admin-user-id', 65, 'in_progress', NOW() - INTERVAL '5 days', NULL, 'default-org'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', 'admin-user-id', 0, 'not_started', NULL, NULL, 'default-org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessments (id, title, description, "passingScore", duration, status, "publishedAt", "isActive", "organizationId")
VALUES
  ('44444444-4444-4444-4444-444444444401', 'Safety Compliance Quiz', 'Annual safety assessment', 70, 30, 'archived', NOW() - INTERVAL '60 days', FALSE, 'default-org'),
  ('44444444-4444-4444-4444-444444444402', 'Product Knowledge Test', 'Product catalog knowledge', 80, 20, 'archived', NOW() - INTERVAL '30 days', FALSE, 'default-org')
ON CONFLICT (id) DO UPDATE SET status = 'archived', "isActive" = FALSE;

INSERT INTO assessment_results (id, "assessmentId", "userId", score, percentage, passed, status, "attemptNumber", "startedAt", "completedAt", "userEmail", "organizationId")
VALUES
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'admin-user-id', 85, 85, TRUE, 'completed', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'admin@hashibasha.com', 'default-org'),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444402', 'admin-user-id', 72, 72, FALSE, 'completed', 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'admin@hashibasha.com', 'default-org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO action_points (id, title, description, status, priority, "dueDate", "assignedTo", "createdBy", "closureAssignedTo", "triggerType", "storeId", "organizationId")
VALUES
  ('66666666-6666-6666-6666-666666666601', 'Fix refrigeration temperature log', 'Temperature reading out of range during morning check', 'open', 'high', NOW() + INTERVAL '2 days', 'admin-user-id', 'admin-user-id', 'admin-user-id', 'manual', NULL, 'default-org'),
  ('66666666-6666-6666-6666-666666666602', 'Replace expired signage', 'Auto-triggered from non-compliant audit answer', 'in_progress', 'medium', NOW() + INTERVAL '5 days', 'admin-user-id', 'admin-user-id', 'admin-user-id', 'auto', NULL, 'default-org'),
  ('66666666-6666-6666-6666-666666666603', 'Staff training follow-up', 'Complete pending safety module', 'completed', 'low', NOW() - INTERVAL '1 day', 'admin-user-id', 'admin-user-id', 'admin-user-id', 'manual', NULL, 'default-org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bi_dashboards (id, title, type, "includeActionPoints", "chartsCount", "organizationId", "createdBy")
VALUES
  ('77777777-7777-7777-7777-777777777701', 'Process Completion Overview', 'process-workflow', TRUE, 1, 'default-org', 'admin-user-id'),
  ('77777777-7777-7777-7777-777777777702', 'Tickets & Action Points', 'action-point', FALSE, 1, 'default-org', 'admin-user-id')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bi_charts (id, title, "chartType", config, "dashboardId", "positionX", "positionY", width, height)
VALUES
  ('88888888-8888-8888-8888-888888888801', 'Completion Rate', 'kpi', '{"metric":"completion"}', '77777777-7777-7777-7777-777777777701', 0, 0, 2, 1),
  ('88888888-8888-8888-8888-888888888802', 'Open Action Points', 'bar', '{"metric":"open"}', '77777777-7777-7777-7777-777777777702', 0, 0, 2, 1)
ON CONFLICT (id) DO NOTHING;
