/**
 * Tipos de la base de datos (formato de `supabase gen types typescript`).
 * Refleja supabase/migrations. Tras cambiar el esquema, regenéralos con:
 *   npx supabase gen types typescript --project-id <id> --schema public > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      clientes: {
        Row: {
          ciudad: string | null;
          created_at: string;
          created_by: string | null;
          email: string;
          id: string;
          nombre_completo: string;
          numero_documento: string | null;
          origen: string;
          perfil_id: string | null;
          telefono: string | null;
          tipo_documento: Database["public"]["Enums"]["tipo_documento"] | null;
          updated_at: string;
        };
        Insert: {
          ciudad?: string | null;
          created_at?: string;
          created_by?: string | null;
          email: string;
          id?: string;
          nombre_completo: string;
          numero_documento?: string | null;
          origen?: string;
          perfil_id?: string | null;
          telefono?: string | null;
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"] | null;
          updated_at?: string;
        };
        Update: {
          ciudad?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string;
          id?: string;
          nombre_completo?: string;
          numero_documento?: string | null;
          origen?: string;
          perfil_id?: string | null;
          telefono?: string | null;
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clientes_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: true;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      consentimientos: {
        Row: {
          aceptado_at: string;
          id: number;
          perfil_id: string;
          tipo: string;
          user_agent: string | null;
          version: string;
        };
        Insert: {
          aceptado_at?: string;
          id?: never;
          perfil_id: string;
          tipo?: string;
          user_agent?: string | null;
          version: string;
        };
        Update: {
          aceptado_at?: string;
          id?: never;
          perfil_id?: string;
          tipo?: string;
          user_agent?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consentimientos_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_ajustes: {
        Row: {
          actualizado_por: string | null;
          clave: string;
          secreto: string | null;
          updated_at: string;
          valor: Json;
        };
        Insert: {
          actualizado_por?: string | null;
          clave: string;
          secreto?: string | null;
          updated_at?: string;
          valor?: Json;
        };
        Update: {
          actualizado_por?: string | null;
          clave?: string;
          secreto?: string | null;
          updated_at?: string;
          valor?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "crm_ajustes_actualizado_por_fkey";
            columns: ["actualizado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_casos: {
        Row: {
          analisis: Json | null;
          cliente_id: string | null;
          creado_por: string | null;
          created_at: string;
          email: string | null;
          etapa_id: string;
          id: string;
          nombre: string;
          origen: Database["public"]["Enums"]["crm_canal"] | null;
          proxima_accion: string | null;
          proxima_accion_fecha: string | null;
          responsable_id: string | null;
          telefono: string | null;
          ultimo_mensaje_at: string | null;
          ultimo_mensaje_direccion: Database["public"]["Enums"]["crm_direccion"] | null;
          updated_at: string;
        };
        Insert: {
          analisis?: Json | null;
          cliente_id?: string | null;
          creado_por?: string | null;
          created_at?: string;
          email?: string | null;
          etapa_id: string;
          id?: string;
          nombre: string;
          origen?: Database["public"]["Enums"]["crm_canal"] | null;
          proxima_accion?: string | null;
          proxima_accion_fecha?: string | null;
          responsable_id?: string | null;
          telefono?: string | null;
          ultimo_mensaje_at?: string | null;
          ultimo_mensaje_direccion?: Database["public"]["Enums"]["crm_direccion"] | null;
          updated_at?: string;
        };
        Update: {
          analisis?: Json | null;
          cliente_id?: string | null;
          creado_por?: string | null;
          created_at?: string;
          email?: string | null;
          etapa_id?: string;
          id?: string;
          nombre?: string;
          origen?: Database["public"]["Enums"]["crm_canal"] | null;
          proxima_accion?: string | null;
          proxima_accion_fecha?: string | null;
          responsable_id?: string | null;
          telefono?: string | null;
          ultimo_mensaje_at?: string | null;
          ultimo_mensaje_direccion?: Database["public"]["Enums"]["crm_direccion"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_casos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_casos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_casos_etapa_id_fkey";
            columns: ["etapa_id"];
            isOneToOne: false;
            referencedRelation: "crm_etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_casos_responsable_id_fkey";
            columns: ["responsable_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_etapas: {
        Row: {
          cierre: Database["public"]["Enums"]["crm_cierre"] | null;
          color: string;
          correo_automatico: Json | null;
          created_at: string;
          descripcion: string | null;
          id: string;
          nombre: string;
          orden: number;
          tareas_automaticas: Json;
          updated_at: string;
        };
        Insert: {
          cierre?: Database["public"]["Enums"]["crm_cierre"] | null;
          color?: string;
          correo_automatico?: Json | null;
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          nombre: string;
          orden: number;
          tareas_automaticas?: Json;
          updated_at?: string;
        };
        Update: {
          cierre?: Database["public"]["Enums"]["crm_cierre"] | null;
          color?: string;
          correo_automatico?: Json | null;
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          nombre?: string;
          orden?: number;
          tareas_automaticas?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_eventos: {
        Row: {
          autor_id: string | null;
          caso_id: string;
          created_at: string;
          datos: Json | null;
          descripcion: string;
          id: number;
          tipo: Database["public"]["Enums"]["crm_tipo_evento"];
        };
        Insert: {
          autor_id?: string | null;
          caso_id: string;
          created_at?: string;
          datos?: Json | null;
          descripcion: string;
          id?: never;
          tipo: Database["public"]["Enums"]["crm_tipo_evento"];
        };
        Update: {
          autor_id?: string | null;
          caso_id?: string;
          created_at?: string;
          datos?: Json | null;
          descripcion?: string;
          id?: never;
          tipo?: Database["public"]["Enums"]["crm_tipo_evento"];
        };
        Relationships: [
          {
            foreignKeyName: "crm_eventos_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_eventos_caso_id_fkey";
            columns: ["caso_id"];
            isOneToOne: false;
            referencedRelation: "crm_casos";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_mensajes: {
        Row: {
          asunto: string | null;
          autor_id: string | null;
          canal: Database["public"]["Enums"]["crm_canal"];
          caso_id: string;
          contenido: string;
          created_at: string;
          direccion: Database["public"]["Enums"]["crm_direccion"];
          enviado_at: string | null;
          error: string | null;
          estado_envio: Database["public"]["Enums"]["crm_estado_envio"];
          id: number;
          id_externo: string | null;
        };
        Insert: {
          asunto?: string | null;
          autor_id?: string | null;
          canal: Database["public"]["Enums"]["crm_canal"];
          caso_id: string;
          contenido: string;
          created_at?: string;
          direccion: Database["public"]["Enums"]["crm_direccion"];
          enviado_at?: string | null;
          error?: string | null;
          estado_envio?: Database["public"]["Enums"]["crm_estado_envio"];
          id?: never;
          id_externo?: string | null;
        };
        Update: {
          asunto?: string | null;
          autor_id?: string | null;
          canal?: Database["public"]["Enums"]["crm_canal"];
          caso_id?: string;
          contenido?: string;
          created_at?: string;
          direccion?: Database["public"]["Enums"]["crm_direccion"];
          enviado_at?: string | null;
          error?: string | null;
          estado_envio?: Database["public"]["Enums"]["crm_estado_envio"];
          id?: never;
          id_externo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_mensajes_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_mensajes_caso_id_fkey";
            columns: ["caso_id"];
            isOneToOne: false;
            referencedRelation: "crm_casos";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_notificaciones: {
        Row: {
          caso_id: string | null;
          created_at: string;
          cuerpo: string | null;
          enlace: string | null;
          id: number;
          leida_at: string | null;
          perfil_id: string;
          titulo: string;
        };
        Insert: {
          caso_id?: string | null;
          created_at?: string;
          cuerpo?: string | null;
          enlace?: string | null;
          id?: never;
          leida_at?: string | null;
          perfil_id: string;
          titulo: string;
        };
        Update: {
          caso_id?: string | null;
          created_at?: string;
          cuerpo?: string | null;
          enlace?: string | null;
          id?: never;
          leida_at?: string | null;
          perfil_id?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_notificaciones_caso_id_fkey";
            columns: ["caso_id"];
            isOneToOne: false;
            referencedRelation: "crm_casos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_notificaciones_perfil_id_fkey";
            columns: ["perfil_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_tareas: {
        Row: {
          caso_id: string;
          completada_at: string | null;
          creada_por: string | null;
          created_at: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["crm_estado_tarea"];
          id: string;
          origen_etapa_id: string | null;
          responsable_id: string | null;
          tipo: Database["public"]["Enums"]["crm_tipo_tarea"];
          titulo: string;
          updated_at: string;
          vence_at: string | null;
        };
        Insert: {
          caso_id: string;
          completada_at?: string | null;
          creada_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["crm_estado_tarea"];
          id?: string;
          origen_etapa_id?: string | null;
          responsable_id?: string | null;
          tipo?: Database["public"]["Enums"]["crm_tipo_tarea"];
          titulo: string;
          updated_at?: string;
          vence_at?: string | null;
        };
        Update: {
          caso_id?: string;
          completada_at?: string | null;
          creada_por?: string | null;
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["crm_estado_tarea"];
          id?: string;
          origen_etapa_id?: string | null;
          responsable_id?: string | null;
          tipo?: Database["public"]["Enums"]["crm_tipo_tarea"];
          titulo?: string;
          updated_at?: string;
          vence_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tareas_caso_id_fkey";
            columns: ["caso_id"];
            isOneToOne: false;
            referencedRelation: "crm_casos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tareas_creada_por_fkey";
            columns: ["creada_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tareas_origen_etapa_id_fkey";
            columns: ["origen_etapa_id"];
            isOneToOne: false;
            referencedRelation: "crm_etapas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tareas_responsable_id_fkey";
            columns: ["responsable_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      diagnosticos: {
        Row: {
          actualizado_por: string | null;
          bienes: string | null;
          cliente_id: string;
          created_at: string;
          cuotas_honorarios: number;
          descuento_centro_conciliacion: number;
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null;
          gastos_mensuales: number | null;
          id: string;
          ingresos_mensuales: number | null;
          objetivo_cliente: string | null;
          observaciones_juridicas: string | null;
          ocupacion: string | null;
          porcentaje_honorarios: number;
          requiere_centro_conciliacion: boolean;
          situacion_urgencia: string | null;
          tipo_servicio: Database["public"]["Enums"]["tipo_servicio"] | null;
          updated_at: string;
        };
        Insert: {
          actualizado_por?: string | null;
          bienes?: string | null;
          cliente_id: string;
          created_at?: string;
          cuotas_honorarios?: number;
          descuento_centro_conciliacion?: number;
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null;
          gastos_mensuales?: number | null;
          id?: string;
          ingresos_mensuales?: number | null;
          objetivo_cliente?: string | null;
          observaciones_juridicas?: string | null;
          ocupacion?: string | null;
          porcentaje_honorarios?: number;
          requiere_centro_conciliacion?: boolean;
          situacion_urgencia?: string | null;
          tipo_servicio?: Database["public"]["Enums"]["tipo_servicio"] | null;
          updated_at?: string;
        };
        Update: {
          actualizado_por?: string | null;
          bienes?: string | null;
          cliente_id?: string;
          created_at?: string;
          cuotas_honorarios?: number;
          descuento_centro_conciliacion?: number;
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null;
          gastos_mensuales?: number | null;
          id?: string;
          ingresos_mensuales?: number | null;
          objetivo_cliente?: string | null;
          observaciones_juridicas?: string | null;
          ocupacion?: string | null;
          porcentaje_honorarios?: number;
          requiere_centro_conciliacion?: boolean;
          situacion_urgencia?: string | null;
          tipo_servicio?: Database["public"]["Enums"]["tipo_servicio"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diagnosticos_actualizado_por_fkey";
            columns: ["actualizado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnosticos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: true;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      notas_internas: {
        Row: {
          autor_id: string | null;
          cliente_id: string;
          contenido: string;
          created_at: string;
          id: number;
        };
        Insert: {
          autor_id?: string | null;
          cliente_id: string;
          contenido: string;
          created_at?: string;
          id?: never;
        };
        Update: {
          autor_id?: string | null;
          cliente_id?: string;
          contenido?: string;
          created_at?: string;
          id?: never;
        };
        Relationships: [
          {
            foreignKeyName: "notas_internas_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notas_internas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      obligaciones: {
        Row: {
          acreedor: string;
          capital: number;
          clase: Database["public"]["Enums"]["clase_credito"];
          concepto: string | null;
          created_at: string;
          descuento_nomina: boolean;
          diagnostico_id: string;
          dias_mora: number | null;
          id: string;
          intereses: number;
          mora: Database["public"]["Enums"]["mora_obligacion"];
          orden: number;
          tipo_garantia: Database["public"]["Enums"]["tipo_garantia"];
          updated_at: string;
        };
        Insert: {
          acreedor: string;
          capital?: number;
          clase?: Database["public"]["Enums"]["clase_credito"];
          concepto?: string | null;
          created_at?: string;
          descuento_nomina?: boolean;
          diagnostico_id: string;
          dias_mora?: number | null;
          id?: string;
          intereses?: number;
          mora?: Database["public"]["Enums"]["mora_obligacion"];
          orden: number;
          tipo_garantia?: Database["public"]["Enums"]["tipo_garantia"];
          updated_at?: string;
        };
        Update: {
          acreedor?: string;
          capital?: number;
          clase?: Database["public"]["Enums"]["clase_credito"];
          concepto?: string | null;
          created_at?: string;
          descuento_nomina?: boolean;
          diagnostico_id?: string;
          dias_mora?: number | null;
          id?: string;
          intereses?: number;
          mora?: Database["public"]["Enums"]["mora_obligacion"];
          orden?: number;
          tipo_garantia?: Database["public"]["Enums"]["tipo_garantia"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "obligaciones_diagnostico_id_fkey";
            columns: ["diagnostico_id"];
            isOneToOne: false;
            referencedRelation: "diagnosticos";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          id: string;
          nombre_completo: string | null;
          rol: Database["public"]["Enums"]["rol_usuario"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          id: string;
          nombre_completo?: string | null;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          nombre_completo?: string | null;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
        };
        Relationships: [];
      };
      propuesta_eventos: {
        Row: {
          created_at: string;
          creado_por: string | null;
          estado_anterior: Database["public"]["Enums"]["estado_propuesta"] | null;
          estado_nuevo: Database["public"]["Enums"]["estado_propuesta"];
          id: number;
          mensaje: string | null;
          propuesta_id: string;
        };
        Insert: {
          created_at?: string;
          creado_por?: string | null;
          estado_anterior?: Database["public"]["Enums"]["estado_propuesta"] | null;
          estado_nuevo: Database["public"]["Enums"]["estado_propuesta"];
          id?: never;
          mensaje?: string | null;
          propuesta_id: string;
        };
        Update: {
          created_at?: string;
          creado_por?: string | null;
          estado_anterior?: Database["public"]["Enums"]["estado_propuesta"] | null;
          estado_nuevo?: Database["public"]["Enums"]["estado_propuesta"];
          id?: never;
          mensaje?: string | null;
          propuesta_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "propuesta_eventos_creado_por_fkey";
            columns: ["creado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "propuesta_eventos_propuesta_id_fkey";
            columns: ["propuesta_id"];
            isOneToOne: false;
            referencedRelation: "propuestas";
            referencedColumns: ["id"];
          },
        ];
      };
      propuesta_redacciones: {
        Row: {
          actualizado_por: string | null;
          cliente_id: string;
          created_at: string;
          honorarios: string | null;
          id: string;
          recomendacion: string | null;
          situacion_economica: string | null;
          situacion_legal: string | null;
          tratamiento: Database["public"]["Enums"]["tratamiento_cliente"];
          updated_at: string;
        };
        Insert: {
          actualizado_por?: string | null;
          cliente_id: string;
          created_at?: string;
          honorarios?: string | null;
          id?: string;
          recomendacion?: string | null;
          situacion_economica?: string | null;
          situacion_legal?: string | null;
          tratamiento?: Database["public"]["Enums"]["tratamiento_cliente"];
          updated_at?: string;
        };
        Update: {
          actualizado_por?: string | null;
          cliente_id?: string;
          created_at?: string;
          honorarios?: string | null;
          id?: string;
          recomendacion?: string | null;
          situacion_economica?: string | null;
          situacion_legal?: string | null;
          tratamiento?: Database["public"]["Enums"]["tratamiento_cliente"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "propuesta_redacciones_actualizado_por_fkey";
            columns: ["actualizado_por"];
            isOneToOne: false;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "propuesta_redacciones_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: true;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      propuestas: {
        Row: {
          cliente_id: string;
          created_at: string;
          documento_path: string | null;
          estado: Database["public"]["Enums"]["estado_propuesta"];
          finalizada_at: string | null;
          id: string;
          mensaje_cliente: string | null;
          updated_at: string;
        };
        Insert: {
          cliente_id: string;
          created_at?: string;
          documento_path?: string | null;
          estado?: Database["public"]["Enums"]["estado_propuesta"];
          finalizada_at?: string | null;
          id?: string;
          mensaje_cliente?: string | null;
          updated_at?: string;
        };
        Update: {
          cliente_id?: string;
          created_at?: string;
          documento_path?: string | null;
          estado?: Database["public"]["Enums"]["estado_propuesta"];
          finalizada_at?: string | null;
          id?: string;
          mensaje_cliente?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "propuestas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: true;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_auth: {
        Row: {
          clave: string;
          cuenta_id: string;
          updated_at: string;
          valor: Json;
        };
        Insert: {
          clave: string;
          cuenta_id: string;
          updated_at?: string;
          valor: Json;
        };
        Update: {
          clave?: string;
          cuenta_id?: string;
          updated_at?: string;
          valor?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "wa_auth_cuenta_id_fkey";
            columns: ["cuenta_id"];
            isOneToOne: false;
            referencedRelation: "wa_cuentas";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_cuentas: {
        Row: {
          cierre_solicitado: boolean;
          conectado_at: string | null;
          created_at: string;
          estado: Database["public"]["Enums"]["wa_estado"];
          id: string;
          nombre: string;
          qr: string | null;
          reinicio_solicitado: boolean;
          telefono: string | null;
          ultimo_error: string | null;
          updated_at: string;
          visto_at: string | null;
        };
        Insert: {
          cierre_solicitado?: boolean;
          conectado_at?: string | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["wa_estado"];
          id?: string;
          nombre?: string;
          qr?: string | null;
          reinicio_solicitado?: boolean;
          telefono?: string | null;
          ultimo_error?: string | null;
          updated_at?: string;
          visto_at?: string | null;
        };
        Update: {
          cierre_solicitado?: boolean;
          conectado_at?: string | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["wa_estado"];
          id?: string;
          nombre?: string;
          qr?: string | null;
          reinicio_solicitado?: boolean;
          telefono?: string | null;
          ultimo_error?: string | null;
          updated_at?: string;
          visto_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      crm_mover_etapa: {
        Args: {
          p_caso_id: string;
          p_etapa_id: string;
          p_autor?: string | null;
          p_motivo?: string | null;
        };
        Returns: undefined;
      };
      crm_normalizar_telefono: { Args: { p_valor: string }; Returns: string | null };
      crm_notificar_caso: {
        Args: { p_caso_id: string; p_titulo: string; p_cuerpo: string; p_excluir?: string | null };
        Returns: undefined;
      };
      crm_registrar_entrante: {
        Args: {
          p_canal: Database["public"]["Enums"]["crm_canal"];
          p_identificador: string;
          p_nombre: string | null;
          p_contenido: string;
          p_id_externo?: string | null;
          p_asunto?: string | null;
          p_fecha?: string | null;
        };
        Returns: {
          caso_id: string;
          mensaje_id: number;
          caso_nuevo: boolean;
          mensaje_nuevo: boolean;
        }[];
      };
      es_admin: { Args: never; Returns: boolean };
      guardar_diagnostico: {
        Args: {
          p_cliente_id: string;
          p_diagnostico: Json;
          p_obligaciones: Json;
          p_actualizado_en?: string | null;
        };
        Returns: { id: string; propuesta_en_diagnostico: boolean }[];
      };
    };
    Enums: {
      clase_credito: "primera" | "segunda" | "tercera" | "cuarta" | "quinta" | "por_verificar";
      crm_canal: "whatsapp" | "correo";
      crm_cierre: "ganado" | "perdido";
      crm_direccion: "entrada" | "salida";
      crm_estado_envio: "pendiente" | "enviado" | "fallido";
      crm_estado_tarea: "pendiente" | "completada" | "cancelada";
      crm_tipo_evento:
        | "creacion"
        | "etapa"
        | "responsable"
        | "proxima_accion"
        | "nota"
        | "tarea_creada"
        | "tarea_completada"
        | "correo_automatico"
        | "analisis_ia"
        | "expediente"
        | "datos";
      crm_tipo_tarea: "documentos" | "recontacto" | "seguimiento" | "otra";
      estado_civil: "soltero" | "casado" | "union_libre" | "divorciado" | "viudo";
      estado_propuesta:
        | "pendiente"
        | "requiere_informacion"
        | "en_diagnostico"
        | "en_elaboracion"
        | "verificando"
        | "finalizada"
        | "cancelada";
      mora_obligacion: "al_dia" | "menos_90_dias" | "mas_90_dias";
      rol_usuario: "admin" | "cliente";
      tipo_documento: "CC" | "CE" | "PA" | "PPT";
      tipo_garantia: "sin_garantia" | "garantia_mobiliaria" | "hipoteca" | "otra_verificar";
      tipo_servicio: "liquidacion_patrimonial" | "acuerdo_pago" | "acuerdo_pago_bilateral";
      tratamiento_cliente: "senor" | "senora";
      wa_estado: "desconectado" | "qr" | "conectando" | "conectado" | "error";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
