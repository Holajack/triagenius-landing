
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Link, Plus } from 'lucide-react';

export interface Resource {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  url: string | null;
  type: 'link' | 'file';
  created_at: string;
  updated_at: string;
}

export interface StudyRoomResourcesProps {
  roomId: string;
}

export const StudyRoomResources = ({ roomId }: StudyRoomResourcesProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        const response = await supabase
          .from('study_resources')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false });

        if (response.error) {
          console.error('Error fetching study resources:', response.error);
          setResources([]);
          return;
        }

        // Explicitly convert the response data to match Resource interface
        const typedResources = response.data.map(item => ({
          id: item.id,
          room_id: item.room_id,
          user_id: item.user_id,
          title: item.title,
          url: item.url,
          type: (item.type || 'link') as 'link' | 'file',
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        setResources(typedResources);
      } catch (error) {
        console.error('Error fetching room resources:', error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();

    // Subscribe to changes in the study_resources table
    const channel = supabase
      .channel(`room_resources_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_resources',
          filter: `room_id=eq.${roomId}`,
        },
        fetchResources
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Resources</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div>
            {resources.length === 0 ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                No resources shared yet
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                  >
                    {resource.type === 'file' ? (
                      <FileText className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Link className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm truncate">{resource.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyRoomResources;
