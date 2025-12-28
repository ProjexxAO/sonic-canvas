import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Check, X, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PersonaPermission {
  id: string;
  persona_id: string;
  domain: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface Persona {
  id: string;
  label: string;
  category: string;
}

const DOMAINS = [
  { id: 'communications', label: 'Communications' },
  { id: 'documents', label: 'Documents' },
  { id: 'events', label: 'Events' },
  { id: 'financials', label: 'Financials' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'knowledge', label: 'Knowledge' },
];

interface PersonaPermissionsManagerProps {
  personas: Persona[];
}

export function PersonaPermissionsManager({ personas }: PersonaPermissionsManagerProps) {
  const [permissions, setPermissions] = useState<PersonaPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>('ceo');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('persona_permissions')
        .select('*')
        .order('persona_id', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const getPersonaPermissions = (personaId: string) => {
    return permissions.filter(p => p.persona_id === personaId);
  };

  const handlePermissionChange = async (
    permissionId: string, 
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete', 
    value: boolean
  ) => {
    setUpdating(permissionId);
    try {
      const { error } = await supabase
        .from('persona_permissions')
        .update({ [field]: value })
        .eq('id', permissionId);

      if (error) throw error;

      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, [field]: value } : p
      ));
      
      toast.success('Permission updated');
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    } finally {
      setUpdating(null);
    }
  };

  const currentPersonaPermissions = getPersonaPermissions(selectedPersona);
  const currentPersona = personas.find(p => p.id === selectedPersona);

  return (
    <div className="p-2 rounded bg-background border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Persona Permissions</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={fetchPermissions}
          disabled={isLoading}
        >
          <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Persona Selector */}
      <div className="mb-3">
        <Select value={selectedPersona} onValueChange={setSelectedPersona}>
          <SelectTrigger className="h-7 text-[10px] font-mono">
            <SelectValue placeholder="Select persona" />
          </SelectTrigger>
          <SelectContent>
            {personas.map((persona) => (
              <SelectItem key={persona.id} value={persona.id} className="text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span>{persona.label}</span>
                  <Badge variant="secondary" className="text-[7px] px-1 py-0">
                    {persona.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Persona Info */}
      {currentPersona && (
        <div className="mb-3 p-2 rounded bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary">{currentPersona.label}</span>
            <Badge variant="secondary" className="text-[8px]">{currentPersona.category}</Badge>
          </div>
        </div>
      )}

      {/* Permissions Table */}
      <ScrollArea className="h-[250px]">
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-5 gap-1 px-2 py-1 bg-muted/50 rounded text-[8px] font-mono text-muted-foreground">
            <span>Domain</span>
            <span className="text-center">View</span>
            <span className="text-center">Create</span>
            <span className="text-center">Edit</span>
            <span className="text-center">Delete</span>
          </div>

          {isLoading ? (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              Loading permissions...
            </div>
          ) : currentPersonaPermissions.length === 0 ? (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              No permissions configured for this persona
            </div>
          ) : (
            DOMAINS.map(domain => {
              const perm = currentPersonaPermissions.find(p => p.domain === domain.id);
              if (!perm) return null;

              const isUpdating = updating === perm.id;

              return (
                <div 
                  key={domain.id} 
                  className="grid grid-cols-5 gap-1 px-2 py-1.5 bg-muted/30 rounded items-center"
                >
                  <span className="text-[9px] font-mono text-foreground">{domain.label}</span>
                  
                  {/* View */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.can_view}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(perm.id, 'can_view', !!checked)
                      }
                      disabled={isUpdating}
                      className="h-3 w-3"
                    />
                  </div>
                  
                  {/* Create */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.can_create}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(perm.id, 'can_create', !!checked)
                      }
                      disabled={isUpdating || !perm.can_view}
                      className="h-3 w-3"
                    />
                  </div>
                  
                  {/* Edit */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.can_edit}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(perm.id, 'can_edit', !!checked)
                      }
                      disabled={isUpdating || !perm.can_view}
                      className="h-3 w-3"
                    />
                  </div>
                  
                  {/* Delete */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={perm.can_delete}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(perm.id, 'can_delete', !!checked)
                      }
                      disabled={isUpdating || !perm.can_view}
                      className="h-3 w-3"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="mt-2 flex items-center gap-2 text-[8px] text-muted-foreground">
        <Eye size={8} /> View
        <Plus size={8} /> Create
        <Edit size={8} /> Edit
        <Trash2 size={8} /> Delete
      </div>
    </div>
  );
}
