import { useState, useEffect } from 'react';
import { Users, User, ChevronDown, Check, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  preferred_persona: string | null;
}

interface Persona {
  id: string;
  label: string;
  category: string;
}

interface UserPersonaManagerProps {
  personas: Persona[];
  currentUserId: string | undefined;
}

export function UserPersonaManager({ personas, currentUserId }: UserPersonaManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, preferred_persona')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePersonaChange = async (userId: string, personaId: string | null) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_persona: personaId })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, preferred_persona: personaId } : u
      ));
      
      toast.success(`Persona updated successfully`);
    } catch (error) {
      console.error('Error updating persona:', error);
      toast.error('Failed to update persona');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.preferred_persona?.toLowerCase().includes(query)
    );
  });

  const getPersonaLabel = (personaId: string | null) => {
    if (!personaId) return 'No Persona';
    return personas.find(p => p.id === personaId)?.label || personaId;
  };

  const getPersonaCategory = (personaId: string | null) => {
    if (!personaId) return null;
    return personas.find(p => p.id === personaId)?.category;
  };

  return (
    <div className="p-2 rounded bg-background border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={12} className="text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase">User Persona Management</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={fetchUsers}
          disabled={isLoading}
        >
          <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-[10px] pl-6"
        />
      </div>

      {/* Users List */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-1">
          {isLoading ? (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] font-mono text-foreground truncate">
                    {user.display_name || 'Unnamed User'}
                  </span>
                  {user.user_id === currentUserId && (
                    <Badge variant="secondary" className="text-[7px] px-1 py-0">YOU</Badge>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[9px] font-mono px-2 gap-1"
                      disabled={updatingUserId === user.user_id}
                    >
                      {updatingUserId === user.user_id ? (
                        <RefreshCw size={8} className="animate-spin" />
                      ) : (
                        <>
                          <span className="truncate max-w-[60px]">
                            {getPersonaLabel(user.preferred_persona)}
                          </span>
                          {getPersonaCategory(user.preferred_persona) && (
                            <Badge variant="secondary" className="text-[7px] px-1 py-0 hidden sm:inline-flex">
                              {getPersonaCategory(user.preferred_persona)}
                            </Badge>
                          )}
                          <ChevronDown size={8} />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 max-h-[200px] overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() => handlePersonaChange(user.user_id, null)}
                      className="text-[10px] font-mono"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>No Persona</span>
                        {!user.preferred_persona && <Check size={10} />}
                      </div>
                    </DropdownMenuItem>
                    {personas.map((persona) => (
                      <DropdownMenuItem
                        key={persona.id}
                        onClick={() => handlePersonaChange(user.user_id, persona.id)}
                        className="text-[10px] font-mono"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-1.5">
                            <span>{persona.label}</span>
                            <Badge variant="secondary" className="text-[7px] px-1 py-0">
                              {persona.category}
                            </Badge>
                          </div>
                          {user.preferred_persona === persona.id && <Check size={10} />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-2 text-[9px] text-muted-foreground text-center">
        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
