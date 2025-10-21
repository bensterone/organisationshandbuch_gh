-- ============================================================
-- ORGANISATIONSHANDBUCH DATABASE SCHEMA (Unified)
-- Compatible with MySQL 8.0+
-- ============================================================

DROP DATABASE IF EXISTS organisationshandbuch;
CREATE DATABASE organisationshandbuch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE organisationshandbuch;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    ad_guid VARCHAR(255),
    role ENUM('viewer', 'editor', 'admin') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- NAVIGATION ITEMS (folders, documents, processes)
-- ============================================================
CREATE TABLE navigation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('folder', 'document', 'process') NOT NULL,
    sort_order INT DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'file',
    status ENUM('draft','in_review','approved','deprecated') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_type (type),
    INDEX idx_title (title),
    FULLTEXT INDEX idx_search (title, description)
) ENGINE=InnoDB;

-- ============================================================
-- CONTENT BLOCKS (Editor.js JSON)
-- ============================================================
CREATE TABLE content_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    navigation_item_id INT NOT NULL,
    content JSON NOT NULL,
    content_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FULLTEXT INDEX idx_content (content_text),
    INDEX idx_nav_item (navigation_item_id)
) ENGINE=InnoDB;

-- ============================================================
-- BPMN PROCESS DEFINITIONS
-- ============================================================
CREATE TABLE process_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    navigation_item_id INT NOT NULL UNIQUE,
    bpmn_xml LONGTEXT NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    process_version VARCHAR(50) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nav_item (navigation_item_id)
) ENGINE=InnoDB;

-- ============================================================
-- DOCUMENT LINKS TO BPMN ELEMENTS
-- ============================================================
CREATE TABLE document_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_definition_id INT NOT NULL,
    bpmn_element_id VARCHAR(255) NOT NULL,
    linked_navigation_item_id INT NOT NULL,
    link_type ENUM('reference', 'instruction', 'form', 'other') DEFAULT 'reference',
    link_description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (process_definition_id) REFERENCES process_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_process (process_definition_id),
    INDEX idx_element (bpmn_element_id),
    UNIQUE KEY unique_link (process_definition_id, bpmn_element_id, linked_navigation_item_id)
) ENGINE=InnoDB;

-- ============================================================
-- FILE UPLOADS
-- ============================================================
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    navigation_item_id INT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nav_item (navigation_item_id)
) ENGINE=InnoDB;

-- ============================================================
-- VERSIONING TABLES
-- ============================================================
CREATE TABLE item_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  version_label VARCHAR(50) NOT NULL,
  summary VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_item (navigation_item_id)
);

CREATE TABLE process_version_blobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_version_id INT NOT NULL,
  bpmn_xml LONGTEXT NOT NULL,
  FOREIGN KEY (item_version_id) REFERENCES item_versions(id) ON DELETE CASCADE
);

CREATE TABLE document_version_blobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_version_id INT NOT NULL,
  content JSON,
  content_text LONGTEXT,
  FOREIGN KEY (item_version_id) REFERENCES item_versions(id) ON DELETE CASCADE
);

-- ============================================================
-- WIKI LINKS (cross-linking)
-- ============================================================
CREATE TABLE wiki_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_navigation_item_id INT NOT NULL,
  to_navigation_item_id INT NOT NULL,
  link_text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_edge (from_navigation_item_id, to_navigation_item_id),
  INDEX idx_from (from_navigation_item_id),
  INDEX idx_to (to_navigation_item_id),
  CONSTRAINT fk_wiki_from FOREIGN KEY (from_navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_wiki_to FOREIGN KEY (to_navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

-- ============================================================
-- COMPLIANCE & APPROVAL STRUCTURES
-- ============================================================
CREATE TABLE document_responsibilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  owner_user_id INT NULL,
  reviewer_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dr_nav FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_dr_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dr_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_dr_nav (navigation_item_id)
);

CREATE TABLE document_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  review_interval_days INT DEFAULT 365,
  next_review_at DATE NULL,
  last_reviewed_at DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_drev_nav FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_drev_nav (navigation_item_id)
);

CREATE TABLE approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  version_label VARCHAR(50) NULL,
  approved_by INT NOT NULL,
  comment VARCHAR(255) NULL,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appr_nav FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_appr_user FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_appr_nav (navigation_item_id)
);

CREATE TABLE user_acknowledgements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  navigation_item_id INT NOT NULL,
  acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ack_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ack_nav FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_ack (user_id, navigation_item_id),
  INDEX idx_ack_nav (navigation_item_id)
);

CREATE TABLE audit_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id INT NOT NULL,
  meta JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE privacy_consents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  consent_key VARCHAR(64) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_consent (user_id, consent_key),
  CONSTRAINT fk_consent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE data_access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  method VARCHAR(8) NOT NULL,
  path VARCHAR(255) NOT NULL,
  status SMALLINT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_user (user_id),
  INDEX idx_log_path (path),
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- DISCOVERY SUPPORT (tags, favorites, recents)
-- ============================================================
CREATE TABLE document_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  tag VARCHAR(64) NOT NULL,
  UNIQUE KEY uniq_tag (navigation_item_id, tag),
  INDEX idx_tag (tag),
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

CREATE TABLE user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  navigation_item_id INT NOT NULL,
  UNIQUE KEY uniq_fav (user_id, navigation_item_id),
  INDEX idx_fav_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

CREATE TABLE user_recents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  navigation_item_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recent_user (user_id, viewed_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEX ENHANCEMENTS
-- ============================================================
ALTER TABLE navigation_items ADD INDEX idx_title_type (title, type);

-- ============================================================
-- SAMPLE DATA
-- ============================================================
INSERT INTO users (username, email, full_name, role)
VALUES ('admin', 'admin@company.com', 'Administrator', 'admin');

INSERT INTO navigation_items (title, description, type, sort_order, created_by)
VALUES
('HR Policies', 'Human Resources', 'folder', 1, 1),
('IT Guidelines', 'IT Documentation', 'folder', 2, 1),
('Business Processes', 'Process Documentation', 'folder', 3, 1);
