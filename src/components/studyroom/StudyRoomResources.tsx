
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
  url: string;
  type: 'link' | 'file';
  created_at: string;
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
        // Using study_resources table since room_resources doesn't exist in schema
        const { data, error } = await supabase
          .from('study_resources')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false });

        if (error) {
          // If the table doesn't exist yet, just return an empty array
          if (error.code === '42P01') { // undefined_table
            console.log('Study resources table does not exist yet');
            setResources([]);
            return;
          }
          throw error;
        }

        // Transform data to match Resource interface if needed
        const formattedResources = (data || []).map(resource => ({
          id: resource.id,
          room_id: resource.room_id,
          user_id: resource.user_id,
          title: resource.title,
          url: resource.url || '',
          type: resource.type || 'link',
          created_at: resource.created_at
        }));

        setResources(formattedResources);
      } catch (error) {
        console.error('Error fetching room resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();

    // Subscribe to changes if table exists
    try {
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
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
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
                    href={resource.url}
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
