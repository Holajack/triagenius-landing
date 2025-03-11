
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { SoundPreference } from "@/types/onboarding";
import { Headphones, Music } from "lucide-react";

const sounds: Array<{ id: SoundPreference; title: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'lo-fi',
    title: 'Lo-fi',
    description: 'Calm background beats',
    icon: <Music className="w-6 h-6" />,
  },
  {
    id: 'ambient',
    title: 'Ambient',
    description: 'Nature and environmental sounds',
    icon: <Headphones className="w-6 h-6" />,
  },
  {
    id: 'classical',
    title: 'Classical',
    description: 'Timeless orchestral pieces',
    icon: <Music className="w-6 h-6 rotate-45" />,
  },
  {
    id: 'silence',
    title: 'Silence',
    description: 'No background audio',
    icon: <Headphones className="w-6 h-6 rotate-45" />,
  }
];

export const SoundStep = () => {
  const { state, dispatch } = useOnboarding();

  return (
    <div className="grid gap-4">
      {sounds.map((sound) => (
        <Card
          key={sound.id}
          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
            state.soundPreference === sound.id ? 'border-triage-purple shadow-md' : ''
          }`}
          onClick={() => dispatch({ type: 'SET_SOUND_PREFERENCE', payload: sound.id })}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-purple-100 text-triage-purple">
              {sound.icon}
            </div>
            <div>
              <h3 className="font-medium mb-1">{sound.title}</h3>
              <p className="text-sm text-gray-600">{sound.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
