/**
 * Supabase 데이터베이스 타입.
 *
 * ⚠️ 이 파일은 마이그레이션 스키마에 맞춰 손으로 작성/유지한다.
 * Supabase 프로젝트 link 후 아래 명령으로 자동 생성본으로 교체할 것:
 *
 *     pnpm gen:types
 *
 * (= supabase gen types typescript --linked > types/database.ts)
 *
 * 현재 상태: 20260624030000_song_scraps.sql 적용 후 기준.
 *  - song_ratings / comment_likes 테이블 추가
 *  - song_scraps 테이블 추가(곡 스크랩, 사용자별 개인 보관함)
 *  - songs.rating_avg / rating_count 추가
 *  - songs.rating 은 NOT NULL 해제(백업 보존, nullable) — description 도 보존
 *  - 레거시 컬럼 DROP(20260624000000)은 검증 후 적용 → 그때 재생성 필요
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          id: string
          title: string
          artist: string
          genre: string
          country: string
          otaku_type: string | null
          description: string | null
          rating: number | null
          rating_avg: number | null
          rating_count: number
          url: string | null
          thumbnail_url: string | null
          youtube_video_id: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          artist: string
          genre: string
          country: string
          otaku_type?: string | null
          description?: string | null
          rating?: number | null
          rating_avg?: number | null
          rating_count?: number
          url?: string | null
          thumbnail_url?: string | null
          youtube_video_id?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          genre?: string
          country?: string
          otaku_type?: string | null
          description?: string | null
          rating?: number | null
          rating_avg?: number | null
          rating_count?: number
          url?: string | null
          thumbnail_url?: string | null
          youtube_video_id?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_ratings: {
        Row: {
          id: string
          song_id: string
          user_id: string
          rating: number
          comment: string | null
          is_spoiler: boolean
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          song_id: string
          user_id: string
          rating: number
          comment?: string | null
          is_spoiler?: boolean
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          song_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          is_spoiler?: boolean
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_ratings_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          song_rating_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          song_rating_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          song_rating_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_song_rating_id_fkey"
            columns: ["song_rating_id"]
            isOneToOne: false
            referencedRelation: "song_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_scraps: {
        Row: {
          song_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          song_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          song_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_scraps_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_scraps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: {
      create_song_with_rating: {
        Args: {
          p_title: string
          p_artist: string
          p_genre: string
          p_country: string
          p_otaku_type: string | null
          p_rating: number
          p_comment: string | null
          p_is_spoiler: boolean
          p_url?: string | null
          p_thumbnail_url?: string | null
          p_youtube_video_id?: string | null
        }
        Returns: string
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
