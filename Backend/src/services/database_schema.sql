-- Drop existing table if needed (careful with production data!)
-- DROP TABLE IF EXISTS users CASCADE;
-- Database name used locally: codeAlong_Database_local
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- Password can be NULL for Google OAuth users
    password_hash VARCHAR(255),
    avatar_url TEXT DEFAULT 'default-avatar.png',
    full_name VARCHAR(100),
    
    -- Authentication method
    auth_provider VARCHAR(20) DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'github', 'microsoft')),
    provider_id VARCHAR(100), -- Google/Facebook user ID
    provider_data JSONB, -- Store additional OAuth provider data
    
    -- Email verification
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(100),
    verification_token_expires TIMESTAMP,
    
    -- Password reset
    reset_password_token VARCHAR(100),
    reset_token_expires TIMESTAMP,
    
    -- User status
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
ALTER TABLE users
ADD COLUMN questionnaire_completed BOOLEAN DEFAULT false;

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_questionnaires (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_path VARCHAR(50) NOT NULL,
    known_languages TEXT[],
    learning_languages TEXT[],
    skill_level VARCHAR(20) NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    goal VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
CREATE INDEX idx_user_questionnaires_user ON user_questionnaires(user_id);

-- Add a partial unique index for provider-specific accounts
CREATE UNIQUE INDEX idx_users_provider ON users(provider_id) 
WHERE provider_id IS NOT NULL AND auth_provider != 'email';

-- Index for faster lookups
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE email_verified = true;

CREATE TABLE user_curriculums (
  id SERIAL PRIMARY KEY,
  title text,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  current_module_index INTEGER DEFAULT 0,
  current_topic_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE curriculum_modules (
  id SERIAL PRIMARY KEY,
  curriculum_id INTEGER NOT NULL REFERENCES user_curriculums(id) ON DELETE CASCADE,
  module_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  week TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  status VARCHAR(20) DEFAULT 'locked',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(curriculum_id, module_index)
);
CREATE TABLE curriculum_topics (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
  topic_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'locked',
  has_prior_knowledge BOOLEAN,
  pretest_required BOOLEAN DEFAULT false,
  posttest_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, topic_index)
);
CREATE TABLE topic_videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id INTEGER NOT NULL REFERENCES user_curriculums(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,

  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_title TEXT,
  thumbnail TEXT,
  url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  duration TEXT,
  score NUMERIC DEFAULT 0,

  is_replacement BOOLEAN DEFAULT false,
  replaced_video_id INTEGER REFERENCES topic_videos(id),
  replacement_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE topic_quizzes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id INTEGER NOT NULL REFERENCES user_curriculums(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,

  quiz_type VARCHAR(20) NOT NULL CHECK (quiz_type IN ('pretest', 'posttest')),
  questions JSONB NOT NULL,
  score NUMERIC,
  passed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP
);
CREATE TABLE topic_mastery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,

  mastery_probability NUMERIC DEFAULT 0.20,
  attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,

  last_quiz_id INTEGER REFERENCES topic_quizzes(id),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, topic_id)
);
-- Learner weaknesses or misconception table
CREATE TABLE learner_weaknesses (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    topic_id INTEGER NOT NULL
        REFERENCES curriculum_topics(id) ON DELETE CASCADE,

    weakness_type VARCHAR(100) NOT NULL,

    severity NUMERIC DEFAULT 1.0,

    occurrence_count INTEGER DEFAULT 1,

    latest_submission_id INTEGER,

    first_detected TIMESTAMP DEFAULT NOW(),
    last_detected TIMESTAMP DEFAULT NOW()
);

