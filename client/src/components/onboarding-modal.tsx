import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, MessageSquare, Heart, Flag } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function OnboardingModal({ isOpen, onClose, user }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to ALLURA Community! 🎉",
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Hi {user?.firstName || 'there'}! Welcome to our professional community forum.
          </p>
          <p className="text-muted-foreground">
            Allura is an A&A brand connecting professionals across multiple niches. 
            Let's get you started with a quick tour!
          </p>
        </div>
      )
    },
    {
      title: "Explore Our 7 Categories 🏢",
      content: (
        <div className="space-y-4">
          <p>Discover discussions in these professional areas:</p>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline">🏢 Business</Badge>
            <Badge variant="outline">🏛️ Government</Badge>
            <Badge variant="outline">🏖️ Tourism</Badge>
            <Badge variant="outline">🎤 Celebrity</Badge>
            <Badge variant="outline">🏥 Health</Badge>
            <Badge variant="outline">👪 Family Tree</Badge>
            <Badge variant="outline">🎓 Education</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Click any category to explore posts and join conversations in your field.
          </p>
        </div>
      )
    },
    {
      title: "How to Engage 💬",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Create posts to start discussions</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span>Reply to others and build connections</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-primary" />
              <span>Like quality content to show appreciation</span>
            </div>
            <div className="flex items-center gap-3">
              <Flag className="w-5 h-5 text-primary" />
              <span>Report inappropriate content to keep our community safe</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Get Started! ✨",
      content: (
        <div className="space-y-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <p className="text-lg font-semibold">You're all set!</p>
          <p className="text-muted-foreground">
            Jump into any category that interests you and start engaging with our community.
          </p>
          <p className="text-sm text-muted-foreground">
            Need help? Check your notifications for our welcome message with more tips.
          </p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed in localStorage
      localStorage.setItem('allura-onboarding-completed', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('allura-onboarding-completed', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {steps[currentStep].content}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            data-testid="button-skip-onboarding"
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleNext}
            data-testid="button-next-onboarding"
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Get Started!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}