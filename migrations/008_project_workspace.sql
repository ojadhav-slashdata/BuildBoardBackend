-- Migration 008: Project Workspace (Jira-like project management)

-- Project tasks (kanban cards)
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    due_date TIMESTAMPTZ,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project messages (team chat)
CREATE TABLE IF NOT EXISTS project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    channel TEXT NOT NULL DEFAULT 'general' CHECK (channel IN ('general', 'requirements', 'design', 'blockers')),
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'requirement', 'design_link', 'blocker', 'update', 'system')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project links (Figma, docs, repos, etc.)
CREATE TABLE IF NOT EXISTS project_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    link_type TEXT NOT NULL DEFAULT 'other' CHECK (link_type IN ('figma', 'github', 'docs', 'prototype', 'design', 'other')),
    added_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project requirements (trackable checklist)
CREATE TABLE IF NOT EXISTS project_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'blocked')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('must_have', 'should_have', 'nice_to_have')),
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_idea ON project_tasks(idea_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_idea ON project_messages(idea_id);
CREATE INDEX IF NOT EXISTS idx_project_links_idea ON project_links(idea_id);
CREATE INDEX IF NOT EXISTS idx_project_requirements_idea ON project_requirements(idea_id);
