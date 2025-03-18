
-- This file is for reference only - you need to run this SQL in the Supabase dashboard
CREATE TABLE IF NOT EXISTS public.learning_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  cognitive_memory JSONB DEFAULT '[]'::JSONB,
  cognitive_problem_solving JSONB DEFAULT '[]'::JSONB,
  cognitive_creativity JSONB DEFAULT '[]'::JSONB, 
  cognitive_analytical JSONB DEFAULT '[]'::JSONB,
  weekly_data JSONB DEFAULT '[]'::JSONB,
  growth_data JSONB DEFAULT '[]'::JSONB,
  focus_distribution JSONB DEFAULT '[]'::JSONB,
  focus_trends JSONB DEFAULT '[]'::JSONB,
  time_of_day_data JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Add RLS policies
ALTER TABLE public.learning_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own metrics
CREATE POLICY select_own_metrics ON public.learning_metrics 
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own metrics
CREATE POLICY insert_own_metrics ON public.learning_metrics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own metrics
CREATE POLICY update_own_metrics ON public.learning_metrics 
  FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updating updated_at automatically
CREATE TRIGGER update_learning_metrics_updated_at
  BEFORE UPDATE ON public.learning_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
