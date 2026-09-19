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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
