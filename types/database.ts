export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          payload: Json
          profile_id: string | null
          session_id: string | null
          ts: string
          type: string
        }
        Insert: {
          id?: string
          payload?: Json
          profile_id?: string | null
          session_id?: string | null
          ts?: string
          type: string
        }
        Update: {
          id?: string
          payload?: Json
          profile_id?: string | null
          session_id?: string | null
          ts?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total_cents: number
          options: Json
          order_id: string
          product_id: string | null
          qty: number
        }
        Insert: {
          id?: string
          line_total_cents: number
          options?: Json
          order_id: string
          product_id?: string | null
          qty: number
        }
        Update: {
          id?: string
          line_total_cents?: number
          options?: Json
          order_id?: string
          product_id?: string | null
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: Json | null
          created_at: string
          currency: string
          dest_lat: number | null
          dest_lng: number | null
          fake_total_cents: number
          id: string
          origin_lat: number | null
          origin_lng: number | null
          origin_place_id: string | null
          postal_code: string | null
          profile_id: string
          region_id: string | null
          route_polyline: Json | null
          route_source: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          address?: Json | null
          created_at?: string
          currency?: string
          dest_lat?: number | null
          dest_lng?: number | null
          fake_total_cents?: number
          id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          origin_place_id?: string | null
          postal_code?: string | null
          profile_id: string
          region_id?: string | null
          route_polyline?: Json | null
          route_source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          address?: Json | null
          created_at?: string
          currency?: string
          dest_lat?: number | null
          dest_lng?: number | null
          fake_total_cents?: number
          id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          origin_place_id?: string | null
          postal_code?: string | null
          profile_id?: string
          region_id?: string | null
          route_polyline?: Json | null
          route_source?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "orders_origin_place_id_fkey"
            columns: ["origin_place_id"]
            isOneToOne: false
            referencedRelation: "osm_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      osm_places: {
        Row: {
          fetched_at: string
          id: string
          kind: string | null
          lat: number
          lng: number
          name: string
          region_id: string
          source: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          kind?: string | null
          lat: number
          lng: number
          name: string
          region_id: string
          source?: string
        }
        Update: {
          fetched_at?: string
          id?: string
          kind?: string | null
          lat?: number
          lng?: number
          name?: string
          region_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "osm_places_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_generated: boolean
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          options: Json
          price_cents: number
          rating: number
          vendor_id: string
        }
        Insert: {
          ai_generated?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          options?: Json
          price_cents: number
          rating?: number
          vendor_id: string
        }
        Update: {
          ai_generated?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          options?: Json
          price_cents?: number
          rating?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          is_anonymous: boolean
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id: string
          is_anonymous?: boolean
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          is_anonymous?: boolean
        }
        Relationships: []
      }
      regions: {
        Row: {
          catalog_generated: boolean
          centroid_lat: number | null
          centroid_lng: number | null
          city_centroid_lat: number | null
          city_centroid_lng: number | null
          created_at: string
          id: string
          places_fetched: boolean
          postal_prefix: string
        }
        Insert: {
          catalog_generated?: boolean
          centroid_lat?: number | null
          centroid_lng?: number | null
          city_centroid_lat?: number | null
          city_centroid_lng?: number | null
          created_at?: string
          id?: string
          places_fetched?: boolean
          postal_prefix: string
        }
        Update: {
          catalog_generated?: boolean
          centroid_lat?: number | null
          centroid_lng?: number | null
          city_centroid_lat?: number | null
          city_centroid_lng?: number | null
          created_at?: string
          id?: string
          places_fetched?: boolean
          postal_prefix?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          ai_generated: boolean
          author: string
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          ai_generated?: boolean
          author: string
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating?: number
        }
        Update: {
          ai_generated?: boolean
          author?: string
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          achievements: Json
          fake_spent_cents: number
          orders_count: number
          profile_id: string
          streak_days: number
        }
        Insert: {
          achievements?: Json
          fake_spent_cents?: number
          orders_count?: number
          profile_id: string
          streak_days?: number
        }
        Update: {
          achievements?: Json
          fake_spent_cents?: number
          orders_count?: number
          profile_id?: string
          streak_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          hero_image: string | null
          id: string
          kind: Database["public"]["Enums"]["vendor_kind"]
          locale: string
          name: string
          rating: number
        }
        Insert: {
          created_at?: string
          hero_image?: string | null
          id?: string
          kind: Database["public"]["Enums"]["vendor_kind"]
          locale?: string
          name: string
          rating?: number
        }
        Update: {
          created_at?: string
          hero_image?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["vendor_kind"]
          locale?: string
          name?: string
          rating?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          p_dest_lat: number
          p_dest_lng: number
          p_fake_total_cents: number
          p_items: Json
          p_postal: string
          p_region_id: string
        }
        Returns: string
      }
    }
    Enums: {
      order_status: "accepted" | "preparing" | "picked_up" | "nearby" | "never"
      vendor_kind: "store" | "restaurant"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: ["accepted", "preparing", "picked_up", "nearby", "never"],
      vendor_kind: ["store", "restaurant"],
    },
  },
} as const

