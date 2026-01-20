import { MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePreferenceSurveys } from '@/hooks/usePreferenceSurveys';

interface SurveyTriggerProps {
  userId: string | undefined;
}

export function SurveyTrigger({ userId }: SurveyTriggerProps) {
  const { pendingSurveys, showSurvey, SURVEYS } = usePreferenceSurveys(userId);

  if (pendingSurveys.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircleQuestion className="w-5 h-5" />
          {pendingSurveys.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="default"
            >
              {pendingSurveys.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Help Us Personalize</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SURVEYS.filter((s) => pendingSurveys.includes(s.id)).map((survey) => (
          <DropdownMenuItem
            key={survey.id}
            onClick={() => showSurvey(survey.id)}
            className="cursor-pointer"
          >
            <div>
              <div className="font-medium">{survey.title}</div>
              <div className="text-xs text-muted-foreground">{survey.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
