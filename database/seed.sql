-- ============================================================
-- ORGANISATIONSHANDBUCH DEMO DATA
-- Use after running schema.sql
-- ============================================================

USE organisationshandbuch;

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (username, email, full_name, role, is_active)
VALUES
('admin', 'admin@company.com', 'Administrator', 'admin', TRUE),
('editor', 'editor@company.com', 'Erika Editor', 'editor', TRUE),
('viewer', 'viewer@company.com', 'Victor Viewer', 'viewer', TRUE);

-- ============================================================
-- FOLDER STRUCTURE
-- ============================================================
INSERT INTO navigation_items (title, description, type, sort_order, created_by)
VALUES
('Human Resources', 'HR folder containing employee policies', 'folder', 1, 1),
('Information Technology', 'IT procedures and security docs', 'folder', 2, 1),
('Business Processes', 'Folder containing BPMN process definitions', 'folder', 3, 1);

-- ============================================================
-- DOCUMENTS
-- ============================================================
INSERT INTO navigation_items (parent_id, title, description, type, status, created_by)
VALUES
(1, 'Employee Onboarding', 'Guide for welcoming new employees', 'document', 'approved', 2),
(1, 'Vacation Policy', 'Rules for requesting and tracking time off', 'document', 'approved', 2),
(2, 'Password Policy', 'Strong password and rotation rules', 'document', 'approved', 2),
(2, 'Device Usage Policy', 'Acceptable use policy for laptops and phones', 'document', 'in_review', 2),
(3, 'Procurement Process', 'Workflow for purchase approvals', 'process', 'approved', 2);

-- ============================================================
-- DOCUMENT CONTENT
-- ============================================================
INSERT INTO content_blocks (navigation_item_id, content, content_text, created_by)
VALUES
(4, JSON_OBJECT('blocks', JSON_ARRAY(JSON_OBJECT('type','paragraph','data',JSON_OBJECT('text','Welcome to the company! This guide will help you settle in.')))), 'Welcome to the company! This guide will help you settle in.', 2),
(5, JSON_OBJECT('blocks', JSON_ARRAY(JSON_OBJECT('type','paragraph','data',JSON_OBJECT('text','Employees are entitled to 30 days of paid vacation per year.')))), 'Employees are entitled to 30 days of paid vacation per year.', 2),
(6, JSON_OBJECT('blocks', JSON_ARRAY(JSON_OBJECT('type','paragraph','data',JSON_OBJECT('text','Passwords must be at least 12 characters and changed every 90 days.')))), 'Passwords must be at least 12 characters and changed every 90 days.', 2),
(7, JSON_OBJECT('blocks', JSON_ARRAY(JSON_OBJECT('type','paragraph','data',JSON_OBJECT('text','Devices must be encrypted and secured with MFA.')))), 'Devices must be encrypted and secured with MFA.', 2);

-- ============================================================
-- PROCESS DEFINITIONS
-- ============================================================
INSERT INTO process_definitions (navigation_item_id, bpmn_xml, process_name, process_version, created_by)
VALUES
(8, '<bpmn>PROCUREMENT_PROCESS_XML_PLACEHOLDER</bpmn>', 'Procurement Process', '1.0', 2);

-- ============================================================
-- WIKI LINKS (cross-references)
-- ============================================================
INSERT INTO wiki_links (from_navigation_item_id, to_navigation_item_id, link_text)
VALUES
(6, 5, '[[Vacation Policy]]'),
(7, 6, '[[Password Policy]]');

-- ============================================================
-- TAGS
-- ============================================================
INSERT INTO document_tags (navigation_item_id, tag)
VALUES
(4, 'onboarding'),
(5, 'vacation'),
(6, 'security'),
(7, 'devices'),
(8, 'procurement');

-- ============================================================
-- FAVORITES & RECENTS
-- ============================================================
INSERT INTO user_favorites (user_id, navigation_item_id)
VALUES
(2, 5),
(2, 8);

INSERT INTO user_recents (user_id, navigation_item_id, viewed_at)
VALUES
(2, 6, NOW()),
(3, 4, NOW());

-- ============================================================
-- COMPLIANCE STRUCTURES
-- ============================================================
INSERT INTO document_responsibilities (navigation_item_id, owner_user_id, reviewer_user_id)
VALUES
(4, 2, 3),
(5, 2, 3),
(6, 2, 3),
(7, 2, 3),
(8, 2, 3);

INSERT INTO approvals (navigation_item_id, version_label, approved_by, comment)
VALUES
(4, 'v1.0', 1, 'Initial approval'),
(5, 'v1.0', 1, 'Initial approval'),
(6, 'v1.0', 1, 'Initial approval'),
(8, 'v1.0', 1, 'Initial approval');

INSERT INTO audit_events (user_id, action, entity_type, entity_id, meta)
VALUES
(1, 'CREATE_DOC', 'document', 4, JSON_OBJECT('title', 'Employee Onboarding')),
(2, 'UPDATE_DOC', 'document', 5, JSON_OBJECT('title', 'Vacation Policy')),
(2, 'CREATE_PROCESS', 'process', 8, JSON_OBJECT('title', 'Procurement Process'));
