export type UserType = 'creator' | 'clipper';

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  user_type: UserType;
  platform: string | null;       // creator: Twitch, YouTube, etc.
  category: string | null;       // creator: Gaming, Podcast, etc.
  budget: string | null;         // creator: price range
  specialty: string | null;      // clipper: Gaming, Podcasts, etc.
  tools: string | null;          // clipper: software used
  price: string | null;          // clipper: price per clip
  turnaround: string | null;     // clipper: delivery time
  portfolio_count: number;
  followers_count: number;
  following_count: number;
  verified: boolean;
  created_at: string;
}

export interface Clip {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number;              // seconds, max 60
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  // Joined
  profile?: Profile;
  liked_by_user?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // Joined
  profile?: Profile;
  liked_by_user?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  clip_id: string | null;
  post_id: string | null;
  content: string;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface Contract {
  id: string;
  creator_id: string;
  clipper_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // Joined
  creator?: Profile;
  clipper?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  clip_id: string | null;
  post_id: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  // Joined
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'contract' | 'message';
  from_user_id: string;
  reference_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
  // Joined
  from_user?: Profile;
}
