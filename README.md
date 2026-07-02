# Gestor de Portafolio de Iniciativas

Plataforma desarrollada para centralizar, gestionar y documentar las iniciativas estratégicas (Claro VTR). Permite a múltiples usuarios tener su propio portafolio privado y aislado, visualizar métricas en un dashboard, y presentar el contenido en diversos formatos.

## 🚀 Características Principales

* **Sistema Multi-Tenant:** Cada usuario posee una cuenta privada, y sus datos están protegidos a nivel de base de datos.
* **Canvas de Iniciativas:** Formulario estructurado para levantar información clave (Contexto, Beneficio, Esfuerzos, Riesgos, etc).
* **Exportación y Respaldos:** 
  * Exportación de documentos a **PDF** y **PPTX**.
  * Importación y Exportación masiva en formato **JSON**.
* **Modo Presentación:** Interfaz limpia sin distracciones (Modo TV) optimizada para proyectar en reuniones y comités.
* **Dashboard Analítico:** Gráficos y KPI's automáticos basados en el estado de las iniciativas.

## 🛠️ Stack Tecnológico

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Gráficos:** Recharts
* **Iconos:** Lucide React

## 🏗️ Arquitectura del Sistema

El sistema utiliza **Row Level Security (RLS)** de PostgreSQL en conjunto con Supabase Auth para garantizar que el backend jamás retorne información a un usuario que no sea dueño del registro.

```mermaid
graph TD
    User([Usuario]) -->|Login/Registro| App(Next.js Frontend)
    User -->|Visualiza / Edita| App
    
    subgraph Client [Capa de Presentación]
        App --> UI(Dashboard & Formularios)
        UI -->|Genera Localmente| PPTX(Exportación PPTX/PDF)
        UI -->|Procesa Localmente| JSON(Import/Export JSON)
    end
    
    subgraph Server [Backend - Supabase]
        App <-->|JWT / Cookies| Auth[Supabase Auth]
        App <-->|@supabase/ssr| DB[(PostgreSQL)]
        
        Auth -.->|Inyecta auth.uid| RLS{Row Level Security}
        DB --- RLS
        RLS -.->|Aísla y Filtra Registros| DB
    end
    
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Auth fill:#ff9999,stroke:#333
    style DB fill:#99ccff,stroke:#333
    style RLS fill:#ffcc99,stroke:#333
```

## ⚙️ Configuración Local

1. Clona el repositorio e instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno creando un archivo `.env.local` en la raíz con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`.

## 🔒 Reglas de Base de Datos (RLS)

Para el correcto funcionamiento, la tabla `initiatives` en Supabase debe contar con la siguiente estructura RLS vinculada a `auth.users`:

```sql
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- Ver, Crear, Editar y Borrar restringidos al dueño de la sesión:
CREATE POLICY "Users can access their own initiatives" 
ON public.initiatives FOR ALL USING (auth.uid() = user_id);
```
