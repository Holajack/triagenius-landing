
import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | 'focus_complete'
  | 'milestone'
  | 'streak'
  | 'study_room'
  | 'goal_update';

export interface ActivityData {
  actionType: ActivityType;
  description: string;
}

/**
 * Records a user activity for the community feed
 * 
 * @param data The activity data to record
 * @returns A promise that resolves to the activity data or error
 */
export const recordActivity = async (data: ActivityData) => {
  try {
    // Validate required fields
    if (!data.actionType || !data.description) {
      throw new Error('Activity type and description are required');
    }

    // Call the edge function to record the activity
    const { data: result, error } = await supabase.functions.invoke('record-activity', {
      body: data
    });

    if (error) {
      console.error('Error recording activity:', error);
      return { error };
    }

    return { data: result };
  } catch (error) {
    console.error('Unexpected error recording activity:', error);
    return { error };
  }
};

/**
 * Automatically record focus session completion
 * 
 * @param duration The duration in minutes
 * @returns The result of recording the activity
 */
export const recordFocusCompletion = async (duration: number) => {
  const hours = Math.round(duration / 60 * 10) / 10; // Convert to hours with 1 decimal
  return recordActivity({
    actionType: 'focus_complete',
    description: `completed a ${hours}-hour focus session`
  });
};

/**
 * Record reaching a streak milestone
 * 
 * @param streak The current streak count
 * @returns The result of recording the activity
 */
export const recordStreakMilestone = async (streak: number) => {
  return recordActivity({
    actionType: 'streak',
    description: `reached a ${streak}-day focus streak`
  });
};

/**
 * Record joining a study room
 * 
 * @param roomName The name of the study room
 * @returns The result of recording the activity
 */
export const recordStudyRoomJoin = async (roomName: string) => {
  return recordActivity({
    actionType: 'study_room',
    description: `joined the "${roomName}" study room`
  });
};

/**
 * Record setting a new weekly goal
 * 
 * @param goal The new goal in hours
 * @returns The result of recording the activity
 */
export const recordGoalUpdate = async (goal: number) => {
  return recordActivity({
    actionType: 'goal_update',
    description: `set a weekly focus goal of ${goal} hours`
  });
};

/**
 * Record achieving a focus milestone
 * 
 * @param milestone The milestone description
 * @returns The result of recording the activity
 */
export const recordMilestone = async (milestone: string) => {
  return recordActivity({
    actionType: 'milestone',
    description: milestone
  });
};
