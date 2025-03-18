
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavigationBar from "@/components/dashboard/NavigationBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { 
  PencilIcon, 
  BookOpenIcon, 
  BriefcaseIcon, 
  MapPinIcon,
  GraduationCapIcon,
  UserIcon,
  MailIcon
} from "lucide-react";

const Profile = () => {
  const { user, isLoading } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    avatar_url: "",
    
    // Additional profile fields
    university: "",
    major: "",
    business: "",
    profession: "",
    state: "",
    classes: [] as string[],
    
    // Privacy settings
    show_university: true,
    show_business: true,
    show_state: true,
    show_classes: true
  });
  const [loading, setLoading] = useState(true);
  const [editedData, setEditedData] = useState({...profileData});
  const [isEditing, setIsEditing] = useState(false);
  
  const formatClasses = (classes: string[] | null) => {
    if (!classes || !Array.isArray(classes) || classes.length === 0) return [];
    return classes;
  };
  
  // Function to load user profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Make sure this query includes the new fields
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, avatar_url, university, major, business, profession, state, classes, show_university, show_business, show_state, show_classes')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfileData({
        username: data.username || "",
        email: data.email || "",
        avatar_url: data.avatar_url || "",
        university: data.university || "",
        major: data.major || "",
        business: data.business || "",
        profession: data.profession || "",
        state: data.state || "",
        classes: formatClasses(data.classes),
        show_university: data.show_university !== false, // Default to true if null
        show_business: data.show_business !== false, // Default to true if null
        show_state: data.show_state !== false, // Default to true if null
        show_classes: data.show_classes !== false // Default to true if null
      });
      
      setEditedData({
        username: data.username || "",
        email: data.email || "",
        avatar_url: data.avatar_url || "",
        university: data.university || "",
        major: data.major || "",
        business: data.business || "",
        profession: data.profession || "",
        state: data.state || "",
        classes: formatClasses(data.classes),
        show_university: data.show_university !== false,
        show_business: data.show_business !== false,
        show_state: data.show_state !== false,
        show_classes: data.show_classes !== false
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (user && !isLoading) {
      loadProfile();
    }
  }, [user, isLoading, loadProfile]);
  
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedData({...profileData});
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({...profileData});
  };
  
  const handleSave = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      
      // Format classes as an array of strings
      let formattedClasses: string[] = [];
      
      if (typeof editedData.classes === 'string') {
        // Convert comma-separated string to array
        formattedClasses = (editedData.classes as string)
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0);
      } else if (Array.isArray(editedData.classes)) {
        formattedClasses = editedData.classes;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedData.username,
          email: editedData.email,
          avatar_url: editedData.avatar_url,
          university: editedData.university,
          major: editedData.major,
          business: editedData.business,
          profession: editedData.profession,
          state: editedData.state,
          classes: formattedClasses,
          show_university: editedData.show_university,
          show_business: editedData.show_business,
          show_state: editedData.show_state,
          show_classes: editedData.show_classes
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setProfileData({
        ...editedData,
        classes: formattedClasses
      });
      
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field: string, value: string | boolean | string[]) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className="container max-w-6xl pb-24">
      <div className="space-y-6 pb-6 pt-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          View and edit your profile information
        </p>
      </div>

      <Tabs defaultValue="profile" className="mb-24">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing ? (
                  <Button onClick={handleEditStart} variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} size="sm" disabled={loading}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar_url || ""} />
                    <AvatarFallback className="text-2xl">
                      {profileData.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <Button 
                      onClick={() => setIsEditDialogOpen(true)} 
                      variant="outline"
                      size="sm"
                    >
                      Change Avatar
                    </Button>
                  )}
                </div>
                
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Label htmlFor="username">Username</Label>
                      </div>
                      {isEditing ? (
                        <Input 
                          id="username" 
                          value={editedData.username} 
                          onChange={(e) => handleChange('username', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm">{profileData.username || "Not set"}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MailIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                        <Label htmlFor="email">Email</Label>
                      </div>
                      {isEditing ? (
                        <Input 
                          id="email" 
                          type="email" 
                          value={editedData.email} 
                          onChange={(e) => handleChange('email', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm">{profileData.email || "Not set"}</p>
                      )}
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Educational Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <GraduationCapIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <Label htmlFor="university">University/School</Label>
                        </div>
                        {isEditing ? (
                          <Input 
                            id="university" 
                            value={editedData.university} 
                            onChange={(e) => handleChange('university', e.target.value)}
                            placeholder="e.g. Stanford University"
                          />
                        ) : (
                          <p className="text-sm">{profileData.university || "Not set"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <BookOpenIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <Label htmlFor="major">Major/Field of Study</Label>
                        </div>
                        {isEditing ? (
                          <Input 
                            id="major" 
                            value={editedData.major} 
                            onChange={(e) => handleChange('major', e.target.value)}
                            placeholder="e.g. Computer Science"
                          />
                        ) : (
                          <p className="text-sm">{profileData.major || "Not set"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center">
                          <BookOpenIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <Label htmlFor="classes">Current Classes</Label>
                        </div>
                        {isEditing ? (
                          <Textarea 
                            id="classes" 
                            value={Array.isArray(editedData.classes) ? editedData.classes.join(', ') : editedData.classes} 
                            onChange={(e) => handleChange('classes', e.target.value)}
                            placeholder="Enter classes separated by commas"
                            className="min-h-[80px]"
                          />
                        ) : (
                          <p className="text-sm">
                            {profileData.classes && profileData.classes.length > 0 
                              ? profileData.classes.join(', ') 
                              : "No classes listed"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <hr className="my-4" />
                    
                    <h3 className="text-lg font-medium">Professional Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <BriefcaseIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <Label htmlFor="business">Company/Organization</Label>
                        </div>
                        {isEditing ? (
                          <Input 
                            id="business" 
                            value={editedData.business} 
                            onChange={(e) => handleChange('business', e.target.value)}
                            placeholder="e.g. Acme Inc."
                          />
                        ) : (
                          <p className="text-sm">{profileData.business || "Not set"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <BriefcaseIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <Label htmlFor="profession">Job Title/Role</Label>
                        </div>
                        {isEditing ? (
                          <Input 
                            id="profession" 
                            value={editedData.profession} 
                            onChange={(e) => handleChange('profession', e.target.value)}
                            placeholder="e.g. Software Engineer"
                          />
                        ) : (
                          <p className="text-sm">{profileData.profession || "Not set"}</p>
                        )}
                      </div>
                    </div>
                    
                    <hr className="my-4" />
                    
                    <h3 className="text-lg font-medium">Location</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <Label htmlFor="state">State</Label>
                        </div>
                        {isEditing ? (
                          <Input 
                            id="state" 
                            value={editedData.state} 
                            onChange={(e) => handleChange('state', e.target.value)}
                            placeholder="e.g. California"
                          />
                        ) : (
                          <p className="text-sm">{profileData.state || "Not set"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Privacy Settings</CardTitle>
                {!isEditing ? (
                  <Button onClick={handleEditStart} variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Settings
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} size="sm" disabled={loading}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Control which parts of your profile are visible to other users.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show University Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your university and major
                      </p>
                    </div>
                    <Switch 
                      checked={editedData.show_university}
                      onCheckedChange={(checked) => handleChange('show_university', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show Business Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your company and job title
                      </p>
                    </div>
                    <Switch 
                      checked={editedData.show_business}
                      onCheckedChange={(checked) => handleChange('show_business', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show Location</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your state
                      </p>
                    </div>
                    <Switch 
                      checked={editedData.show_state}
                      onCheckedChange={(checked) => handleChange('show_state', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show Classes</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your current classes
                      </p>
                    </div>
                    <Switch 
                      checked={editedData.show_classes}
                      onCheckedChange={(checked) => handleChange('show_classes', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <EditProfileDialog 
        isOpen={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)} 
        onUpdate={(avatar) => {
          setEditedData(prev => ({...prev, avatar_url: avatar}));
          setIsEditDialogOpen(false);
        }}
      />

      <NavigationBar />
    </div>
  );
};

export default Profile;
