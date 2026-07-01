-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla Principal de Iniciativas
CREATE TABLE public.initiatives (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 5. Políticas de Seguridad Básicas (Solo usuarios autenticados pueden leer/escribir)
-- Para Initiatives
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.initiatives FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir insertar a usuarios autenticados" ON public.initiatives FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir actualizar a usuarios autenticados" ON public.initiatives FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir borrar a usuarios autenticados" ON public.initiatives FOR DELETE USING (auth.role() = 'authenticated');

-- Para History
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.initiative_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir insertar a usuarios autenticados" ON public.initiative_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Para Comments
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir insertar a usuarios autenticados" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden actualizar sus propios comentarios" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden borrar sus propios comentarios" ON public.comments FOR DELETE USING (auth.uid() = user_id);
