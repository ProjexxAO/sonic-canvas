import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SurveyQuestion {
  id: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  question: string;
  options?: string[];
  minLabel?: string;
  maxLabel?: string;
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  survey_type: string;
  question_id: string;
  response: any;
  context?: Record<string, any>;
  created_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  triggerCondition?: string;
}

const SURVEYS: Survey[] = [
  {
    id: 'content_preference',
    title: 'Content Preferences',
    description: 'Help us personalize your experience',
    questions: [
      {
        id: 'preferred_format',
        type: 'single',
        question: 'How do you prefer to consume information?',
        options: ['Charts & Visuals', 'Tables & Numbers', 'Written Summaries', 'Mixed Format'],
      },
      {
        id: 'detail_level',
        type: 'scale',
        question: 'How much detail do you typically need?',
        minLabel: 'Just highlights',
        maxLabel: 'All details',
      },
      {
        id: 'update_frequency',
        type: 'single',
        question: 'How often would you like to receive updates?',
        options: ['Real-time', 'Hourly', 'Daily', 'Weekly'],
      },
    ],
  },
  {
    id: 'learning_style',
    title: 'Learning Style',
    description: 'Customize how we teach you new features',
    questions: [
      {
        id: 'learning_approach',
        type: 'single',
        question: 'How do you prefer to learn new features?',
        options: ['Video tutorials', 'Interactive walkthroughs', 'Written guides', 'Just exploring'],
      },
      {
        id: 'help_preference',
        type: 'single',
        question: 'When you need help, you prefer:',
        options: ['AI assistant', 'Documentation', 'Video demos', 'Human support'],
      },
    ],
  },
  {
    id: 'workflow_preference',
    title: 'Workflow Preferences',
    description: 'Optimize your daily workflow',
    questions: [
      {
        id: 'automation_comfort',
        type: 'scale',
        question: 'How comfortable are you with automated actions?',
        minLabel: 'Prefer manual',
        maxLabel: 'Fully automated',
      },
      {
        id: 'notification_style',
        type: 'single',
        question: 'How should we notify you of important events?',
        options: ['In-app only', 'Email digest', 'Push notifications', 'All channels'],
      },
      {
        id: 'focus_areas',
        type: 'multiple',
        question: 'Which areas are most important to you?',
        options: ['Financial Data', 'Team Communications', 'Task Management', 'Strategic Insights', 'Operations'],
      },
    ],
  },
  {
    id: 'quick_feedback',
    title: 'Quick Feedback',
    description: 'Help us improve',
    questions: [
      {
        id: 'satisfaction',
        type: 'scale',
        question: 'How helpful was this feature?',
        minLabel: 'Not helpful',
        maxLabel: 'Very helpful',
      },
      {
        id: 'improvement',
        type: 'text',
        question: 'Any suggestions for improvement?',
      },
    ],
  },
];

export function usePreferenceSurveys(userId: string | undefined) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [pendingSurveys, setPendingSurveys] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setResponses([]);
      setIsLoading(false);
      return;
    }

    const fetchResponses = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_preference_surveys')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResponses((data || []) as SurveyResponse[]);

        // Determine which surveys haven't been completed
        const completedSurveyIds = new Set((data || []).map((r: any) => r.survey_type));
        const pending = SURVEYS.filter((s) => !completedSurveyIds.has(s.id)).map((s) => s.id);
        setPendingSurveys(pending);
      } catch (error) {
        console.error('Error fetching survey responses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponses();
  }, [userId]);

  const submitResponse = useCallback(async (
    surveyType: string,
    questionId: string,
    response: any,
    context?: Record<string, any>
  ): Promise<void> => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_preference_surveys')
        .insert({
          user_id: userId,
          survey_type: surveyType,
          question_id: questionId,
          response,
          context,
        })
        .select()
        .single();

      if (error) throw error;
      setResponses((prev) => [data as SurveyResponse, ...prev]);
    } catch (error) {
      console.error('Error submitting survey response:', error);
    }
  }, [userId]);

  const submitSurvey = useCallback(async (
    surveyId: string,
    answers: Record<string, any>,
    context?: Record<string, any>
  ): Promise<void> => {
    if (!userId) return;

    try {
      const inserts = Object.entries(answers).map(([questionId, response]) => ({
        user_id: userId,
        survey_type: surveyId,
        question_id: questionId,
        response,
        context,
      }));

      const { data, error } = await supabase
        .from('user_preference_surveys')
        .insert(inserts)
        .select();

      if (error) throw error;

      setResponses((prev) => [...(data as SurveyResponse[]), ...prev]);
      setPendingSurveys((prev) => prev.filter((id) => id !== surveyId));
      setActiveSurvey(null);
    } catch (error) {
      console.error('Error submitting survey:', error);
    }
  }, [userId]);

  const getResponseForQuestion = useCallback((surveyType: string, questionId: string): any => {
    const response = responses.find(
      (r) => r.survey_type === surveyType && r.question_id === questionId
    );
    return response?.response;
  }, [responses]);

  const showSurvey = useCallback((surveyId: string) => {
    const survey = SURVEYS.find((s) => s.id === surveyId);
    if (survey) {
      setActiveSurvey(survey);
    }
  }, []);

  const dismissSurvey = useCallback(() => {
    setActiveSurvey(null);
  }, []);

  const getPreferredFormat = useCallback((): string => {
    return getResponseForQuestion('content_preference', 'preferred_format') || 'Mixed Format';
  }, [getResponseForQuestion]);

  const getDetailLevel = useCallback((): number => {
    return getResponseForQuestion('content_preference', 'detail_level') || 5;
  }, [getResponseForQuestion]);

  return {
    responses,
    isLoading,
    activeSurvey,
    pendingSurveys,
    submitResponse,
    submitSurvey,
    getResponseForQuestion,
    showSurvey,
    dismissSurvey,
    getPreferredFormat,
    getDetailLevel,
    SURVEYS,
  };
}
