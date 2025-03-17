import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Link, Upload, Plus } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: number;
  title: string;
  type: string;
  sharedBy: string;
  timestamp: string;
}

interface StudyRoomResourcesProps {
  resources: Resource[];
}

export const StudyRoomResources = ({ resources }: StudyRoomResourcesProps) => {
  const handleAddResource = () => {
    toast({
      title: "Feature coming soon",
      description: "You'll be able to share resources with your study group soon."
    });
  };
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "Link":
        return <Link className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Shared Resources</h3>
        <Button size="sm" onClick={handleAddResource}>
          <Plus className="h-4 w-4 mr-1" />
          Add Resource
        </Button>
      </div>
      
      {resources.length > 0 ? (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="p-3">
              <div className="flex items-center gap-3">
                {getResourceIcon(resource.type)}
                <div className="flex-1">
                  <h4 className="font-medium">{resource.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Shared by {resource.sharedBy}</span>
                    <span>•</span>
                    <span>{resource.timestamp}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Upload className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No resources shared yet</p>
          <p className="text-sm">Share study materials with your group</p>
        </div>
      )}
    </div>
  );
};
