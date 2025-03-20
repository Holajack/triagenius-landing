import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfilePreferences from "@/components/profile/ProfilePreferences";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import {
  CalendarIcon,
  LocateIcon,
  MapPinIcon,
  GraduationCapIcon,
  UserIcon,
  MailIcon,
  Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, isLoading } = useUser();
  const [profileData, setProfileData] = useState({
    username: "",
    email: user?.email || "",
    bio: "",
    location: "",
    school: "",
    grade: "",
    subjects: [],
    classes: [],
    joinedDate: new Date().toISOString(),
    points: 0,
    streak: 0,
    achievements: [],
    connections: [],
    level: 1,
    totalFocusTime: 0
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedData, setEditedData] = useState({...profileData});
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  
  const formatClasses = (classes: string[] | null) => {
    if (!classes || !Array.isArray(classes) || classes.length === 0) return [];
    return classes;
  };

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        throw error;
      }
      if (data) {
        setProfileData({
          username: data.username || "",
          email: user?.email || "",
          bio: data.bio || "",
          location: data.location || "",
          school: data.school || "",
          grade: data.grade || "",
          subjects: data.subjects || [],
          classes: data.classes || [],
          joinedDate: data.created_at || new Date().toISOString(),
          points: data.points || 0,
          streak: data.streak || 0,
          achievements: data.achievements || [],
          connections: data.connections || [],
          level: data.level || 1,
          totalFocusTime: data.total_focus_time || 0
        });
        setEditedData({
          username: data.username || "",
          email: user?.email || "",
          bio: data.bio || "",
          location: data.location || "",
          school: data.school || "",
          grade: data.grade || "",
          subjects: data.subjects || [],
          classes: data.classes || [],
          joinedDate: data.created_at || new Date().toISOString(),
          points: data.points || 0,
          streak: data.streak || 0,
          achievements: data.achievements || [],
          connections: data.connections || [],
          level: data.level || 1,
          totalFocusTime: data.total_focus_time || 0
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch profile data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, supabase, toast]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  const saveProfile = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          bio: data.bio,
          location: data.location,
          school: data.school,
          grade: data.grade,
          subjects: data.subjects,
          classes: data.classes
        })
        .eq("id", user?.id);
      if (error) {
        throw error;
      }
      toast.success("Profile updated successfully!");
      fetchUserProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="flex flex-col items-center mt-8 relative">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profileData.username ? profileData.username.substring(0, 2).toUpperCase() : user?.email?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">{profileData.username || "User"}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <MailIcon className="h-4 w-4" />
                {user?.email}
              </p>
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>Joined {new Date(profileData.joinedDate).toLocaleDateString()}</span>
              </div>
              
              {profileData.location && (
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>{profileData.location}</span>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditDialogOpen(true)}
                className="mt-4"
              >
                Edit Profile
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-medium">{profileData.level}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Focus Time</span>
                      <span className="font-medium">{Math.floor(profileData.totalFocusTime / 60)} hrs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Streak</span>
                      <span className="font-medium">{profileData.streak} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-medium">{profileData.points}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <Tabs defaultValue="about">
                  <TabsList className="w-full">
                    <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
                    <TabsTrigger value="achievements" className="flex-1">Achievements</TabsTrigger>
                    <TabsTrigger value="connections" className="flex-1">Connections</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>About Me</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {profileData.bio ? (
                          <p>{profileData.bio}</p>
                        ) : (
                          <p className="text-muted-foreground">No bio provided.</p>
                        )}
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-medium mb-2">Education</h3>
                          {profileData.school ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{profileData.school}</span>
                              </div>
                              {profileData.grade && (
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>{profileData.grade}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No education details provided.</p>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-medium mb-2">Subjects</h3>
                          {profileData.subjects && profileData.subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {profileData.subjects.map((subject, index) => (
                                <Badge key={index} variant="outline">{subject}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No subjects added.</p>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Classes</h3>
                          {profileData.classes && profileData.classes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formatClasses(profileData.classes).map((className, index) => (
                                <Badge key={index} variant="outline">{className}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No classes added.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="achievements" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Achievements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {profileData.achievements && profileData.achievements.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profileData.achievements.map((achievement, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Trophy className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{achievement.title}</h4>
                                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">No achievements yet. Complete tasks to earn achievements!</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="connections" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Connections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {profileData.connections && profileData.connections.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profileData.connections.map((connection, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                <Avatar>
                                  <AvatarFallback>
                                    {connection.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{connection.username}</h4>
                                  <p className="text-sm text-muted-foreground">Level {connection.level}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">No connections yet. Connect with other students to study together!</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="mt-8">
              <ProfilePreferences />
            </div>
          </>
        )}
      </div>
      
      <EditProfileDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        profileData={profileData}
        onSave={(data) => {
          saveProfile(data);
          setIsEditDialogOpen(false);
        }}
      />
      
      <NavigationBar />
    </div>
  );
};

export default Profile;
