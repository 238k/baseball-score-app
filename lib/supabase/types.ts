// Supabase データベーステーブルの型定義
// Supabase CLI の `supabase gen types typescript` で自動生成することも可能

type TeamRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

type TeamInsert = {
  id?: string;
  name: string;
  created_by: string;
  created_at?: string;
};

type TeamMemberRow = {
  team_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
};

type TeamMemberInsert = {
  team_id: string;
  user_id: string;
  role?: 'owner' | 'member';
  joined_at?: string;
};

type GameRow = {
  id: string;
  user_id: string;
  team_id: string | null;
  date: string;
  venue: string | null;
  home_team_name: string;
  away_team_name: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
};

type GameInsert = {
  id?: string;
  user_id: string;
  team_id?: string | null;
  date: string;
  venue?: string | null;
  home_team_name: string;
  away_team_name: string;
  status?: 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
};

type LineupRow = {
  id: string;
  game_id: string;
  side: 'home' | 'away';
  batting_order: number;
  cycle: number;
  player_name: string;
  position: number;
  is_starter: boolean;
  entered_inning: number | null;
  substitution_type: '代打' | '代走' | '守備交代' | '投手交代' | null;
};

type LineupInsert = LineupRow;

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: TeamRow;
        Insert: TeamInsert;
        Update: Partial<TeamInsert>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: TeamMemberInsert;
        Update: Partial<TeamMemberInsert>;
        Relationships: [];
      };
      games: {
        Row: GameRow;
        Insert: GameInsert;
        Update: Partial<GameInsert>;
        Relationships: [];
      };
      lineups: {
        Row: LineupRow;
        Insert: LineupInsert;
        Update: Partial<LineupInsert>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
