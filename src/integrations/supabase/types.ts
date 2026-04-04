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
      allergen_profiles: {
        Row: {
          contains: string[] | null
          created_at: string
          created_by: string | null
          cross_contact_notes: string | null
          cross_contact_risk_score: number | null
          free_from: string[] | null
          id: string
          label_last_verified_at: string | null
          label_status: string
          label_verified_by: string | null
          may_contain: string[] | null
          product_code: string | null
          product_name: string
          updated_at: string
        }
        Insert: {
          contains?: string[] | null
          created_at?: string
          created_by?: string | null
          cross_contact_notes?: string | null
          cross_contact_risk_score?: number | null
          free_from?: string[] | null
          id?: string
          label_last_verified_at?: string | null
          label_status?: string
          label_verified_by?: string | null
          may_contain?: string[] | null
          product_code?: string | null
          product_name: string
          updated_at?: string
        }
        Update: {
          contains?: string[] | null
          created_at?: string
          created_by?: string | null
          cross_contact_notes?: string | null
          cross_contact_risk_score?: number | null
          free_from?: string[] | null
          id?: string
          label_last_verified_at?: string | null
          label_status?: string
          label_verified_by?: string | null
          may_contain?: string[] | null
          product_code?: string | null
          product_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_findings: {
        Row: {
          audit_id: string
          capa_id: string | null
          category: string | null
          closed_at: string | null
          corrective_action: string | null
          created_at: string
          description: string
          evidence: string | null
          finding_number: number
          id: string
          severity: string
          status: string
        }
        Insert: {
          audit_id: string
          capa_id?: string | null
          category?: string | null
          closed_at?: string | null
          corrective_action?: string | null
          created_at?: string
          description: string
          evidence?: string | null
          finding_number?: number
          id?: string
          severity?: string
          status?: string
        }
        Update: {
          audit_id?: string
          capa_id?: string | null
          category?: string | null
          closed_at?: string | null
          corrective_action?: string | null
          created_at?: string
          description?: string
          evidence?: string | null
          finding_number?: number
          id?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          audit_number: string
          audit_type: Database["public"]["Enums"]["audit_type"]
          completed_date: string | null
          created_at: string
          id: string
          lead_auditor_id: string | null
          scheduled_date: string | null
          scope: string | null
          score: number | null
          standard: string | null
          status: Database["public"]["Enums"]["audit_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audit_number?: string
          audit_type?: Database["public"]["Enums"]["audit_type"]
          completed_date?: string | null
          created_at?: string
          id?: string
          lead_auditor_id?: string | null
          scheduled_date?: string | null
          scope?: string | null
          score?: number | null
          standard?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audit_number?: string
          audit_type?: Database["public"]["Enums"]["audit_type"]
          completed_date?: string | null
          created_at?: string
          id?: string
          lead_auditor_id?: string | null
          scheduled_date?: string | null
          scope?: string | null
          score?: number | null
          standard?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calibration_instruments: {
        Row: {
          calibration_frequency_days: number | null
          created_at: string
          id: string
          instrument_id: string
          last_calibration_date: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_calibration_due: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["calibration_status"]
          type: string | null
          updated_at: string
        }
        Insert: {
          calibration_frequency_days?: number | null
          created_at?: string
          id?: string
          instrument_id: string
          last_calibration_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_calibration_due?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["calibration_status"]
          type?: string | null
          updated_at?: string
        }
        Update: {
          calibration_frequency_days?: number | null
          created_at?: string
          id?: string
          instrument_id?: string
          last_calibration_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_calibration_due?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["calibration_status"]
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      calibration_records: {
        Row: {
          calibrated_by: string | null
          calibration_date: string
          certificate_reference: string | null
          created_at: string
          id: string
          instrument_id: string
          next_due_date: string | null
          notes: string | null
          result: Database["public"]["Enums"]["calibration_result"]
        }
        Insert: {
          calibrated_by?: string | null
          calibration_date?: string
          certificate_reference?: string | null
          created_at?: string
          id?: string
          instrument_id: string
          next_due_date?: string | null
          notes?: string | null
          result: Database["public"]["Enums"]["calibration_result"]
        }
        Update: {
          calibrated_by?: string | null
          calibration_date?: string
          certificate_reference?: string | null
          created_at?: string
          id?: string
          instrument_id?: string
          next_due_date?: string | null
          notes?: string | null
          result?: Database["public"]["Enums"]["calibration_result"]
        }
        Relationships: [
          {
            foreignKeyName: "calibration_records_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "calibration_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ccp_monitoring_records: {
        Row: {
          ccp_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_by: string | null
          value: number
          within_limits: boolean
        }
        Insert: {
          ccp_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          value: number
          within_limits?: boolean
        }
        Update: {
          ccp_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          value?: number
          within_limits?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ccp_monitoring_records_ccp_id_fkey"
            columns: ["ccp_id"]
            isOneToOne: false
            referencedRelation: "haccp_ccps"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          approved_by: string[] | null
          approver_ids: string[] | null
          change_number: string
          change_type: Database["public"]["Enums"]["change_type"]
          closed_at: string | null
          created_at: string
          description: string | null
          effectiveness_date: string | null
          effectiveness_result: string | null
          food_safety_impact: string | null
          id: string
          implemented_at: string | null
          implemented_by: string | null
          initiator_id: string | null
          operational_impact: string | null
          quality_impact: string | null
          reason: string | null
          regulatory_impact: string | null
          risk_level: string | null
          status: Database["public"]["Enums"]["change_status"]
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_by?: string[] | null
          approver_ids?: string[] | null
          change_number?: string
          change_type?: Database["public"]["Enums"]["change_type"]
          closed_at?: string | null
          created_at?: string
          description?: string | null
          effectiveness_date?: string | null
          effectiveness_result?: string | null
          food_safety_impact?: string | null
          id?: string
          implemented_at?: string | null
          implemented_by?: string | null
          initiator_id?: string | null
          operational_impact?: string | null
          quality_impact?: string | null
          reason?: string | null
          regulatory_impact?: string | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["change_status"]
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_by?: string[] | null
          approver_ids?: string[] | null
          change_number?: string
          change_type?: Database["public"]["Enums"]["change_type"]
          closed_at?: string | null
          created_at?: string
          description?: string | null
          effectiveness_date?: string | null
          effectiveness_result?: string | null
          food_safety_impact?: string | null
          id?: string
          implemented_at?: string | null
          implemented_by?: string | null
          initiator_id?: string | null
          operational_impact?: string | null
          quality_impact?: string | null
          reason?: string | null
          regulatory_impact?: string | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["change_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
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
      deviations: {
        Row: {
          batch_affected: string | null
          capa_id: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          deviation_number: string
          disposition: string | null
          id: string
          investigation_notes: string | null
          product_affected: string | null
          reported_by: string | null
          severity: Database["public"]["Enums"]["deviation_severity"]
          source: string | null
          status: Database["public"]["Enums"]["deviation_status"]
          title: string
          type: Database["public"]["Enums"]["deviation_type"]
          updated_at: string
        }
        Insert: {
          batch_affected?: string | null
          capa_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          deviation_number?: string
          disposition?: string | null
          id?: string
          investigation_notes?: string | null
          product_affected?: string | null
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["deviation_severity"]
          source?: string | null
          status?: Database["public"]["Enums"]["deviation_status"]
          title: string
          type?: Database["public"]["Enums"]["deviation_type"]
          updated_at?: string
        }
        Update: {
          batch_affected?: string | null
          capa_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          deviation_number?: string
          disposition?: string | null
          id?: string
          investigation_notes?: string | null
          product_affected?: string | null
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["deviation_severity"]
          source?: string | null
          status?: Database["public"]["Enums"]["deviation_status"]
          title?: string
          type?: Database["public"]["Enums"]["deviation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviations_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: string | null
          created_at: string
          created_by: string | null
          doc_type: Database["public"]["Enums"]["document_type"]
          file_url: string | null
          id: string
          linked_entities: string[] | null
          status: Database["public"]["Enums"]["document_status"]
          superseded_at: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_url?: string | null
          id?: string
          linked_entities?: string[] | null
          status?: Database["public"]["Enums"]["document_status"]
          superseded_at?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_url?: string | null
          id?: string
          linked_entities?: string[] | null
          status?: Database["public"]["Enums"]["document_status"]
          superseded_at?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      emp_sample_results: {
        Row: {
          cfu_count: number | null
          corrective_action: string | null
          corrective_action_status: string | null
          created_at: string
          id: string
          notes: string | null
          organism_detected: string | null
          result: string
          sample_date: string
          sampled_by: string | null
          sampling_point_id: string
        }
        Insert: {
          cfu_count?: number | null
          corrective_action?: string | null
          corrective_action_status?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organism_detected?: string | null
          result?: string
          sample_date?: string
          sampled_by?: string | null
          sampling_point_id: string
        }
        Update: {
          cfu_count?: number | null
          corrective_action?: string | null
          corrective_action_status?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organism_detected?: string | null
          result?: string
          sample_date?: string
          sampled_by?: string | null
          sampling_point_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emp_sample_results_sampling_point_id_fkey"
            columns: ["sampling_point_id"]
            isOneToOne: false
            referencedRelation: "emp_sampling_points"
            referencedColumns: ["id"]
          },
        ]
      }
      emp_sampling_points: {
        Row: {
          created_at: string
          frequency: string
          id: string
          location_description: string | null
          point_code: string
          status: string
          surface_type: string | null
          test_type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          location_description?: string | null
          point_code: string
          status?: string
          surface_type?: string | null
          test_type?: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          location_description?: string | null
          point_code?: string
          status?: string
          surface_type?: string | null
          test_type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emp_sampling_points_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "emp_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      emp_zones: {
        Row: {
          area_description: string | null
          created_at: string
          id: string
          risk_level: string
          status: string
          updated_at: string
          zone_name: string
          zone_number: string
          zone_type: string
        }
        Insert: {
          area_description?: string | null
          created_at?: string
          id?: string
          risk_level?: string
          status?: string
          updated_at?: string
          zone_name: string
          zone_number: string
          zone_type?: string
        }
        Update: {
          area_description?: string | null
          created_at?: string
          id?: string
          risk_level?: string
          status?: string
          updated_at?: string
          zone_name?: string
          zone_number?: string
          zone_type?: string
        }
        Relationships: []
      }
      food_defence_threats: {
        Row: {
          attack_scenario: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          likelihood: number
          mitigation_measures: string | null
          residual_risk_score: number | null
          review_date: string | null
          risk_score: number | null
          severity: number
          status: string
          threat_actor: string | null
          threat_type: string
          updated_at: string
        }
        Insert: {
          attack_scenario?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          likelihood?: number
          mitigation_measures?: string | null
          residual_risk_score?: number | null
          review_date?: string | null
          risk_score?: number | null
          severity?: number
          status?: string
          threat_actor?: string | null
          threat_type?: string
          updated_at?: string
        }
        Update: {
          attack_scenario?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          likelihood?: number
          mitigation_measures?: string | null
          residual_risk_score?: number | null
          review_date?: string | null
          risk_score?: number | null
          severity?: number
          status?: string
          threat_actor?: string | null
          threat_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      glass_breakages: {
        Row: {
          all_fragments_recovered: boolean | null
          batch_at_risk: string | null
          breakage_date: string
          corrective_action: string | null
          created_at: string
          id: string
          immediate_action: string | null
          investigation_findings: string | null
          item_id: string | null
          location: string
          product_at_risk: string | null
          product_disposition: string | null
          quantity_broken: number | null
          reported_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          all_fragments_recovered?: boolean | null
          batch_at_risk?: string | null
          breakage_date?: string
          corrective_action?: string | null
          created_at?: string
          id?: string
          immediate_action?: string | null
          investigation_findings?: string | null
          item_id?: string | null
          location: string
          product_at_risk?: string | null
          product_disposition?: string | null
          quantity_broken?: number | null
          reported_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          all_fragments_recovered?: boolean | null
          batch_at_risk?: string | null
          breakage_date?: string
          corrective_action?: string | null
          created_at?: string
          id?: string
          immediate_action?: string | null
          investigation_findings?: string | null
          item_id?: string | null
          location?: string
          product_at_risk?: string | null
          product_disposition?: string | null
          quantity_broken?: number | null
          reported_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "glass_breakages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "glass_register"
            referencedColumns: ["id"]
          },
        ]
      }
      glass_register: {
        Row: {
          created_at: string
          description: string
          id: string
          inspection_frequency: string | null
          item_code: string
          item_type: string
          last_inspected_at: string | null
          location: string
          next_inspection_due: string | null
          purpose: string | null
          quantity: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          inspection_frequency?: string | null
          item_code: string
          item_type?: string
          last_inspected_at?: string | null
          location: string
          next_inspection_due?: string | null
          purpose?: string | null
          quantity?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          inspection_frequency?: string | null
          item_code?: string
          item_type?: string
          last_inspected_at?: string | null
          location?: string
          next_inspection_due?: string | null
          purpose?: string | null
          quantity?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gmp_checklist_items: {
        Row: {
          corrective_action: string | null
          corrective_action_due: string | null
          corrective_action_owner: string | null
          created_at: string
          id: string
          inspection_id: string
          is_critical: boolean | null
          item_description: string
          observation: string | null
          result: string | null
          section: string
        }
        Insert: {
          corrective_action?: string | null
          corrective_action_due?: string | null
          corrective_action_owner?: string | null
          created_at?: string
          id?: string
          inspection_id: string
          is_critical?: boolean | null
          item_description: string
          observation?: string | null
          result?: string | null
          section: string
        }
        Update: {
          corrective_action?: string | null
          corrective_action_due?: string | null
          corrective_action_owner?: string | null
          created_at?: string
          id?: string
          inspection_id?: string
          is_critical?: boolean | null
          item_description?: string
          observation?: string | null
          result?: string | null
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmp_checklist_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "gmp_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      gmp_inspections: {
        Row: {
          area: string
          completed_date: string | null
          created_at: string
          critical_fail_count: number | null
          fail_count: number | null
          id: string
          inspection_type: string
          inspector_id: string | null
          inspector_name: string | null
          notes: string | null
          pass_count: number | null
          scheduled_date: string | null
          score_pct: number | null
          status: string
          updated_at: string
        }
        Insert: {
          area: string
          completed_date?: string | null
          created_at?: string
          critical_fail_count?: number | null
          fail_count?: number | null
          id?: string
          inspection_type?: string
          inspector_id?: string | null
          inspector_name?: string | null
          notes?: string | null
          pass_count?: number | null
          scheduled_date?: string | null
          score_pct?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string
          completed_date?: string | null
          created_at?: string
          critical_fail_count?: number | null
          fail_count?: number | null
          id?: string
          inspection_type?: string
          inspector_id?: string | null
          inspector_name?: string | null
          notes?: string | null
          pass_count?: number | null
          scheduled_date?: string | null
          score_pct?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      haccp_ccps: {
        Row: {
          ccp_number: string
          corrective_action_procedure: string | null
          created_at: string
          created_by: string | null
          critical_limit_lower: number | null
          critical_limit_unit: string | null
          critical_limit_upper: number | null
          hazard_description: string | null
          hazard_type: string
          id: string
          monitoring_frequency: string | null
          monitoring_method: string | null
          process_step: string
          responsible_operator: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ccp_number: string
          corrective_action_procedure?: string | null
          created_at?: string
          created_by?: string | null
          critical_limit_lower?: number | null
          critical_limit_unit?: string | null
          critical_limit_upper?: number | null
          hazard_description?: string | null
          hazard_type?: string
          id?: string
          monitoring_frequency?: string | null
          monitoring_method?: string | null
          process_step: string
          responsible_operator?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ccp_number?: string
          corrective_action_procedure?: string | null
          created_at?: string
          created_by?: string | null
          critical_limit_lower?: number | null
          critical_limit_unit?: string | null
          critical_limit_upper?: number | null
          hazard_description?: string | null
          hazard_type?: string
          id?: string
          monitoring_frequency?: string | null
          monitoring_method?: string | null
          process_step?: string
          responsible_operator?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      improvement_projects: {
        Row: {
          baseline_value: number | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_value: number | null
          description: string | null
          id: string
          methodology: string
          owner: string | null
          savings_actual: number | null
          savings_estimated: number | null
          start_date: string | null
          status: string
          target_completion: string | null
          target_metric: string | null
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          baseline_value?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          methodology?: string
          owner?: string | null
          savings_actual?: number | null
          savings_estimated?: number | null
          start_date?: string | null
          status?: string
          target_completion?: string | null
          target_metric?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          baseline_value?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          methodology?: string
          owner?: string | null
          savings_actual?: number | null
          savings_estimated?: number | null
          start_date?: string | null
          status?: string
          target_completion?: string | null
          target_metric?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      incoming_inspections: {
        Row: {
          coa_verified: boolean | null
          created_at: string
          disposition: string | null
          id: string
          ingredient: string
          inspected_at: string | null
          inspection_number: string
          inspector_id: string | null
          lims_required: boolean | null
          lims_result: string | null
          lot_code: string | null
          notes: string | null
          physical_check_passed: boolean | null
          quantity: number | null
          quantity_unit: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          coa_verified?: boolean | null
          created_at?: string
          disposition?: string | null
          id?: string
          ingredient: string
          inspected_at?: string | null
          inspection_number?: string
          inspector_id?: string | null
          lims_required?: boolean | null
          lims_result?: string | null
          lot_code?: string | null
          notes?: string | null
          physical_check_passed?: boolean | null
          quantity?: number | null
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          coa_verified?: boolean | null
          created_at?: string
          disposition?: string | null
          id?: string
          ingredient?: string
          inspected_at?: string | null
          inspection_number?: string
          inspector_id?: string | null
          lims_required?: boolean | null
          lims_result?: string | null
          lot_code?: string | null
          notes?: string | null
          physical_check_passed?: boolean | null
          quantity?: number | null
          quantity_unit?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_inspections_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      management_reviews: {
        Row: {
          attendees: string[] | null
          created_at: string
          created_by: string | null
          data_pack_generated: boolean | null
          id: string
          minutes: string | null
          review_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string | null
          data_pack_generated?: boolean | null
          id?: string
          minutes?: string | null
          review_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string | null
          data_pack_generated?: boolean | null
          id?: string
          minutes?: string | null
          review_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          source_id: string | null
          source_table: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          source_id?: string | null
          source_table?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          source_id?: string | null
          source_table?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pest_bait_stations: {
        Row: {
          contractor: string | null
          created_at: string
          id: string
          last_inspected_at: string | null
          location: string
          next_inspection_due: string | null
          notes: string | null
          station_code: string
          station_type: string
          status: string
          updated_at: string
        }
        Insert: {
          contractor?: string | null
          created_at?: string
          id?: string
          last_inspected_at?: string | null
          location: string
          next_inspection_due?: string | null
          notes?: string | null
          station_code: string
          station_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          contractor?: string | null
          created_at?: string
          id?: string
          last_inspected_at?: string | null
          location?: string
          next_inspection_due?: string | null
          notes?: string | null
          station_code?: string
          station_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pest_sightings: {
        Row: {
          activity_level: string
          corrective_action: string | null
          corrective_action_status: string | null
          created_at: string
          id: string
          immediate_action: string | null
          location: string
          pest_type: string
          quantity_estimate: string | null
          reported_by: string | null
          sighting_date: string
          status: string
          updated_at: string
        }
        Insert: {
          activity_level?: string
          corrective_action?: string | null
          corrective_action_status?: string | null
          created_at?: string
          id?: string
          immediate_action?: string | null
          location: string
          pest_type: string
          quantity_estimate?: string | null
          reported_by?: string | null
          sighting_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activity_level?: string
          corrective_action?: string | null
          corrective_action_status?: string | null
          created_at?: string
          id?: string
          immediate_action?: string | null
          location?: string
          pest_type?: string
          quantity_estimate?: string | null
          reported_by?: string | null
          sighting_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_specifications: {
        Row: {
          approved_by: string | null
          compliance_status: string | null
          created_at: string
          customer_name: string | null
          effective_date: string | null
          id: string
          last_checked_at: string | null
          parameters: Json | null
          product_code: string | null
          product_name: string
          review_date: string | null
          spec_type: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_by?: string | null
          compliance_status?: string | null
          created_at?: string
          customer_name?: string | null
          effective_date?: string | null
          id?: string
          last_checked_at?: string | null
          parameters?: Json | null
          product_code?: string | null
          product_name: string
          review_date?: string | null
          spec_type?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_by?: string | null
          compliance_status?: string | null
          created_at?: string
          customer_name?: string | null
          effective_date?: string | null
          id?: string
          last_checked_at?: string | null
          parameters?: Json | null
          product_code?: string | null
          product_name?: string
          review_date?: string | null
          spec_type?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      product_tests: {
        Row: {
          batch_number: string | null
          capa_id: string | null
          created_at: string
          id: string
          lab_reference: string | null
          last_tested_date: string | null
          next_due_date: string | null
          product_code: string | null
          product_name: string
          result: string | null
          result_detail: Json | null
          sampling_point: string | null
          status: string
          test_frequency: string | null
          test_type: string
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          capa_id?: string | null
          created_at?: string
          id?: string
          lab_reference?: string | null
          last_tested_date?: string | null
          next_due_date?: string | null
          product_code?: string | null
          product_name: string
          result?: string | null
          result_detail?: Json | null
          sampling_point?: string | null
          status?: string
          test_frequency?: string | null
          test_type?: string
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          capa_id?: string | null
          created_at?: string
          id?: string
          lab_reference?: string | null
          last_tested_date?: string | null
          next_due_date?: string | null
          product_code?: string | null
          product_name?: string
          result?: string | null
          result_detail?: Json | null
          sampling_point?: string | null
          status?: string
          test_frequency?: string | null
          test_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tests_capa_id_fkey"
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
      recall_exercises: {
        Row: {
          affected_lots: string[] | null
          completed_at: string | null
          created_at: string
          exercise_type: string
          id: string
          initiated_at: string | null
          initiated_by: string | null
          notes: string | null
          recovery_rate_pct: number | null
          result: string | null
          scope_description: string | null
          status: string
          time_to_complete_hours: number | null
          title: string
          trigger_reason: string | null
          updated_at: string
        }
        Insert: {
          affected_lots?: string[] | null
          completed_at?: string | null
          created_at?: string
          exercise_type?: string
          id?: string
          initiated_at?: string | null
          initiated_by?: string | null
          notes?: string | null
          recovery_rate_pct?: number | null
          result?: string | null
          scope_description?: string | null
          status?: string
          time_to_complete_hours?: number | null
          title: string
          trigger_reason?: string | null
          updated_at?: string
        }
        Update: {
          affected_lots?: string[] | null
          completed_at?: string | null
          created_at?: string
          exercise_type?: string
          id?: string
          initiated_at?: string | null
          initiated_by?: string | null
          notes?: string | null
          recovery_rate_pct?: number | null
          result?: string | null
          scope_description?: string | null
          status?: string
          time_to_complete_hours?: number | null
          title?: string
          trigger_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regulatory_rules: {
        Row: {
          created_at: string
          description: string | null
          effective_date: string | null
          enforcement_date: string | null
          id: string
          impact_count: number | null
          market: string
          rule_reference: string
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_date?: string | null
          enforcement_date?: string | null
          id?: string
          impact_count?: number | null
          market?: string
          rule_reference: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_date?: string | null
          enforcement_date?: string | null
          id?: string
          impact_count?: number | null
          market?: string
          rule_reference?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_action_items: {
        Row: {
          capa_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          owner: string | null
          priority: string | null
          review_id: string
          status: string
          updated_at: string
        }
        Insert: {
          capa_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          owner?: string | null
          priority?: string | null
          review_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          capa_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          owner?: string | null
          priority?: string | null
          review_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_action_items_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_action_items_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "management_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_register: {
        Row: {
          category: string
          control_measures: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          likelihood: number
          owner: string | null
          residual_likelihood: number | null
          residual_risk_score: number | null
          residual_severity: number | null
          review_date: string | null
          risk_score: number | null
          severity: number
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          control_measures?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          likelihood?: number
          owner?: string | null
          residual_likelihood?: number | null
          residual_risk_score?: number | null
          residual_severity?: number | null
          review_date?: string | null
          risk_score?: number | null
          severity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          control_measures?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          likelihood?: number
          owner?: string | null
          residual_likelihood?: number | null
          residual_risk_score?: number | null
          residual_severity?: number | null
          review_date?: string | null
          risk_score?: number | null
          severity?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sku_compliance: {
        Row: {
          capa_id: string | null
          compliance_status: string
          created_at: string
          deadline: string | null
          id: string
          market: string
          notes: string | null
          product_code: string | null
          product_name: string
          rule_id: string | null
          updated_at: string
        }
        Insert: {
          capa_id?: string | null
          compliance_status?: string
          created_at?: string
          deadline?: string | null
          id?: string
          market?: string
          notes?: string | null
          product_code?: string | null
          product_name: string
          rule_id?: string | null
          updated_at?: string
        }
        Update: {
          capa_id?: string | null
          compliance_status?: string
          created_at?: string
          deadline?: string | null
          id?: string
          market?: string
          notes?: string | null
          product_code?: string | null
          product_name?: string
          rule_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_compliance_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_compliance_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "regulatory_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      specialty_certifications: {
        Row: {
          approved_ingredients: Json | null
          audit_date: string | null
          certificate_number: string | null
          certification_type: string
          certifying_body: string | null
          created_at: string
          effective_date: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          product_scope: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_ingredients?: Json | null
          audit_date?: string | null
          certificate_number?: string | null
          certification_type: string
          certifying_body?: string | null
          created_at?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_scope?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_ingredients?: Json | null
          audit_date?: string | null
          certificate_number?: string | null
          certification_type?: string
          certifying_body?: string | null
          created_at?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_scope?: string | null
          status?: string
          updated_at?: string
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
      traceability_lots: {
        Row: {
          batch_date: string | null
          created_at: string
          created_by: string | null
          id: string
          input_lots: string[] | null
          lot_number: string
          notes: string | null
          output_lots: string[] | null
          product_code: string | null
          product_name: string
          quantity: number | null
          quantity_unit: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          batch_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_lots?: string[] | null
          lot_number: string
          notes?: string | null
          output_lots?: string[] | null
          product_code?: string | null
          product_name: string
          quantity?: number | null
          quantity_unit?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_lots?: string[] | null
          lot_number?: string
          notes?: string | null
          output_lots?: string[] | null
          product_code?: string | null
          product_name?: string
          quantity?: number | null
          quantity_unit?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_records: {
        Row: {
          created_at: string
          effectiveness_assessed: boolean | null
          effectiveness_score: number | null
          employee_id_ref: string | null
          employee_name: string
          format: string | null
          id: string
          notes: string | null
          qualification_expiry: string | null
          qualification_name: string | null
          recorded_by: string | null
          result: Database["public"]["Enums"]["training_result"]
          topic: string
          trainer: string | null
          training_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effectiveness_assessed?: boolean | null
          effectiveness_score?: number | null
          employee_id_ref?: string | null
          employee_name: string
          format?: string | null
          id?: string
          notes?: string | null
          qualification_expiry?: string | null
          qualification_name?: string | null
          recorded_by?: string | null
          result?: Database["public"]["Enums"]["training_result"]
          topic: string
          trainer?: string | null
          training_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effectiveness_assessed?: boolean | null
          effectiveness_score?: number | null
          employee_id_ref?: string | null
          employee_name?: string
          format?: string | null
          id?: string
          notes?: string | null
          qualification_expiry?: string | null
          qualification_name?: string | null
          recorded_by?: string | null
          result?: Database["public"]["Enums"]["training_result"]
          topic?: string
          trainer?: string | null
          training_date?: string
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
      water_tests: {
        Row: {
          corrective_action: string | null
          created_at: string
          id: string
          next_due_date: string | null
          notes: string | null
          parameter_values: Json | null
          result: string
          sampling_point: string
          status: string
          test_date: string
          test_type: string
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          parameter_values?: Json | null
          result?: string
          sampling_point: string
          status?: string
          test_date?: string
          test_type?: string
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          parameter_values?: Json | null
          result?: string
          sampling_point?: string
          status?: string
          test_date?: string
          test_type?: string
          tested_by?: string | null
          updated_at?: string
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
      audit_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      audit_type: "internal" | "external" | "supplier"
      calibration_result: "in_tolerance" | "out_of_tolerance"
      calibration_status:
        | "in_calibration"
        | "due_soon"
        | "overdue"
        | "out_of_service"
      capa_severity: "critical" | "high" | "medium" | "low"
      capa_status:
        | "initiation"
        | "root_cause_analysis"
        | "action_assignment"
        | "preventive_action"
        | "verification"
        | "effectiveness_check"
        | "closure"
      change_status:
        | "initiated"
        | "risk_assessment"
        | "pending_approval"
        | "approved"
        | "implementing"
        | "effectiveness_check"
        | "closed"
        | "rejected"
      change_type: "product" | "process" | "equipment" | "supplier" | "document"
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
      deviation_severity: "critical" | "high" | "medium" | "low"
      deviation_status: "open" | "investigating" | "dispositioned" | "closed"
      deviation_type: "process" | "product" | "regulatory"
      document_status: "draft" | "pending_approval" | "approved" | "superseded"
      document_type:
        | "food_safety_plan"
        | "haccp_plan"
        | "sop"
        | "quality_plan"
        | "specification"
        | "prp"
        | "ewi"
      inspection_status:
        | "pending"
        | "in_progress"
        | "accepted"
        | "rejected"
        | "conditional"
        | "hold_pending_lims"
      supplier_status:
        | "approved"
        | "conditional"
        | "suspended"
        | "rejected"
        | "pending"
      training_result: "pass" | "fail" | "pending"
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
      audit_status: ["scheduled", "in_progress", "completed", "cancelled"],
      audit_type: ["internal", "external", "supplier"],
      calibration_result: ["in_tolerance", "out_of_tolerance"],
      calibration_status: [
        "in_calibration",
        "due_soon",
        "overdue",
        "out_of_service",
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
      change_status: [
        "initiated",
        "risk_assessment",
        "pending_approval",
        "approved",
        "implementing",
        "effectiveness_check",
        "closed",
        "rejected",
      ],
      change_type: ["product", "process", "equipment", "supplier", "document"],
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
      deviation_severity: ["critical", "high", "medium", "low"],
      deviation_status: ["open", "investigating", "dispositioned", "closed"],
      deviation_type: ["process", "product", "regulatory"],
      document_status: ["draft", "pending_approval", "approved", "superseded"],
      document_type: [
        "food_safety_plan",
        "haccp_plan",
        "sop",
        "quality_plan",
        "specification",
        "prp",
        "ewi",
      ],
      inspection_status: [
        "pending",
        "in_progress",
        "accepted",
        "rejected",
        "conditional",
        "hold_pending_lims",
      ],
      supplier_status: [
        "approved",
        "conditional",
        "suspended",
        "rejected",
        "pending",
      ],
      training_result: ["pass", "fail", "pending"],
    },
  },
} as const
