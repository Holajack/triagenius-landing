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
import { PencilIcon, SaveIcon, Loader2Icon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
const ProfilePreferences = () => {
  const {
    state,
    dispatch,
    saveOnboardingState,
    isLoading: contextLoading
  } = useOnboarding();
  const [isEditing, setIsEditing] = useState(false);
  const [editedState, setEditedState] = useState({
    ...state
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedState({
      ...state
    });
  };
  const handleCancel = () => {
    setIsEditing(false);
    setEditedState({
      ...state
    });
  };
  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Update context state
      Object.entries(editedState).forEach(([key, value]) => {
        switch (key) {
          case 'userGoal':
            dispatch({
              type: 'SET_USER_GOAL',
              payload: value as UserGoal
            });
            break;
          case 'workStyle':
            dispatch({
              type: 'SET_WORK_STYLE',
              payload: value as WorkStyle
            });
            break;
          case 'environment':
            dispatch({
              type: 'SET_ENVIRONMENT',
              payload: value as StudyEnvironment
            });
            break;
          case 'soundPreference':
            dispatch({
              type: 'SET_SOUND_PREFERENCE',
              payload: value as SoundPreference
            });
            break;
          case 'weeklyFocusGoal':
            dispatch({
              type: 'SET_WEEKLY_FOCUS_GOAL',
              payload: value as number
            });
            break;
        }
      });

      // Save to database
      await saveOnboardingState();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Toast error is already shown in the saveOnboardingState function
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(`Failed to log out: ${error.message || "An unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Preferences</CardTitle>
          {!isEditing ? <Button onClick={handleEditStart} variant="outline" size="sm" disabled={isLoading || contextLoading}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button> : <div className="flex space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading || contextLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isLoading || contextLoading}>
                {isLoading || contextLoading ? <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </> : <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save
                  </>}
              </Button>
            </div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {contextLoading && <div className="w-full flex justify-center py-4">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>}
        
        {!contextLoading && <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-focus-goal">Weekly Focus Goal</Label>
              <div className="flex items-center space-x-2">
                <Slider id="weekly-focus-goal" disabled={!isEditing || isLoading} value={[editedState.weeklyFocusGoal || state.weeklyFocusGoal || 10]} min={1} max={40} step={1} onValueChange={value => setEditedState(prev => ({
              ...prev,
              weeklyFocusGoal: value[0]
            }))} className="flex-1" />
                <span className="text-sm font-medium w-12 text-right">
                  {editedState.weeklyFocusGoal || state.weeklyFocusGoal || 10} hrs
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-goal">Main Goal</Label>
              <Select disabled={!isEditing || isLoading} value={editedState.userGoal || state.userGoal || ""} onValueChange={value => setEditedState(prev => ({
            ...prev,
            userGoal: value as UserGoal
          }))}>
                <SelectTrigger id="user-goal">
                  <SelectValue placeholder="Select your main goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep-work">Deep Work</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="accountability">Accountability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-style">Work Style</Label>
              <Select disabled={!isEditing || isLoading} value={editedState.workStyle || state.workStyle || ""} onValueChange={value => setEditedState(prev => ({
            ...prev,
            workStyle: value as WorkStyle
          }))}>
                <SelectTrigger id="work-style">
                  <SelectValue placeholder="Select your work style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep-work">Deep Work</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="pomodoro">Sprints</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select disabled={!isEditing || isLoading} value={editedState.environment || state.environment || ""} onValueChange={value => setEditedState(prev => ({
            ...prev,
            environment: value as StudyEnvironment
          }))}>
                <SelectTrigger id="environment">
                  <SelectValue placeholder="Select your preferred environment" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full z-50">
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="coffee-shop">Coffee Shop</SelectItem>
                  <SelectItem value="park">Park/Outdoors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 mb-8">
              <Label htmlFor="sound-preference">Sound Preference</Label>
              <Select disabled={!isEditing || isLoading} value={editedState.soundPreference || state.soundPreference || ""} onValueChange={value => setEditedState(prev => ({
            ...prev,
            soundPreference: value as SoundPreference
          }))}>
                <SelectTrigger id="sound-preference">
                  <SelectValue placeholder="Select your sound preference" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full z-50">
                  <SelectItem value="ambient">Nature</SelectItem>
                  <SelectItem value="lo-fi">Lo-fi</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="silence">Silence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>}
        
        {/* Added extra space with mt-16 to separate logout button from the sound preference */}
        <div className="pt-6 border-t mt-16 py-[25px]">
          <Button variant="destructive" onClick={handleLogout} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default ProfilePreferences;