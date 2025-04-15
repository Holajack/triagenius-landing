
import React from 'react';
import { StudyRooms as StudyRoomsComponent } from '@/components/community/StudyRooms';

const StudyRooms = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Study Rooms</h1>
      <StudyRoomsComponent />
    </div>
  );
};

export default StudyRooms;
