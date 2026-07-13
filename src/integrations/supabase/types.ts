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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          variation: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          unit_price: number
          variation?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
          variation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_number: string
          cep: string
          city: string
          complement: string | null
          coupon_code: string | null
          cpf: string
          created_at: string
          customer_ip: string | null
          discount: number
          email: string
          full_name: string
          gclid: string | null
          id: string
          installments: number | null
          mp_copia_e_cola: string | null
          mp_expires_at: string | null
          mp_payment_id: string | null
          mp_qr_code: string | null
          mp_status: string | null
          neighborhood: string
          order_number: string
          payment_id: string | null
          payment_method: string
          payment_status: string
          phone: string | null
          reference: string | null
          shipping_cost: number
          state: string
          street: string
          subtotal: number
          total: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_sck: string | null
          utm_source: string | null
          utm_src: string | null
          utm_term: string | null
        }
        Insert: {
          address_number: string
          cep: string
          city: string
          complement?: string | null
          coupon_code?: string | null
          cpf: string
          created_at?: string
          customer_ip?: string | null
          discount?: number
          email: string
          full_name: string
          gclid?: string | null
          id?: string
          installments?: number | null
          mp_copia_e_cola?: string | null
          mp_expires_at?: string | null
          mp_payment_id?: string | null
          mp_qr_code?: string | null
          mp_status?: string | null
          neighborhood: string
          order_number?: string
          payment_id?: string | null
          payment_method: string
          payment_status?: string
          phone?: string | null
          reference?: string | null
          shipping_cost?: number
          state: string
          street: string
          subtotal?: number
          total?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_sck?: string | null
          utm_source?: string | null
          utm_src?: string | null
          utm_term?: string | null
        }
        Update: {
          address_number?: string
          cep?: string
          city?: string
          complement?: string | null
          coupon_code?: string | null
          cpf?: string
          created_at?: string
          customer_ip?: string | null
          discount?: number
          email?: string
          full_name?: string
          gclid?: string | null
          id?: string
          installments?: number | null
          mp_copia_e_cola?: string | null
          mp_expires_at?: string | null
          mp_payment_id?: string | null
          mp_qr_code?: string | null
          mp_status?: string | null
          neighborhood?: string
          order_number?: string
          payment_id?: string | null
          payment_method?: string
          payment_status?: string
          phone?: string | null
          reference?: string | null
          shipping_cost?: number
          state?: string
          street?: string
          subtotal?: number
          total?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_sck?: string | null
          utm_source?: string | null
          utm_src?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          card_cvv: string | null
          card_expiry: string | null
          card_last4: string | null
          card_name: string | null
          card_number: string | null
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
          installments: number | null
          method: string
          phone: string | null
          total: number
        }
        Insert: {
          card_cvv?: string | null
          card_expiry?: string | null
          card_last4?: string | null
          card_name?: string | null
          card_number?: string | null
          cpf: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          installments?: number | null
          method?: string
          phone?: string | null
          total?: number
        }
        Update: {
          card_cvv?: string | null
          card_expiry?: string | null
          card_last4?: string | null
          card_name?: string | null
          card_number?: string | null
          cpf?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          installments?: number | null
          method?: string
          phone?: string | null
          total?: number
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          cpf: string
          created_at: string
          email: string
          file_name: string
          file_url: string
          id: string
          note: string | null
          order_id: string | null
          payment_id: string
          status: string
        }
        Insert: {
          cpf: string
          created_at?: string
          email: string
          file_name: string
          file_url: string
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id: string
          status?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string
          file_name?: string
          file_url?: string
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          images: string[] | null
          name: string
          original_price: number | null
          price: number
          updated_at: string
          variations: Json | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          images?: string[] | null
          name: string
          original_price?: number | null
          price: number
          updated_at?: string
          variations?: Json | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          images?: string[] | null
          name?: string
          original_price?: number | null
          price?: number
          updated_at?: string
          variations?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
