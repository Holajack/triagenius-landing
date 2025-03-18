
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserGoal, WorkStyle, StudyEnvironment, SoundPreference } from "@/types/onboarding";
import { PencilIcon, SaveIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePreferences = () => {
  const { state, dispatch, saveOnboardingState } = useOnboarding();
  const [isEditing, setIsEditing] = useState(false);
  const [editedState, setEditedState] = useState({ ...state });
  const navigate = useNavigate();

  const handleEditStart = () => {
    setIsEditing(true);
    setEditedState({ ...state });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedState({ ...state });
  };

  const handleSave = async () => {
    try {
      // Update context state
      Object.entries(editedState).forEach(([key, value]) => {
        switch (key) {
          case 'userGoal':
            dispatch({ type: 'SET_USER_GOAL', payload: value as UserGoal });
            break;
          case 'workStyle':
            dispatch({ type: 'SET_WORK_STYLE', payload: value as WorkStyle });
            break;
          case 'environment':
            dispatch({ type: 'SET_ENVIRONMENT', payload: value as StudyEnvironment });
            break;
          case 'soundPreference':
            dispatch({ type: 'SET_SOUND_PREFERENCE', payload: value as SoundPreference });
            break;
          case 'weeklyFocusGoal':
            dispatch({ type: 'SET_WEEKLY_FOCUS_GOAL', payload: value as number });
            break;
        }
      });

      // Save to database
      await saveOnboardingState();
      
      setIsEditing(false);
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Preferences</CardTitle>
          {!isEditing ? (
            <Button onClick={handleEditStart} variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm">
                <SaveIcon className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekly-focus-goal">Weekly Focus Goal</Label>
            <div className="flex items-center space-x-2">
              <Slider
                id="weekly-focus-goal"
                disabled={!isEditing}
                value={[editedState.weeklyFocusGoal || state.weeklyFocusGoal || 10]}
                min={1}
                max={40}
                step={1}
                onValueChange={(value) => setEditedState(prev => ({ ...prev, weeklyFocusGoal: value[0] }))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">
                {editedState.weeklyFocusGoal || state.weeklyFocusGoal || 10} hrs
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-goal">Main Goal</Label>
            <Select
              disabled={!isEditing}
              value={editedState.userGoal || state.userGoal || ""}
              onValueChange={(value) => setEditedState(prev => ({ ...prev, userGoal: value as UserGoal }))}
            >
              <SelectTrigger id="user-goal">
                <SelectValue placeholder="Select your main goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic-improvement">Academic Improvement</SelectItem>
                <SelectItem value="career-development">Career Development</SelectItem>
                <SelectItem value="project-completion">Project Completion</SelectItem>
                <SelectItem value="skill-acquisition">Skill Acquisition</SelectItem>
                <SelectItem value="exam-preparation">Exam Preparation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-style">Work Style</Label>
            <Select
              disabled={!isEditing}
              value={editedState.workStyle || state.workStyle || ""}
              onValueChange={(value) => setEditedState(prev => ({ ...prev, workStyle: value as WorkStyle }))}
            >
              <SelectTrigger id="work-style">
                <SelectValue placeholder="Select your work style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deep-work">Deep Work (Long Sessions)</SelectItem>
                <SelectItem value="pomodoro">Pomodoro (Short Intervals)</SelectItem>
                <SelectItem value="flexible">Flexible (Variable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select
              disabled={!isEditing}
              value={editedState.environment || state.environment || ""}
              onValueChange={(value) => setEditedState(prev => ({ ...prev, environment: value as StudyEnvironment }))}
            >
              <SelectTrigger id="environment">
                <SelectValue placeholder="Select your preferred environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="library">Library</SelectItem>
                <SelectItem value="coffee-shop">Coffee Shop</SelectItem>
                <SelectItem value="park">Park/Outdoors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sound-preference">Sound Preference</Label>
            <Select
              disabled={!isEditing}
              value={editedState.soundPreference || state.soundPreference || ""}
              onValueChange={(value) => setEditedState(prev => ({ ...prev, soundPreference: value as SoundPreference }))}
            >
              <SelectTrigger id="sound-preference">
                <SelectValue placeholder="Select your sound preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambient">Ambient Noise</SelectItem>
                <SelectItem value="nature">Nature Sounds</SelectItem>
                <SelectItem value="white-noise">White Noise</SelectItem>
                <SelectItem value="lo-fi">Lo-Fi Music</SelectItem>
                <SelectItem value="classical">Classical Music</SelectItem>
                <SelectItem value="silence">Silence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-4 border-t mt-4">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePreferences;