CREATE TABLE topic_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id INTEGER NOT NULL REFERENCES user_curriculums(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,
  challenge_type VARCHAR(20) NOT NULL DEFAULT 'section',
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  instructions JSONB DEFAULT '[]'::JSONB,
  expected_concepts TEXT[] DEFAULT ARRAY[]::TEXT[],
  difficulty VARCHAR(20) DEFAULT 'medium',
  starter_code_by_language JSONB DEFAULT '{}'::JSONB,
  public_tests JSONB DEFAULT '[]'::JSONB,
  hidden_tests JSONB DEFAULT '[]'::JSONB,
  structural_expectations JSONB DEFAULT '{}'::JSONB,
  source VARCHAR(100) DEFAULT 'ai_generated_topic_aligned',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- changes made to topic challenges table
-- Speed up the findLatestByTopicId lookup
CREATE INDEX IF NOT EXISTS idx_topic_challenges_user_topic_type
ON topic_challenges(user_id, topic_id, challenge_type, created_at DESC);

-- Prevent duplicate challenges being generated for the same user+topic.
-- Use ON CONFLICT DO NOTHING in createTopicChallenge, or just enforce it here.
-- If you already have duplicate rows, clean them first (see below), then add the constraint.

-- Optional: deduplicate existing rows before adding the constraint
-- (keeps the most recent row per user+topic, deletes the rest)
DELETE FROM topic_challenges
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, topic_id) id
  FROM topic_challenges
  ORDER BY user_id, topic_id, created_at DESC
);

-- Add unique constraint so only one challenge per user per topic can exist
ALTER TABLE topic_challenges
ADD CONSTRAINT uq_topic_challenges_user_topic_type UNIQUE (user_id, topic_id, challenge_type);



