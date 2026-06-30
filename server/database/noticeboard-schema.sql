-- Noticeboard Service Database Schema
-- Database: hashibasha_noticeboard

-- Noticeboard posts table
CREATE TABLE IF NOT EXISTS noticeboard_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    file_url VARCHAR(1000),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    admin_only_comments BOOLEAN DEFAULT false,
    tag_names JSONB DEFAULT '[]',
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Noticeboard comments table
CREATE TABLE IF NOT EXISTS noticeboard_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES noticeboard_posts(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    comment TEXT NOT NULL,
    is_admin_comment BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Noticeboard likes table
CREATE TABLE IF NOT EXISTS noticeboard_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES noticeboard_posts(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Indexes for better performance
CREATE INDEX idx_noticeboard_posts_org_id ON noticeboard_posts(organization_id);
CREATE INDEX idx_noticeboard_posts_created_by ON noticeboard_posts(created_by);
CREATE INDEX idx_noticeboard_posts_is_active ON noticeboard_posts(is_active);
CREATE INDEX idx_noticeboard_posts_created_at ON noticeboard_posts(created_at);
CREATE INDEX idx_noticeboard_comments_post_id ON noticeboard_comments(post_id);
CREATE INDEX idx_noticeboard_comments_user_id ON noticeboard_comments(user_id);
CREATE INDEX idx_noticeboard_likes_post_id ON noticeboard_likes(post_id);
CREATE INDEX idx_noticeboard_likes_user_id ON noticeboard_likes(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_noticeboard_posts_updated_at BEFORE UPDATE ON noticeboard_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_noticeboard_comments_updated_at BEFORE UPDATE ON noticeboard_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
