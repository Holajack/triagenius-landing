
-- Create a SQL function to increment the participant count safely
CREATE OR REPLACE FUNCTION increment_room_participants(room_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the current_participants field, ensuring we don't go below 0
  UPDATE study_rooms
  SET current_participants = COALESCE(current_participants, 0) + 1
  WHERE id = room_id;
END;
$$;

-- Create a SQL function to decrement the participant count safely
CREATE OR REPLACE FUNCTION decrement_room_participants(room_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the current_participants field, ensuring we don't go below 0
  UPDATE study_rooms
  SET current_participants = GREATEST(COALESCE(current_participants, 1) - 1, 0)
  WHERE id = room_id;
END;
$$;
