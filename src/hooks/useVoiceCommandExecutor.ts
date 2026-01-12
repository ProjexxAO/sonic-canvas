import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceCommandBus } from '@/lib/voice-command-bus';
import { useToast } from '@/hooks/use-toast';

export function useVoiceCommandExecutor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentCommand = useVoiceCommandBus((state) => state.currentCommand);
  const clearCommand = useVoiceCommandBus((state) => state.clearCommand);

  useEffect(() => {
    if (!currentCommand) return;

    console.log('⚡ Executing command:', currentCommand);

    try {
      switch (currentCommand.type) {
        case 'navigate':
          navigate(currentCommand.path);
          toast({
            title: '🎤 Voice Navigation',
            description: `Navigating to ${currentCommand.path}`,
          });
          break;

        case 'filter':
          // Dispatch event that other components can listen to
          window.dispatchEvent(new CustomEvent('voice-filter', {
            detail: {
              entity: currentCommand.entity,
              criteria: currentCommand.criteria
            }
          }));
          toast({
            title: '🎤 Filter Applied',
            description: `Filtering ${currentCommand.entity}`,
          });
          break;

        case 'show_notification':
          toast({
            title: currentCommand.variant === 'error' ? '❌ Error' : '✅ Success',
            description: currentCommand.message,
            variant: currentCommand.variant === 'error' ? 'destructive' : 'default'
          });
          break;

        case 'voice_response':
          toast({
            title: '🎤 Atlas',
            description: currentCommand.text,
          });
          break;
      }

      // Clear command after execution
      clearCommand();

    } catch (error) {
      console.error('Command execution error:', error);
      toast({
        title: 'Command Failed',
        description: 'Could not execute voice command',
        variant: 'destructive'
      });
    }
  }, [currentCommand, navigate, toast, clearCommand]);
}