CREATE TABLE topic_challenge_submissions (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES topic_challenges(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_code TEXT NOT NULL,
  language_id INTEGER NOT NULL,
  evaluation JSONB DEFAULT '{}'::JSONB,
  passed BOOLEAN,
  score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- BKT parameters table
CREATE TABLE bkt_parameters (
    id SERIAL PRIMARY KEY,

    topic_id INTEGER UNIQUE NOT NULL
        REFERENCES curriculum_topics(id)
        ON DELETE CASCADE,

    p_init  NUMERIC(5,4) DEFAULT 0.20 CHECK(p_init BETWEEN 0.0 AND 1.0),
    p_learn NUMERIC(5,4) DEFAULT 0.15 CHECK(p_learn BETWEEN 0.0 AND 1.0),
    p_guess NUMERIC(5,4) DEFAULT 0.20 CHECK(p_guess BETWEEN 0.0 AND 0.3),
    p_slip  NUMERIC(5,4) DEFAULT 0.10 CHECK(p_slip BETWEEN 0.0 AND 0.3),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trusted_channels (
  id SERIAL PRIMARY KEY,
  channel_name TEXT UNIQUE,
  trust_score INTEGER DEFAULT 100
);

CREATE TABLE ast_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES curriculum_topics(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL,
  language_key VARCHAR(30) NOT NULL,
  parser_engine VARCHAR(50) NOT NULL,
  parser_status VARCHAR(30) DEFAULT 'pending_integration',
  source_hash TEXT NOT NULL,
  summary JSONB DEFAULT '{}'::JSONB,
  normalized_ast JSONB,
  diagnostics JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ast_analyses_user_topic
ON ast_analyses(user_id, topic_id, created_at DESC);




-- ── Chat Conversations ────────────────────────────────────────────────────
-- One row per user session/thread. A user can have multiple conversations
-- (e.g. one per curriculum-building session).
CREATE TABLE chat_conversations (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Optional: tag what this conversation was about
  context     VARCHAR(50) DEFAULT 'general'
              CHECK (context IN ('general', 'curriculum')),

  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_user
  ON chat_conversations(user_id, created_at DESC);


-- ── Chat Messages ─────────────────────────────────────────────────────────
-- One row per message (user or assistant) inside a conversation.
CREATE TABLE chat_messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL
                  REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role            VARCHAR(20) NOT NULL
                  CHECK (role IN ('user', 'assistant', 'system')),

  content         TEXT NOT NULL,

  -- For curriculum messages, store the parsed curriculum object too
  curriculum_data JSONB,

  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at ASC);

CREATE INDEX idx_chat_messages_user
  ON chat_messages(user_id, created_at DESC);



-- drop this table
CREATE TABLE module_topic_videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  module_title TEXT NOT NULL,
  topic TEXT NOT NULL,

  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_title TEXT,
  thumbnail TEXT,
  url TEXT NOT NULL,

  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  duration TEXT,
  score NUMERIC DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, module_title, topic)
);















-- below not being used for reference only not created
-- CREATE TABLE admins(
--     id SERIAL PRIMARY KEY,
--     username VARCHAR(50) UNIQUE NOT NULL,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     full_name VARCHAR(100) NOT NULL,
--     is_active BOOLEAN DEFAULT true,
--     last_login TIMESTAMP,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- -- 3. COURSES TABLE (Admin-created)
-- CREATE TABLE courses(
--     id SERIAL PRIMARY KEY,
--     title VARCHAR(200) NOT NULL,
--     slug VARCHAR(200) UNIQUE NOT NULL,
--     description TEXT NOT NULL,
    
--     -- Which admin created this course
--     admin_id INTEGER NOT NULL REFERENCES admins(id),
    
--     -- Course metadata
--     thumbnail_url TEXT DEFAULT 'default-course.jpg',
--     difficulty VARCHAR(20) DEFAULT 'beginner'
--         CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
--     estimated_hours INTEGER DEFAULT 0,
    
--     -- Publication status
--     is_published BOOLEAN DEFAULT false,
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW()
-- );

-- -- 4. VIDEO LESSONS TABLE
-- CREATE TABLE video_lessons(
--     id SERIAL PRIMARY KEY,
--     course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
--     title VARCHAR(200) NOT NULL,
    
--     -- Video details
--     video_url TEXT NOT NULL,
--     video_duration INTEGER,
--     thumbnail_url TEXT,
    
--     -- Lesson ordering
--     order_index INTEGER NOT NULL,
--     description TEXT,
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW(),
    
--     UNIQUE(course_id, order_index)
-- );

-- -- 5. ENROLLMENTS TABLE
-- CREATE TABLE enrollments(
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id),
--     course_id INTEGER NOT NULL REFERENCES courses(id),
--     enrolled_at TIMESTAMP DEFAULT NOW(),
--     progress_percentage INTEGER DEFAULT 0 
--         CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
--     last_accessed_at TIMESTAMP DEFAULT NOW(),
--     UNIQUE(user_id, course_id)
-- );

-- -- 6. LESSON PROGRESS TABLE
-- CREATE TABLE lesson_progress(
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id),
--     lesson_id INTEGER NOT NULL REFERENCES video_lessons(id),
--     is_completed BOOLEAN DEFAULT false,
--     completed_at TIMESTAMP,
--     current_video_time DECIMAL(10, 2) DEFAULT 0,
--     watched_duration INTEGER DEFAULT 0,
--     last_watched_at TIMESTAMP DEFAULT NOW(),
--     UNIQUE(user_id, lesson_id)
-- );

-- -- CREATE INDEXES
-- CREATE INDEX idx_users_email ON users(email);


-- CREATE INDEX idx_admins_email ON admins(email);
-- CREATE INDEX idx_admins_username ON admins(username);

-- CREATE INDEX idx_courses_admin ON courses(admin_id);
-- CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
-- CREATE INDEX idx_courses_slug ON courses(slug);

-- CREATE INDEX idx_video_lessons_course ON video_lessons(course_id);
-- CREATE INDEX idx_video_lessons_order ON video_lessons(course_id, order_index);

-- CREATE INDEX idx_enrollments_user ON enrollments(user_id);
-- CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
-- CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- -- Chat tables

-- CREATE TABLE chat_conversations (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
--     -- Conversation metadata
--     title VARCHAR(200) DEFAULT 'New Conversation', -- Auto-generated from first message
--     context_type VARCHAR(50) DEFAULT 'general', -- 'general', 'course_help', 'code_help', etc.
--     context_id INTEGER, -- Could link to course_id or lesson_id if context-specific
    
--     -- Status and limits
--     is_active BOOLEAN DEFAULT true,
--     message_count INTEGER DEFAULT 0,
--     token_count INTEGER DEFAULT 0, -- For tracking API usage/costs
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW(),
--     last_message_at TIMESTAMP,
    
--     -- Indexes for common queries
--     CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- -- Indexes for conversations
-- CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
-- CREATE INDEX idx_chat_conversations_active ON chat_conversations(is_active) WHERE is_active = true;
-- CREATE INDEX idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

-- CREATE TABLE chat_messages (
--     id SERIAL PRIMARY KEY,
--     conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
--     -- Message content
--     role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
--     content TEXT NOT NULL,
    
--     -- For code or special content
--     content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'markdown')),
--     code_language VARCHAR(50), -- If content_type = 'code'
    
--     -- Metadata
--     tokens INTEGER DEFAULT 0, -- Token count for this message
--     model_used VARCHAR(100), -- e.g., 'llama-3.1-8b-instant'
--     temperature DECIMAL(3, 2), -- AI temperature used
    
--     -- Message status
--     is_flagged BOOLEAN DEFAULT false,
--     flag_reason TEXT,
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
    
--     -- Indexes
--     CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
-- );

