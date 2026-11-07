
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"business_id": string | null,"created_at": string,"data": Json | null,"entity": string,"entity_id": string | null,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"business_id"?: string | null,"created_at"?: string,"data"?: Json | null,"entity": string,"entity_id"?: string | null,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"business_id"?: string | null,"created_at"?: string,"data"?: Json | null,"entity"?: string,"entity_id"?: string | null,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"availability_rules": {
                  Row: {
                    "business_id": string,"created_at": string,"end_time": string,"id": string,"professional_id": string,"start_time": string,"unit_id": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"end_time": string,"id"?: string,"professional_id": string,"start_time": string,"unit_id": string,"weekday": number
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"end_time"?: string,"id"?: string,"professional_id"?: string,"start_time"?: string,"unit_id"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_rules_business_id_professional_id_fkey"
      columns: ["business_id","professional_id"]
isOneToOne: false
      referencedRelation: "professionals"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "availability_rules_business_id_unit_id_fkey"
      columns: ["business_id","unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "buffer_after_min": number,"buffer_before_min": number,"business_id": string,"cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": Database["public"]['Enums']["cancel_actor"] | null,"client_id": string,"created_at": string,"created_by": string | null,"deposit_cents": number,"ends_at": string,"hold_expires_at": string | null,"id": string,"idempotency_key": string | null,"internal_notes": string | null,"notes": string | null,"occupied": unknown,"price_cents": number,"professional_id": string,"service_id": string,"source": Database["public"]['Enums']["booking_source"],"starts_at": string,"status": Database["public"]['Enums']["booking_status"],"token_version": number,"unit_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "buffer_after_min"?: number,"buffer_before_min"?: number,"business_id": string,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: Database["public"]['Enums']["cancel_actor"] | null,"client_id": string,"created_at"?: string,"created_by"?: string | null,"deposit_cents"?: number,"ends_at": string,"hold_expires_at"?: string | null,"id"?: string,"idempotency_key"?: string | null,"internal_notes"?: string | null,"notes"?: string | null,"occupied"?: never,"price_cents"?: number,"professional_id": string,"service_id": string,"source"?: Database["public"]['Enums']["booking_source"],"starts_at": string,"status"?: Database["public"]['Enums']["booking_status"],"token_version"?: number,"unit_id": string,"updated_at"?: string
                  }
                  Update: {
                    "buffer_after_min"?: number,"buffer_before_min"?: number,"business_id"?: string,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: Database["public"]['Enums']["cancel_actor"] | null,"client_id"?: string,"created_at"?: string,"created_by"?: string | null,"deposit_cents"?: number,"ends_at"?: string,"hold_expires_at"?: string | null,"id"?: string,"idempotency_key"?: string | null,"internal_notes"?: string | null,"notes"?: string | null,"occupied"?: never,"price_cents"?: number,"professional_id"?: string,"service_id"?: string,"source"?: Database["public"]['Enums']["booking_source"],"starts_at"?: string,"status"?: Database["public"]['Enums']["booking_status"],"token_version"?: number,"unit_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_business_id_client_id_fkey"
      columns: ["business_id","client_id"]
isOneToOne: false
      referencedRelation: "client_stats"
      referencedColumns: ["business_id","client_id"]
    },{
      foreignKeyName: "bookings_business_id_client_id_fkey"
      columns: ["business_id","client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "bookings_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_business_id_professional_id_fkey"
      columns: ["business_id","professional_id"]
isOneToOne: false
      referencedRelation: "professionals"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "bookings_business_id_service_id_fkey"
      columns: ["business_id","service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "bookings_business_id_unit_id_fkey"
      columns: ["business_id","unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"business_members": {
                  Row: {
                    "business_id": string,"created_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_members_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "booking_hold_min": number,"cancellation_window_hours": number,"created_at": string,"currency": string,"description": string | null,"email": string | null,"id": string,"locale": string,"logo_url": string | null,"name": string,"phone": string | null,"reminder_24h": boolean,"reminder_2h": boolean,"slot_interval_min": number,"slug": string,"timezone": string,"updated_at": string,"whatsapp_enabled": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_hold_min"?: number,"cancellation_window_hours"?: number,"created_at"?: string,"currency"?: string,"description"?: string | null,"email"?: string | null,"id"?: string,"locale"?: string,"logo_url"?: string | null,"name": string,"phone"?: string | null,"reminder_24h"?: boolean,"reminder_2h"?: boolean,"slot_interval_min"?: number,"slug": string,"timezone"?: string,"updated_at"?: string,"whatsapp_enabled"?: boolean
                  }
                  Update: {
                    "booking_hold_min"?: number,"cancellation_window_hours"?: number,"created_at"?: string,"currency"?: string,"description"?: string | null,"email"?: string | null,"id"?: string,"locale"?: string,"logo_url"?: string | null,"name"?: string,"phone"?: string | null,"reminder_24h"?: boolean,"reminder_2h"?: boolean,"slot_interval_min"?: number,"slug"?: string,"timezone"?: string,"updated_at"?: string,"whatsapp_enabled"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"clients": {
                  Row: {
                    "anonymized_at": string | null,"business_id": string,"consent_at": string | null,"consent_version": string | null,"created_at": string,"email": string | null,"id": string,"name": string,"notes": string | null,"phone": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anonymized_at"?: string | null,"business_id": string,"consent_at"?: string | null,"consent_version"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "anonymized_at"?: string | null,"business_id"?: string,"consent_at"?: string | null,"consent_version"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"holidays": {
                  Row: {
                    "business_id": string,"created_at": string,"date": string,"id": string,"name": string,"unit_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"date": string,"id"?: string,"name": string,"unit_id"?: string | null
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"date"?: string,"id"?: string,"name"?: string,"unit_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "holidays_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "holidays_business_id_unit_id_fkey"
      columns: ["business_id","unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"business_id": string,"created_at": string,"email": string,"id": string,"invited_by": string | null,"professional_id": string | null,"role": Database["public"]['Enums']["member_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"business_id": string,"created_at"?: string,"email": string,"id"?: string,"invited_by"?: string | null,"professional_id"?: string | null,"role": Database["public"]['Enums']["member_role"]
                  }
                  Update: {
                    "accepted_at"?: string | null,"business_id"?: string,"created_at"?: string,"email"?: string,"id"?: string,"invited_by"?: string | null,"professional_id"?: string | null,"role"?: Database["public"]['Enums']["member_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_business_id_professional_id_fkey"
      columns: ["business_id","professional_id"]
isOneToOne: false
      referencedRelation: "professionals"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "attempts": number,"booking_id": string | null,"business_id": string,"channel": Database["public"]['Enums']["notification_channel"],"created_at": string,"dedupe_key": string | null,"id": string,"last_error": string | null,"locked_at": string | null,"max_attempts": number,"payload": NonNullable<Json>,"provider_message_id": string | null,"recipient": string,"scheduled_for": string,"sent_at": string | null,"status": Database["public"]['Enums']["notification_status"],"template": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"booking_id"?: string | null,"business_id": string,"channel": Database["public"]['Enums']["notification_channel"],"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"last_error"?: string | null,"locked_at"?: string | null,"max_attempts"?: number,"payload"?: NonNullable<Json>,"provider_message_id"?: string | null,"recipient": string,"scheduled_for"?: string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["notification_status"],"template": string
                  }
                  Update: {
                    "attempts"?: number,"booking_id"?: string | null,"business_id"?: string,"channel"?: Database["public"]['Enums']["notification_channel"],"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"last_error"?: string | null,"locked_at"?: string | null,"max_attempts"?: number,"payload"?: NonNullable<Json>,"provider_message_id"?: string | null,"recipient"?: string,"scheduled_for"?: string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["notification_status"],"template"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_cents": number,"attempts": number,"booking_id": string,"business_id": string,"checkout_url": string | null,"created_at": string,"expires_at": string | null,"id": string,"last_error": string | null,"method": Database["public"]['Enums']["payment_method"],"pix_qr_code": string | null,"pix_qr_code_base64": string | null,"provider": string,"provider_payment_id": string | null,"raw": Json | null,"refunded_cents": number,"status": Database["public"]['Enums']["payment_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"attempts"?: number,"booking_id": string,"business_id": string,"checkout_url"?: string | null,"created_at"?: string,"expires_at"?: string | null,"id"?: string,"last_error"?: string | null,"method": Database["public"]['Enums']["payment_method"],"pix_qr_code"?: string | null,"pix_qr_code_base64"?: string | null,"provider": string,"provider_payment_id"?: string | null,"raw"?: Json | null,"refunded_cents"?: number,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"attempts"?: number,"booking_id"?: string,"business_id"?: string,"checkout_url"?: string | null,"created_at"?: string,"expires_at"?: string | null,"id"?: string,"last_error"?: string | null,"method"?: Database["public"]['Enums']["payment_method"],"pix_qr_code"?: string | null,"pix_qr_code_base64"?: string | null,"provider"?: string,"provider_payment_id"?: string | null,"raw"?: Json | null,"refunded_cents"?: number,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"professional_units": {
                  Row: {
                    "business_id": string,"professional_id": string,"unit_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"professional_id": string,"unit_id": string
                  }
                  Update: {
                    "business_id"?: string,"professional_id"?: string,"unit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "professional_units_business_id_professional_id_fkey"
      columns: ["business_id","professional_id"]
isOneToOne: false
      referencedRelation: "professionals"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "professional_units_business_id_unit_id_fkey"
      columns: ["business_id","unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"professionals": {
                  Row: {
                    "active": boolean,"avatar_url": string | null,"bio": string | null,"business_id": string,"color": string,"created_at": string,"id": string,"name": string,"sort_order": number,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"avatar_url"?: string | null,"bio"?: string | null,"business_id": string,"color"?: string,"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"user_id"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"avatar_url"?: string | null,"bio"?: string | null,"business_id"?: string,"color"?: string,"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "professionals_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"service_professionals": {
                  Row: {
                    "business_id": string,"professional_id": string,"service_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"professional_id": string,"service_id": string
                  }
                  Update: {
                    "business_id"?: string,"professional_id"?: string,"service_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_professionals_business_id_professional_id_fkey"
      columns: ["business_id","professional_id"]
isOneToOne: false
      referencedRelation: "professionals"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "service_professionals_business_id_service_id_fkey"
      columns: ["business_id","service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"services": {
                  Row: {
                    "active": boolean,"buffer_after_min": number,"buffer_before_min": number,"business_id": string,"category": string | null,"created_at": string,"deposit_type": Database["public"]['Enums']["deposit_type"],"deposit_value": number,"description": string | null,"duration_min": number,"id": string,"max_advance_days": number,"min_notice_min": number,"name": string,"price_cents": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"buffer_after_min"?: number,"buffer_before_min"?: number,"business_id": string,"category"?: string | null,"created_at"?: string,"deposit_type"?: Database["public"]['Enums']["deposit_type"],"deposit_value"?: number,"description"?: string | null,"duration_min": number,"id"?: string,"max_advance_days"?: number,"min_notice_min"?: number,"name": string,"price_cents"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"buffer_after_min"?: number,"buffer_before_min"?: number,"business_id"?: string,"category"?: string | null,"created_at"?: string,"deposit_type"?: Database["public"]['Enums']["deposit_type"],"deposit_value"?: number,"description"?: string | null,"duration_min"?: number,"id"?: string,"max_advance_days"?: number,"min_notice_min"?: number,"name"?: string,"price_cents"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"time_off": {
                  Row: {
                    "business_id": string,"created_at": string,"created_by": string | null,"ends_at": string,"id": string,"kind": Database["public"]['Enums']["time_off_kind"],"professional_id": string,"reason": string | null,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"created_by"?: string | null,"ends_at": string,"id"?: string,"kind"?: Database["public"]['Enums']["time_off_kind"],"professional_id": string,"reason"?: string | null,"starts_at": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"created_by"?: string | null,"ends_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["time_off_kind"],"professional_id"?: string,"reason"?: string | null,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_off_business_id_professional_id_fkey"
      columns: ["business_id","professional_id"]
isOneToOne: false
      referencedRelation: "professionals"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"units": {
                  Row: {
                    "active": boolean,"address": string | null,"business_id": string,"created_at": string,"id": string,"name": string,"phone": string | null,"slug": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"address"?: string | null,"business_id": string,"created_at"?: string,"id"?: string,"name": string,"phone"?: string | null,"slug": string,"timezone"?: string
                  }
                  Update: {
                    "active"?: boolean,"address"?: string | null,"business_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"phone"?: string | null,"slug"?: string,"timezone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "units_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "client_stats": {
                  Row: {
                    "bookings_count": number | null,"business_id": string | null,"client_id": string | null,"completed_count": number | null,"last_visit_at": string | null,"next_booking_at": string | null,"no_show_count": number | null,"revenue_cents": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "clients_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "add_minutes":
{ Args: { "mins": number,"ts": string }; Returns: string
                           },
"booking_id_from_token":
{ Args: { "p_token": string }; Returns: string
                           },
"booking_public_payload":
{ Args: { "p_booking_id": string }; Returns: Json
                           },
"can_manage_professional":
{ Args: { "p_business_id": string,"p_professional_id": string }; Returns: boolean
                           },
"cancel_booking_by_token":
{ Args: { "p_reason"?: string,"p_token": string }; Returns: Json
                           },
"cancel_pending_reminders":
{ Args: { "p_booking_id": string }; Returns: undefined
                           },
"check_rate_limit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"claim_notifications":
{ Args: { "p_limit"?: number }; Returns: {
              "attempts": number,
"booking_id": string | null,
"business_id": string,
"channel": Database["public"]['Enums']["notification_channel"],
"created_at": string,
"dedupe_key": string | null,
"id": string,
"last_error": string | null,
"locked_at": string | null,
"max_attempts": number,
"payload": NonNullable<Json>,
"provider_message_id": string | null,
"recipient": string,
"scheduled_for": string,
"sent_at": string | null,
"status": Database["public"]['Enums']["notification_status"],
"template": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "notifications"
        isOneToOne: false
        isSetofReturn: true
      } },
"claim_refunds":
{ Args: { "p_limit"?: number }; Returns: {
              "amount_cents": number,
"attempts": number,
"booking_id": string,
"business_id": string,
"checkout_url": string | null,
"created_at": string,
"expires_at": string | null,
"id": string,
"last_error": string | null,
"method": Database["public"]['Enums']["payment_method"],
"pix_qr_code": string | null,
"pix_qr_code_base64": string | null,
"provider": string,
"provider_payment_id": string | null,
"raw": Json | null,
"refunded_cents": number,
"status": Database["public"]['Enums']["payment_status"],
"updated_at": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "payments"
        isOneToOne: false
        isSetofReturn: true
      } },
"complete_notification":
{ Args: { "p_error"?: string,"p_id": string,"p_provider_message_id"?: string,"p_status": Database["public"]['Enums']["notification_status"] }; Returns: undefined
                           },
"complete_refund":
{ Args: { "p_error"?: string,"p_ok": boolean,"p_payment_id": string }; Returns: undefined
                           },
"compute_deposit":
{ Args: { "p_price_cents": number,"p_type": Database["public"]['Enums']["deposit_type"],"p_value": number }; Returns: number
                           },
"confirm_payment":
{ Args: { "p_payment_id": string,"p_provider_payment_id": string,"p_raw"?: Json }; Returns: string
                           },
"create_booking":
{ Args: { "p_client_email": string,"p_client_name": string,"p_client_phone": string,"p_consent_version": string,"p_idempotency_key": string,"p_notes": string,"p_professional_id": string,"p_service_id": string,"p_starts_at": string,"p_unit_id": string }; Returns: Json
                           },
"create_business":
{ Args: { "p_name": string,"p_owner_is_professional"?: boolean,"p_owner_name"?: string,"p_slug": string,"p_timezone"?: string,"p_unit_name"?: string }; Returns: string
                           },
"enqueue_booking_notifications":
{ Args: { "p_booking_id": string,"p_template": string }; Returns: undefined
                           },
"expire_pending_bookings":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"fail_payment":
{ Args: { "p_payment_id": string,"p_raw"?: Json,"p_status": Database["public"]['Enums']["payment_status"] }; Returns: undefined
                           },
"get_available_slots":
{ Args: { "p_from": string,"p_ignore_booking_id"?: string,"p_professional_id"?: string,"p_service_id": string,"p_to": string,"p_unit_id": string }; Returns: {
              "ends_at": string,"professional_id": string,"starts_at": string
            }[]
                           },
"get_booking_by_token":
{ Args: { "p_token": string }; Returns: Json
                           },
"get_public_business":
{ Args: { "p_slug": string }; Returns: Json
                           },
"get_reschedule_slots":
{ Args: { "p_from": string,"p_to": string,"p_token": string }; Returns: {
              "ends_at": string,"starts_at": string
            }[]
                           },
"has_role":
{ Args: { "p_business_id": string,"p_roles": (Database["public"]['Enums']["member_role"])[] }; Returns: boolean
                           },
"invite_member":
{ Args: { "p_business_id": string,"p_email": string,"p_professional_id"?: string,"p_role": Database["public"]['Enums']["member_role"] }; Returns: string
                           },
"is_member":
{ Args: { "p_business_id": string }; Returns: boolean
                           },
"is_valid_timezone":
{ Args: { "tz": string }; Returns: boolean
                           },
"lgpd_anonymize":
{ Args: { "p_actor": string,"p_client_id": string }; Returns: undefined
                           },
"lgpd_anonymize_client":
{ Args: { "p_client_id": string }; Returns: undefined
                           },
"lgpd_delete_by_token":
{ Args: { "p_token": string }; Returns: undefined
                           },
"lgpd_export_by_token":
{ Args: { "p_token": string }; Returns: Json
                           },
"lgpd_export_client":
{ Args: { "p_client_id": string }; Returns: Json
                           },
"lgpd_export_client_data":
{ Args: { "p_client_id": string }; Returns: Json
                           },
"manage_token":
{ Args: { "p_booking_id": string }; Returns: string
                           },
"my_professional_id":
{ Args: { "p_business_id": string }; Returns: string
                           },
"notification_context":
{ Args: { "p_notification_id": string }; Returns: Json
                           },
"panel_cancel_booking":
{ Args: { "p_booking_id": string,"p_reason"?: string,"p_refund"?: boolean }; Returns: undefined
                           },
"panel_create_booking":
{ Args: { "p_business_id": string,"p_client_email"?: string,"p_client_id"?: string,"p_client_name"?: string,"p_client_phone"?: string,"p_internal_notes"?: string,"p_professional_id": string,"p_service_id": string,"p_starts_at": string,"p_unit_id": string }; Returns: string
                           },
"report_summary":
{ Args: { "p_business_id": string,"p_from": string,"p_professional_id"?: string,"p_to": string,"p_unit_id"?: string }; Returns: Json
                           },
"reschedule_booking_by_token":
{ Args: { "p_starts_at": string,"p_token": string }; Returns: Json
                           },
"set_weekly_availability":
{ Args: { "p_professional_id": string,"p_rules": Json,"p_unit_id": string }; Returns: number
                           },
"storage_business_id":
{ Args: { "p_name": string }; Returns: string
                           },
"timemultirange":
{ Args: Record<PropertyKey, never>; Returns: unknown
                           },
"upsert_client":
{ Args: { "p_business_id": string,"p_consent_version": string,"p_email": string,"p_name": string,"p_phone": string }; Returns: string
                           }
          }
          Enums: {
            "booking_source": "public"|"panel","booking_status": "pending_payment"|"confirmed"|"completed"|"no_show"|"cancelled"|"expired","cancel_actor": "client"|"business"|"system","deposit_type": "none"|"fixed"|"percent","member_role": "admin"|"professional"|"reception","notification_channel": "email"|"whatsapp","notification_status": "pending"|"processing"|"sent"|"failed"|"cancelled"|"skipped","payment_method": "pix"|"card","payment_status": "pending"|"approved"|"rejected"|"cancelled"|"expired"|"refund_pending"|"refunded","time_off_kind": "time_off"|"block"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "booking_source": ["public", "panel"],"booking_status": ["pending_payment", "confirmed", "completed", "no_show", "cancelled", "expired"],"cancel_actor": ["client", "business", "system"],"deposit_type": ["none", "fixed", "percent"],"member_role": ["admin", "professional", "reception"],"notification_channel": ["email", "whatsapp"],"notification_status": ["pending", "processing", "sent", "failed", "cancelled", "skipped"],"payment_method": ["pix", "card"],"payment_status": ["pending", "approved", "rejected", "cancelled", "expired", "refund_pending", "refunded"],"time_off_kind": ["time_off", "block"]
          }
        }
} as const
