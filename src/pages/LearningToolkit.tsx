
import { useState } from 'react';
import { ChevronLeft, Timer, GraduationCap, Check, TestTube, Clock, ListChecks, Waves, BookOpen, ArrowRight, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PageHeader from '@/components/common/PageHeader';
import NavigationBar from '@/components/dashboard/NavigationBar';
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

type Technique = {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: 'learn' | 'focus' | 'tasks';
  categoryLabel: '🧠 Learn Better' | '🔍 Sharpen Focus' | '✅ Get Things Done';
  summary: string;
  steps: string[];
  bestFor: string;
  tip: string;
};

const LearningToolkit = () => {
  const navigate = useNavigate();
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const techniques: Technique[] = [
    {
      id: 'work-sprints',
      title: 'Work Sprints',
      icon: <Timer className="h-8 w-8 text-amber-500" aria-hidden="true" />,
      category: 'focus',
      categoryLabel: '🔍 Sharpen Focus',
      summary: 'Short, timed work bursts with breaks to stay fresh.',
      steps: [
        'Work for 25–30 minutes.',
        'Take a 5-minute break (stretch, hydrate).',
        'After 4 sprints, take a 15–30 minute break.'
      ],
      bestFor: 'Avoiding burnout, beating procrastination.',
      tip: 'Use a simple timer app—no distractions!'
    },
    {
      id: 'teach-simple',
      title: 'Teach It Simple',
      icon: <GraduationCap className="h-8 w-8 text-blue-500" aria-hidden="true" />,
      category: 'learn',
      categoryLabel: '🧠 Learn Better',
      summary: 'Master topics by explaining them like you\'re teaching a child.',
      steps: [
        'Study a concept.',
        'Explain it aloud in plain language.',
        'Note gaps and revisit tough spots.'
      ],
      bestFor: 'Complex subjects (coding, science).',
      tip: 'Record voice memos to review later.'
    },
    {
      id: 'tackle-big-one',
      title: 'Tackle the Big One',
      icon: <Check className="h-8 w-8 text-green-500" aria-hidden="true" />,
      category: 'tasks',
      categoryLabel: '✅ Get Things Done',
      summary: 'Do your hardest task first to build momentum.',
      steps: [
        'List tasks by priority the night before.',
        'Start your day with the most challenging item.',
        'Reward yourself after finishing it.'
      ],
      bestFor: 'High-priority work, chronic procrastinators.',
      tip: 'Pair with a "reward ritual" (e.g., coffee, walk).'
    },
    {
      id: 'test-yourself',
      title: 'Test Yourself',
      icon: <TestTube className="h-8 w-8 text-purple-500" aria-hidden="true" />,
      category: 'learn',
      categoryLabel: '🧠 Learn Better',
      summary: 'Use flashcards or self-quizzes to retain info.',
      steps: [
        'Create simple questions on key concepts.',
        'Quiz yourself without looking at notes.',
        'Focus extra review on items you missed.'
      ],
      bestFor: 'Long-term memory retention, exam preparation.',
      tip: 'Digital flashcards work, but handwritten ones often stick better in memory.'
    },
    {
      id: 'chunk-time',
      title: 'Chunk Your Time',
      icon: <Clock className="h-8 w-8 text-orange-500" aria-hidden="true" />,
      category: 'focus',
      categoryLabel: '🔍 Sharpen Focus',
      summary: 'Divide work into themed blocks (e.g., "1 hour for emails").',
      steps: [
        'Group similar tasks together.',
        'Allocate specific time blocks for each group.',
        'Stay within each theme during its time block.'
      ],
      bestFor: 'Reducing context switching, increasing efficiency.',
      tip: 'Color-code your calendar by task type for visual organization.'
    },
    {
      id: 'break-it-down',
      title: 'Break It Down',
      icon: <ListChecks className="h-8 w-8 text-indigo-500" aria-hidden="true" />,
      category: 'tasks',
      categoryLabel: '✅ Get Things Done',
      summary: 'Split big tasks into tiny, doable steps.',
      steps: [
        'Take large project and list all component parts.',
        'Divide components into small, concrete actions.',
        'Focus on completing one mini-step at a time.'
      ],
      bestFor: 'Overwhelming projects, complex goals.',
      tip: 'Each step should take no more than 30 minutes to complete.'
    },
    {
      id: 'breathe-focus',
      title: 'Breathe to Focus',
      icon: <Waves className="h-8 w-8 text-teal-500" aria-hidden="true" />,
      category: 'focus',
      categoryLabel: '🔍 Sharpen Focus',
      summary: 'Inhale for 4s, hold 7s, exhale 8s to reset.',
      steps: [
        'Sit comfortably and close your eyes.',
        'Breathe in through your nose for 4 seconds.',
        'Hold your breath for 7 seconds.',
        'Exhale slowly through your mouth for 8 seconds.',
        'Repeat 3-5 times before returning to work.'
      ],
      bestFor: 'Stress reduction, mental clarity, focusing before difficult tasks.',
      tip: 'Do this exercise whenever you feel overwhelmed or scattered.'
    },
    {
      id: 'repeat-remember',
      title: 'Repeat to Remember',
      icon: <BookOpen className="h-8 w-8 text-rose-500" aria-hidden="true" />,
      category: 'learn',
      categoryLabel: '🧠 Learn Better',
      summary: 'Review notes after 1 day, 3 days, 1 week.',
      steps: [
        'Take clear notes during initial learning.',
        'Review notes within 24 hours.',
        'Review again after 3 days.',
        'Final review after 1 week.'
      ],
      bestFor: 'Converting short-term to long-term memory, exam preparation.',
      tip: 'Each review can be shorter than the last while still being effective.'
    },
    {
      id: 'concept-mapping',
      title: 'Concept Mapping',
      icon: <Brain className="h-8 w-8 text-cyan-500" aria-hidden="true" />,
      category: 'learn',
      categoryLabel: '🧠 Learn Better',
      summary: 'Create visual maps connecting ideas and concepts.',
      steps: [
        'Write main concept in the center of a page.',
        'Branch out related ideas with connecting lines.',
        'Add details to each branch, using colors for categories.',
        'Review and refine your map as understanding grows.'
      ],
      bestFor: 'Visual learners, complex subjects with many interrelated parts.',
      tip: 'Take a photo of your map to review on your phone when you have a spare moment.'
    }
  ];

  const handleOpenDetails = (technique: Technique) => {
    setSelectedTechnique(technique);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learn':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'focus':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'tasks':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
        <PageHeader
          title="Learning & Productivity Toolkit"
          subtitle="Swipe, tap, and unlock your potential"
        />
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 p-2"
          onClick={() => navigate('/bonuses')}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back to Bonuses</span>
        </Button>
      </div>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Category sections */}
        {['learn', 'focus', 'tasks'].map((category) => (
          <section key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {category === 'learn' ? '🧠 Learn Better' : 
               category === 'focus' ? '🔍 Sharpen Focus' : 
               '✅ Get Things Done'}
            </h2>
            
            {/* Mobile view: Carousel (for small screens) */}
            <div className="md:hidden">
              <Carousel className="w-full">
                <CarouselContent>
                  {techniques
                    .filter(t => t.category === category)
                    .map(technique => (
                      <CarouselItem key={technique.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                        <Card className="h-full">
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                {technique.icon}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(technique.category)}`}>
                                {technique.categoryLabel.split(' ')[0]}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{technique.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">
                              {technique.summary}
                            </CardDescription>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              className="w-full"
                              onClick={() => handleOpenDetails(technique)}
                              aria-label={`Explore ${technique.title}`}
                            >
                              Tap to Expand
                            </Button>
                          </CardFooter>
                        </Card>
                      </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="flex justify-center mt-2">
                  <CarouselPrevious className="static translate-y-0 dark:text-white" />
                  <CarouselNext className="static translate-y-0 ml-2 dark:text-white" />
                </div>
              </Carousel>
            </div>
            
            {/* Desktop view: Grid (for medium screens and up) */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techniques
                .filter(t => t.category === category)
                .map(technique => (
                  <Card key={technique.id} className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                          {technique.icon}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(technique.category)}`}>
                          {technique.categoryLabel.split(' ')[0]}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{technique.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {technique.summary}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => handleOpenDetails(technique)}
                        aria-label={`Explore ${technique.title}`}
                      >
                        Tap to Expand
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </section>
        ))}

        {/* Technique detail dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            {selectedTechnique && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getCategoryColor(selectedTechnique.category)}`}>
                      {selectedTechnique.icon}
                    </div>
                    <DialogTitle className="text-xl">
                      {selectedTechnique.title}
                    </DialogTitle>
                  </div>
                  <DialogDescription>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getCategoryColor(selectedTechnique.category)}`}>
                      {selectedTechnique.categoryLabel}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedTechnique.summary}
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">How to Use:</h3>
                    <ol className="space-y-2 pl-5 list-decimal">
                      {selectedTechnique.steps.map((step, index) => (
                        <li key={index} className="text-sm">{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <Collapsible className="w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Best For:</h3>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedTechnique.bestFor}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30 flex items-start">
                        <div className="mr-2 mt-0.5">💡</div>
                        <div className="text-amber-800 dark:text-amber-300 text-sm font-medium">Pro Tip</div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">{selectedTechnique.tip}</p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleCloseDialog}>Close</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Swipe, tap, and unlock your potential. Start with one technique today! 🚀
        </p>
      </div>

      <NavigationBar />
    </div>
  );
};

export default LearningToolkit;
