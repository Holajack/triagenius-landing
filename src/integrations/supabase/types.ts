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
      achievements: {
        Row: {
          achievement_type: string
          created_at: string
          description: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          description: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          description?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          insight_type: string
          is_read: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      break_sessions: {
        Row: {
          break_type: string | null
          created_at: string
          duration: number | null
          end_time: string | null
          focus_session_id: string | null
          id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_type?: string | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          focus_session_id?: string | null
          id?: string
          start_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_type?: string | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          focus_session_id?: string | null
          id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_sessions_focus_session_id_fkey"
            columns: ["focus_session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant_one: string
          participant_two: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_one: string
          participant_two: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_one?: string
          participant_two?: string
          updated_at?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          duration: number | null
          end_time: string | null
          environment: string | null
          id: string
          milestone_count: number | null
          room_id: string | null
          session_type: string
          start_time: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          environment?: string | null
          id?: string
          milestone_count?: number | null
          room_id?: string | null
          session_type?: string
          start_time?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          environment?: string | null
          id?: string
          milestone_count?: number | null
          room_id?: string | null
          session_type?: string
          start_time?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          content: string
          created_at: string | null
          id: string
          insight_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          insight_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          insight_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leaderboard_stats: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          level: number | null
          longest_streak: number | null
          monthly_focus_time: number | null
          points: number | null
          total_focus_time: number | null
          total_sessions: number | null
          updated_at: string
          user_id: string
          weekly_focus_time: number | null
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          monthly_focus_time?: number | null
          points?: number | null
          total_focus_time?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
          weekly_focus_time?: number | null
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          monthly_focus_time?: number | null
          points?: number | null
          total_focus_time?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
          weekly_focus_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_metrics: {
        Row: {
          cognitive_analytical: Json | null
          cognitive_creativity: Json | null
          cognitive_memory: Json | null
          cognitive_problem_solving: Json | null
          created_at: string
          focus_distribution: Json | null
          focus_trends: Json | null
          growth_data: Json | null
          id: string
          time_of_day_data: Json | null
          updated_at: string
          user_id: string
          weekly_data: Json | null
        }
        Insert: {
          cognitive_analytical?: Json | null
          cognitive_creativity?: Json | null
          cognitive_memory?: Json | null
          cognitive_problem_solving?: Json | null
          created_at?: string
          focus_distribution?: Json | null
          focus_trends?: Json | null
          growth_data?: Json | null
          id?: string
          time_of_day_data?: Json | null
          updated_at?: string
          user_id: string
          weekly_data?: Json | null
        }
        Update: {
          cognitive_analytical?: Json | null
          cognitive_creativity?: Json | null
          cognitive_memory?: Json | null
          cognitive_problem_solving?: Json | null
          created_at?: string
          focus_distribution?: Json | null
          focus_trends?: Json | null
          growth_data?: Json | null
          id?: string
          time_of_day_data?: Json | null
          updated_at?: string
          user_id?: string
          weekly_data?: Json | null
        }
        Relationships: []
      }
      learning_styles: {
        Row: {
          auditory: number
          created_at: string
          id: string
          logical: number
          physical: number
          primary_style: string | null
          updated_at: string
          user_id: string
          visual: number
          vocal: number
        }
        Insert: {
          auditory?: number
          created_at?: string
          id?: string
          logical?: number
          physical?: number
          primary_style?: string | null
          updated_at?: string
          user_id: string
          visual?: number
          vocal?: number
        }
        Update: {
          auditory?: number
          created_at?: string
          id?: string
          logical?: number
          physical?: number
          primary_style?: string | null
          updated_at?: string
          user_id?: string
          visual?: number
          vocal?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string | null
          room_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          room_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          room_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_preferences: {
        Row: {
          created_at: string
          data_collection_consent: boolean | null
          education_level: string | null
          focus_method: string | null
          id: string
          is_onboarding_complete: boolean | null
          learning_environment: string | null
          location: string | null
          major: string | null
          marketing_communications: boolean | null
          personalized_recommendations: boolean | null
          profile_visibility: string | null
          sound_preference: string | null
          study_data_sharing: boolean | null
          timezone: string | null
          university: string | null
          updated_at: string
          usage_analytics: boolean | null
          user_goal: string | null
          user_id: string
          weekly_focus_goal: number | null
          work_style: string | null
        }
        Insert: {
          created_at?: string
          data_collection_consent?: boolean | null
          education_level?: string | null
          focus_method?: string | null
          id?: string
          is_onboarding_complete?: boolean | null
          learning_environment?: string | null
          location?: string | null
          major?: string | null
          marketing_communications?: boolean | null
          personalized_recommendations?: boolean | null
          profile_visibility?: string | null
          sound_preference?: string | null
          study_data_sharing?: boolean | null
          timezone?: string | null
          university?: string | null
          updated_at?: string
          usage_analytics?: boolean | null
          user_goal?: string | null
          user_id: string
          weekly_focus_goal?: number | null
          work_style?: string | null
        }
        Update: {
          created_at?: string
          data_collection_consent?: boolean | null
          education_level?: string | null
          focus_method?: string | null
          id?: string
          is_onboarding_complete?: boolean | null
          learning_environment?: string | null
          location?: string | null
          major?: string | null
          marketing_communications?: boolean | null
          personalized_recommendations?: boolean | null
          profile_visibility?: string | null
          sound_preference?: string | null
          study_data_sharing?: boolean | null
          timezone?: string | null
          university?: string | null
          updated_at?: string
          usage_analytics?: boolean | null
          user_goal?: string | null
          user_id?: string
          weekly_focus_goal?: number | null
          work_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patrick_chat: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          breakduration: number | null
          business: string | null
          classes: string[] | null
          classesvisibility: string | null
          created_at: string
          display_name_preference: string | null
          email: string | null
          environment: string | null
          focusduration: number | null
          full_name: string | null
          fullnamevisibility: string | null
          id: string
          last_seen: string | null
          last_selected_environment: string | null
          location: string | null
          locationvisibility: string | null
          maingoal: string | null
          major: string | null
          password_hash: string | null
          preferences: Json | null
          privacy_settings: Json | null
          profession: string | null
          show_business: boolean | null
          show_classes: boolean | null
          show_state: boolean | null
          show_university: boolean | null
          soundpreference: string | null
          state: string | null
          status: string | null
          theme_environment: string | null
          timezone: string | null
          university: string | null
          universityvisibility: string | null
          updated_at: string
          username: string | null
          weeklyfocusgoal: number | null
          workstyle: string | null
        }
        Insert: {
          avatar_url?: string | null
          breakduration?: number | null
          business?: string | null
          classes?: string[] | null
          classesvisibility?: string | null
          created_at?: string
          display_name_preference?: string | null
          email?: string | null
          environment?: string | null
          focusduration?: number | null
          full_name?: string | null
          fullnamevisibility?: string | null
          id: string
          last_seen?: string | null
          last_selected_environment?: string | null
          location?: string | null
          locationvisibility?: string | null
          maingoal?: string | null
          major?: string | null
          password_hash?: string | null
          preferences?: Json | null
          privacy_settings?: Json | null
          profession?: string | null
          show_business?: boolean | null
          show_classes?: boolean | null
          show_state?: boolean | null
          show_university?: boolean | null
          soundpreference?: string | null
          state?: string | null
          status?: string | null
          theme_environment?: string | null
          timezone?: string | null
          university?: string | null
          universityvisibility?: string | null
          updated_at?: string
          username?: string | null
          weeklyfocusgoal?: number | null
          workstyle?: string | null
        }
        Update: {
          avatar_url?: string | null
          breakduration?: number | null
          business?: string | null
          classes?: string[] | null
          classesvisibility?: string | null
          created_at?: string
          display_name_preference?: string | null
          email?: string | null
          environment?: string | null
          focusduration?: number | null
          full_name?: string | null
          fullnamevisibility?: string | null
          id?: string
          last_seen?: string | null
          last_selected_environment?: string | null
          location?: string | null
          locationvisibility?: string | null
          maingoal?: string | null
          major?: string | null
          password_hash?: string | null
          preferences?: Json | null
          privacy_settings?: Json | null
          profession?: string | null
          show_business?: boolean | null
          show_classes?: boolean | null
          show_state?: boolean | null
          show_university?: boolean | null
          soundpreference?: string | null
          state?: string | null
          status?: string | null
          theme_environment?: string | null
          timezone?: string | null
          university?: string | null
          universityvisibility?: string | null
          updated_at?: string
          username?: string | null
          weeklyfocusgoal?: number | null
          workstyle?: string | null
        }
        Relationships: []
      }
      session_reflections: {
        Row: {
          ai_summary: string | null
          created_at: string
          id: string
          mood_rating: number | null
          productivity_rating: number | null
          session_id: string
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          mood_rating?: number | null
          productivity_rating?: number | null
          session_id: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          mood_rating?: number | null
          productivity_rating?: number | null
          session_id?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_reflections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_files: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string
          file_type: string
          id: string
          sound_preference: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path: string
          file_type: string
          id?: string
          sound_preference: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          sound_preference?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_resources: {
        Row: {
          created_at: string
          id: string
          room_id: string
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          title: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_resources_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          last_active_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          last_active_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          last_active_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_study_room_participants_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_study_room_participants_rooms"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          created_at: string
          creator_id: string
          current_participants: number | null
          description: string | null
          duration: string | null
          id: string
          is_private: boolean | null
          max_participants: number | null
          name: string
          room_code: string | null
          schedule: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_participants?: number | null
          description?: string | null
          duration?: string | null
          id?: string
          is_private?: boolean | null
          max_participants?: number | null
          name: string
          room_code?: string | null
          schedule?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_participants?: number | null
          description?: string | null
          duration?: string | null
          id?: string
          is_private?: boolean | null
          max_participants?: number | null
          name?: string
          room_code?: string | null
          schedule?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_trial: boolean
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_trial?: boolean
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_trial?: boolean
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          order: number
          task_id: string
          text: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          order: number
          task_id: string
          text: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          order?: number
          task_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          focus_session_id: string | null
          id: string
          order: number
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          focus_session_id?: string | null
          id?: string
          order?: number
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          focus_session_id?: string | null
          id?: string
          order?: number
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_focus_session_id_fkey"
            columns: ["focus_session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_start_breaks: boolean | null
          auto_start_focus: boolean | null
          break_reminders: boolean | null
          created_at: string | null
          daily_goal_minutes: number | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          preferred_break_length: number | null
          preferred_session_length: number | null
          sound_enabled: boolean | null
          study_reminders: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
        }
        Insert: {
          auto_start_breaks?: boolean | null
          auto_start_focus?: boolean | null
          break_reminders?: boolean | null
          created_at?: string | null
          daily_goal_minutes?: number | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          preferred_break_length?: number | null
          preferred_session_length?: number | null
          sound_enabled?: boolean | null
          study_reminders?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
        }
        Update: {
          auto_start_breaks?: boolean | null
          auto_start_focus?: boolean | null
          break_reminders?: boolean | null
          created_at?: string | null
          daily_goal_minutes?: number | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          preferred_break_length?: number | null
          preferred_session_length?: number | null
          sound_enabled?: boolean | null
          study_reminders?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_room_participants: {
        Args: { room_id: string }
        Returns: undefined
      }
      get_display_name: {
        Args: { user_profile: Json }
        Returns: string
      }
      get_user_follows: {
        Args: Record<PropertyKey, never> | { user_id_param: string }
        Returns: {
          following_id: string
        }[]
      }
      increment_room_participants: {
        Args: { room_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
