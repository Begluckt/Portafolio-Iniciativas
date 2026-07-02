-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla Principal de Iniciativas
CREATE TABLE public.initiatives (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    ini_id VARCHAR(50),
    ini_status VARCHAR(50) DEFAULT 'En Evaluación',
    ini_name TEXT NOT NULL,
    ini_owner VARCHAR(255),
    ini_sponsor VARCHAR(255),
    ini_objective VARCHAR(255),
    ini_segment VARCHAR(255),
    ini_problem TEXT,
    ini_context TEXT,
    ini_desired TEXT,
    ini_impacted TEXT,
    ini_benefit TEXT,
    ini_benefit_desc TEXT,
    ini_goal VARCHAR(255),
    ini_capture_date VARCHAR(50),
    ini_measurement VARCHAR(255),
    val_revenue VARCHAR(50),
    val_efficiency VARCHAR(50),
    val_experience VARCHAR(50),
    val_other VARCHAR(255),
    dur_time VARCHAR(50),
    dur_cost VARCHAR(50),
    dur_uncertainty VARCHAR(50),
    dur_capacity VARCHAR(50),
    ini_evaluation_detail TEXT,
    brand VARCHAR(100),
    segment_type VARCHAR(100),
    network VARCHAR(100),
    impact TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para Historial de Cambios (Audit Log)
CREATE TABLE public.initiative_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_uuid UUID REFERENCES public.initiatives(uuid) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id), -- Requiere Supabase Auth
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    previous_state JSONB,
    new_state JSONB
);

-- 3. Tabla para Comentarios
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_uuid UUID REFERENCES public.initiatives(uuid) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create triggers for timestamps
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.initiatives
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- 1. Users can only see their own initiatives
CREATE POLICY "Users can see their own initiatives" 
ON public.initiatives FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can insert initiatives (user_id is set automatically by DEFAULT auth.uid())
CREATE POLICY "Users can insert their own initiatives" 
ON public.initiatives FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own initiatives
CREATE POLICY "Users can update their own initiatives" 
ON public.initiatives FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Users can delete their own initiatives
CREATE POLICY "Users can delete their own initiatives" 
ON public.initiatives FOR DELETE 
USING (auth.uid() = user_id);

-- Para History
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.initiative_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir insertar a usuarios autenticados" ON public.initiative_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Para Comments
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir insertar a usuarios autenticados" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden actualizar sus propios comentarios" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden borrar sus propios comentarios" ON public.comments FOR DELETE USING (auth.uid() = user_id);
