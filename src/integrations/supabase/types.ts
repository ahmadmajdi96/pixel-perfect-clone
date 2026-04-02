export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      capa_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          capa_id: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          assigned_to?: string | null
          capa_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          capa_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capa_actions_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
        ]
      }
      capa_timeline: {
        Row: {
          capa_id: string
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          capa_id: string
          created_at?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          capa_id?: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capa_timeline_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
        ]
      }
      capas: {
        Row: {
          assigned_to: string | null
          capa_number: string
          closed_at: string | null
          created_at: string
          description: string | null
          effectiveness_check_date: string | null
          effectiveness_result: string | null
          id: string
          owner_id: string | null
          product_line: string | null
          root_cause_notes: string | null
          severity: Database["public"]["Enums"]["capa_severity"]
          sla_deadline: string | null
          source_reference: string | null
          source_type: string
          status: Database["public"]["Enums"]["capa_status"]
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          capa_number?: string
          closed_at?: string | null
          created_at?: string
          description?: string | null
          effectiveness_check_date?: string | null
          effectiveness_result?: string | null
          id?: string
          owner_id?: string | null
          product_line?: string | null
          root_cause_notes?: string | null
          severity?: Database["public"]["Enums"]["capa_severity"]
          sla_deadline?: string | null
          source_reference?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["capa_status"]
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          capa_number?: string
          closed_at?: string | null
          created_at?: string
          description?: string | null
          effectiveness_check_date?: string | null
          effectiveness_result?: string | null
          id?: string
          owner_id?: string | null
          product_line?: string | null
          root_cause_notes?: string | null
          severity?: Database["public"]["Enums"]["capa_severity"]
          sla_deadline?: string | null
          source_reference?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["capa_status"]
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      complaint_investigations: {
        Row: {
          complaint_id: string
          completed_at: string | null
          contributing_factors: string | null
          created_at: string
          findings: string | null
          id: string
          investigator_id: string | null
          probable_cause: string | null
          recommendations: string | null
          trend_assessment: string | null
          updated_at: string
        }
        Insert: {
          complaint_id: string
          completed_at?: string | null
          contributing_factors?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          investigator_id?: string | null
          probable_cause?: string | null
          recommendations?: string | null
          trend_assessment?: string | null
          updated_at?: string
        }
        Update: {
          complaint_id?: string
          completed_at?: string | null
          contributing_factors?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          investigator_id?: string | null
          probable_cause?: string | null
          recommendations?: string | null
          trend_assessment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_investigations_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          batch_number: string | null
          capa_id: string | null
          complainant_contact: string | null
          complainant_name: string | null
          complaint_number: string
          complaint_type: Database["public"]["Enums"]["complaint_type"]
          created_at: string
          description: string
          id: string
          logged_by: string | null
          product: string
          regulatory_flag: boolean
          resolved_at: string | null
          severity: Database["public"]["Enums"]["complaint_severity"]
          source: string
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          capa_id?: string | null
          complainant_contact?: string | null
          complainant_name?: string | null
          complaint_number?: string
          complaint_type?: Database["public"]["Enums"]["complaint_type"]
          created_at?: string
          description: string
          id?: string
          logged_by?: string | null
          product: string
          regulatory_flag?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["complaint_severity"]
          source?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          capa_id?: string | null
          complainant_contact?: string | null
          complainant_name?: string | null
          complaint_number?: string
          complaint_type?: Database["public"]["Enums"]["complaint_type"]
          created_at?: string
          description?: string
          id?: string
          logged_by?: string | null
          product?: string
          regulatory_flag?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["complaint_severity"]
          source?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_coas: {
        Row: {
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          ingredient: string
          issue_date: string | null
          lot_number: string | null
          status: string
          supplier_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          ingredient: string
          issue_date?: string | null
          lot_number?: string | null
          status?: string
          supplier_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          ingredient?: string
          issue_date?: string | null
          lot_number?: string | null
          status?: string
          supplier_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_coas_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_scorecards: {
        Row: {
          compliance_score: number | null
          created_at: string
          delivery_score: number | null
          documentation_score: number | null
          id: string
          notes: string | null
          overall_score: number | null
          period: string
          quality_score: number | null
          responsiveness_score: number | null
          scored_by: string | null
          supplier_id: string
        }
        Insert: {
          compliance_score?: number | null
          created_at?: string
          delivery_score?: number | null
          documentation_score?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          period: string
          quality_score?: number | null
          responsiveness_score?: number | null
          scored_by?: string | null
          supplier_id: string
        }
        Update: {
          compliance_score?: number | null
          created_at?: string
          delivery_score?: number | null
          documentation_score?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          period?: string
          quality_score?: number | null
          responsiveness_score?: number | null
          scored_by?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_scorecards_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          categories: string[] | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          last_audit_date: string | null
          name: string
          next_requalification_date: string | null
          notes: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_audit_date?: string | null
          name: string
          next_requalification_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_audit_date?: string | null
          name?: string
          next_requalification_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "qa_manager"
        | "food_safety_manager"
        | "quality_technician"
        | "food_technologist"
        | "supplier_quality_manager"
        | "plant_manager"
        | "system_admin"
      capa_severity: "critical" | "high" | "medium" | "low"
      capa_status:
        | "initiation"
        | "root_cause_analysis"
        | "action_assignment"
        | "preventive_action"
        | "verification"
        | "effectiveness_check"
        | "closure"
      complaint_severity: "critical" | "high" | "medium" | "low"
      complaint_status: "logged" | "investigating" | "resolved" | "closed"
      complaint_type:
        | "foreign_body"
        | "allergen"
        | "mislabeling"
        | "quality_defect"
        | "packaging"
        | "taste_odor"
        | "microbiological"
        | "chemical"
        | "other"
      supplier_status:
        | "approved"
        | "conditional"
        | "suspended"
        | "rejected"
        | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "qa_manager",
        "food_safety_manager",
        "quality_technician",
        "food_technologist",
        "supplier_quality_manager",
        "plant_manager",
        "system_admin",
      ],
      capa_severity: ["critical", "high", "medium", "low"],
      capa_status: [
        "initiation",
        "root_cause_analysis",
        "action_assignment",
        "preventive_action",
        "verification",
        "effectiveness_check",
        "closure",
      ],
      complaint_severity: ["critical", "high", "medium", "low"],
      complaint_status: ["logged", "investigating", "resolved", "closed"],
      complaint_type: [
        "foreign_body",
        "allergen",
        "mislabeling",
        "quality_defect",
        "packaging",
        "taste_odor",
        "microbiological",
        "chemical",
        "other",
      ],
      supplier_status: [
        "approved",
        "conditional",
        "suspended",
        "rejected",
        "pending",
      ],
    },
  },
} as const