-- -- Indexes for messages
-- CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
-- CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
-- CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- CREATE TABLE chat_settings (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
--     -- User preferences
--     default_model VARCHAR(100) DEFAULT 'llama-3.1-8b-instant',
--     default_temperature DECIMAL(3, 2) DEFAULT 0.7,
--     max_history_length INTEGER DEFAULT 20, -- Your current limit
--     auto_title BOOLEAN DEFAULT true, -- Auto-generate conversation titles
    
--     -- UI preferences
--     theme VARCHAR(20) DEFAULT 'light',
--     code_highlighting BOOLEAN DEFAULT true,
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW(),
    
--     CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- -- course specific conversations
-- CREATE TABLE chat_contexts (
--     id SERIAL PRIMARY KEY,
--     conversation_id INTEGER UNIQUE NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
--     -- Context linking
--     course_id INTEGER REFERENCES courses(id),
--     lesson_id INTEGER REFERENCES video_lessons(id),
--     -- exercise_id INTEGER REFERENCES coding_exercises(id), -- If you add coding exercises later
    
--     -- Context data
--     context_data JSONB DEFAULT '{}', -- Additional context like code snippets, course progress
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
    
--     -- Indexes
--     CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
-- );

-- CREATE INDEX idx_chat_contexts_course ON chat_contexts(course_id);
-- CREATE INDEX idx_chat_contexts_lesson ON chat_contexts(lesson_id);


-- -- Optional: Table for tracking API usage and costs
-- CREATE TABLE chat_usage (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id),
--     conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE SET NULL,
    
--     -- Usage metrics
--     message_count INTEGER DEFAULT 1,
--     total_tokens INTEGER DEFAULT 0,
--     api_calls INTEGER DEFAULT 1,
    
--     -- Model info
--     model_used VARCHAR(100),
    
--     -- Cost tracking (if applicable)
--     estimated_cost DECIMAL(10, 6) DEFAULT 0,
    
--     -- Session info
--     session_duration_seconds INTEGER,
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
    
--     -- Indexes
--     CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- CREATE INDEX idx_chat_usage_user ON chat_usage(user_id);
-- CREATE INDEX idx_chat_usage_date ON chat_usage(created_at);
-- CREATE INDEX idx_chat_usage_conversation ON chat_usage(conversation_id);


-- -- Code execution tables
-- CREATE TABLE code_languages (
--     id SERIAL PRIMARY KEY,
--     judge0_id INTEGER UNIQUE NOT NULL, -- Judge0 language ID
--     name VARCHAR(100) NOT NULL, -- e.g., 'JavaScript (Node.js 12.14.0)'
--     editor_name VARCHAR(50) NOT NULL, -- e.g., 'javascript', 'python', 'java'
--     file_extension VARCHAR(20) NOT NULL, -- e.g., '.js', '.py', '.java'
--     monaco_language_id VARCHAR(50), -- Monaco editor language ID
--     is_active BOOLEAN DEFAULT true,
--     icon_url TEXT, -- Language icon
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Insert default languages (matching your controller)
-- INSERT INTO code_languages (judge0_id, name, editor_name, file_extension, monaco_language_id) VALUES
-- (63, 'JavaScript (Node.js 12.14.0)', 'javascript', '.js', 'javascript'),
-- (71, 'Python (3.8.1)', 'python', '.py', 'python'),
-- (62, 'Java (OpenJDK 11.0.4)', 'java', '.java', 'java'),
-- (54, 'C++ (GCC 9.2.0)', 'cpp', '.cpp', 'cpp'),
-- (50, 'C (GCC 9.2.0)', 'c', '.c', 'c'),
-- (51, 'C# (Mono 6.6.0.161)', 'csharp', '.cs', 'csharp'),
-- (60, 'Go (1.13.5)', 'go', '.go', 'go'),
-- (72, 'Ruby (2.7.0)', 'ruby', '.rb', 'ruby'),
-- (73, 'Rust (1.40.0)', 'rust', '.rs', 'rust');

-- CREATE TABLE code_submissions (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
--     language_id INTEGER NOT NULL REFERENCES code_languages(id),
    
--     -- Submission details
--     judge0_token VARCHAR(100) UNIQUE NOT NULL, -- Judge0 submission token
--     source_code TEXT NOT NULL,
--     stdin TEXT DEFAULT '',
    
--     -- Result from Judge0
--     status_id INTEGER, -- Judge0 status ID (1=In Queue, 2=Processing, 3=Accepted, etc.)
--     status_description VARCHAR(100),
--     stdout TEXT,
--     stderr TEXT,
--     compile_output TEXT,
--     time DECIMAL(10, 3), -- Execution time in seconds
--     memory INTEGER, -- Memory used in KB
    
--     -- Submission metadata
--     ip_address INET,
--     user_agent TEXT,
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW(),
--     completed_at TIMESTAMP
-- );

-- -- Create indexes for common queries
-- CREATE INDEX idx_code_submissions_user ON code_submissions(user_id);
-- CREATE INDEX idx_code_submissions_token ON code_submissions(judge0_token);
-- CREATE INDEX idx_code_submissions_created ON code_submissions(created_at DESC);
-- CREATE INDEX idx_code_submissions_status ON code_submissions(status_id);
-- CREATE INDEX idx_code_submissions_language ON code_submissions(language_id);


-- CREATE TABLE code_exercises (
--     id SERIAL PRIMARY KEY,
--     title VARCHAR(200) NOT NULL,
--     slug VARCHAR(200) UNIQUE NOT NULL,
--     description TEXT NOT NULL,
--     difficulty VARCHAR(20) DEFAULT 'easy' 
--         CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    
--     -- Starter code per language
--     starter_code JSONB DEFAULT '{}', -- { "javascript": "console.log('hello');", "python": "print('hello')" }
    
--     -- Test cases
--     test_cases JSONB DEFAULT '[]', -- Array of {input: "", expected_output: "", hidden: boolean}
    
--     -- Solution & hints
--     solution_code TEXT,
--     hints TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of hints
--     explanation TEXT, -- Solution explanation
    
--     -- Metadata
--     points INTEGER DEFAULT 10,
--     time_limit_seconds INTEGER DEFAULT 5,
--     memory_limit_mb INTEGER DEFAULT 256,
--     is_published BOOLEAN DEFAULT false,
--     author_id INTEGER REFERENCES admins(id),
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Insert sample exercise
-- INSERT INTO code_exercises (title, slug, description, difficulty, starter_code, test_cases) VALUES
-- ('Hello World', 'hello-world', 'Write a program that prints "Hello, World!"', 'easy',
--  '{"javascript": "// Write your code here\n", "python": "# Write your code here\n"}',
--  '[{"input": "", "expected_output": "Hello, World!\n", "hidden": false}]');

-- CREATE TABLE exercise_submissions (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id),
--     exercise_id INTEGER NOT NULL REFERENCES code_exercises(id),
--     submission_id INTEGER NOT NULL REFERENCES code_submissions(id),
    
--     -- Evaluation results
--     is_correct BOOLEAN DEFAULT false,
--     passed_tests INTEGER DEFAULT 0,
--     total_tests INTEGER DEFAULT 0,
--     test_results JSONB DEFAULT '[]', -- Detailed test results
    
--     -- Score and ranking
--     score INTEGER DEFAULT 0,
--     execution_time_ms INTEGER,
--     memory_used_kb INTEGER,
    
--     -- Submission context
--     attempt_number INTEGER DEFAULT 1,
--     submitted_from VARCHAR(50), -- 'lesson', 'practice', 'challenge'
    
--     -- Timestamps
--     created_at TIMESTAMP DEFAULT NOW(),
    
--     -- Constraints
--     UNIQUE(user_id, exercise_id, submission_id)
-- );

-- -- Indexes
-- CREATE INDEX idx_exercise_submissions_user ON exercise_submissions(user_id);
-- CREATE INDEX idx_exercise_submissions_exercise ON exercise_submissions(exercise_id);
-- CREATE INDEX idx_exercise_submissions_correct ON exercise_submissions(is_correct) WHERE is_correct = true;

