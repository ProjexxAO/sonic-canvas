import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { usePreferenceSurveys, Survey, SurveyQuestion } from '@/hooks/usePreferenceSurveys';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';

interface InSessionSurveyProps {
  userId: string | undefined;
}

export function InSessionSurvey({ userId }: InSessionSurveyProps) {
  const { activeSurvey, dismissSurvey, submitSurvey } = usePreferenceSurveys(userId);
  const { playSuccess, playClick } = useAudioFeedback(userId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  if (!activeSurvey) return null;

  const currentQuestion = activeSurvey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activeSurvey.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progressPercent = ((currentQuestionIndex + 1) / activeSurvey.questions.length) * 100;

  const handleAnswer = (questionId: string, value: any) => {
    playClick();
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    playClick();
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    playClick();
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    await submitSurvey(activeSurvey.id, answers);
    playSuccess();
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-3">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const selected = (currentAnswer || []).includes(option);
              return (
                <div key={option} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${question.id}-${option}`}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const current = currentAnswer || [];
                      if (checked) {
                        handleAnswer(question.id, [...current, option]);
                      } else {
                        handleAnswer(question.id, current.filter((o: string) => o !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4 pt-4">
            <Slider
              value={[currentAnswer || 5]}
              onValueChange={([value]) => handleAnswer(question.id, value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{question.minLabel || '1'}</span>
              <span className="font-medium text-foreground">{currentAnswer || 5}</span>
              <span>{question.maxLabel || '10'}</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder="Type your response..."
            className="min-h-24"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-primary/20 shadow-xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={dismissSurvey}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-lg">{activeSurvey.title}</CardTitle>
          <CardDescription>{activeSurvey.description}</CardDescription>
          <Progress value={progressPercent} className="h-1 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="font-medium">{currentQuestion.question}</p>
            {renderQuestion(currentQuestion)}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isFirstQuestion}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              {isLastQuestion ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Question {currentQuestionIndex + 1} of {activeSurvey.questions.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
