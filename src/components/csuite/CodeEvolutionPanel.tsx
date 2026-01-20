import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCodeEvolution } from '@/hooks/useCodeEvolution';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dna, 
  GitBranch, 
  Zap, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Code,
  Brain,
  Activity,
  Shield,
  Loader2,
  Play,
  Eye
} from 'lucide-react';

const AUTHORIZED_EMAIL = 'projexxnz@gmail.com';

export function CodeEvolutionPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<'agent' | 'workflow' | 'capability' | 'function'>('agent');
  const [evolutionType, setEvolutionType] = useState<'improvement' | 'new_feature' | 'refactor' | 'optimization'>('improvement');
  const [sourceCode, setSourceCode] = useState('');
  const [selectedEvolution, setSelectedEvolution] = useState<string | null>(null);
  
  const {
    evolutions,
    loading,
    analyzing,
    analyzeCode,
    evolveCode,
    approveEvolution,
    rejectEvolution,
    rollbackEvolution
  } = useCodeEvolution();

  // Check if current user is authorized
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === AUTHORIZED_EMAIL) {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthorization();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email === AUTHORIZED_EMAIL) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Don't render anything if not authorized
  }

  const handleAnalyze = async () => {
    if (!entityName || !sourceCode) return;
    await analyzeCode(entityName, entityType, sourceCode);
  };

  const handleEvolve = async () => {
    if (!entityName || !sourceCode) return;
    await evolveCode(entityName, entityType, sourceCode, evolutionType);
    setSourceCode('');
    setEntityName('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'applied': return 'bg-blue-500/20 text-blue-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'rolled_back': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const selectedEvo = evolutions.find(e => e.id === selectedEvolution);

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dna className="w-5 h-5 text-primary" />
            Code Evolution Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="proposals">Proposals ({evolutions.filter(e => e.evolution_status === 'proposed').length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Entity Name</label>
                  <Input
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="e.g., FinanceAnalyzer"
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Entity Type</label>
                  <Select value={entityType} onValueChange={(v: any) => setEntityType(v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="capability">Capability</SelectItem>
                      <SelectItem value="function">Function</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Evolution Type</label>
                <Select value={evolutionType} onValueChange={(v: any) => setEvolutionType(v)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="new_feature">New Feature</SelectItem>
                    <SelectItem value="refactor">Refactor</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Source Code</label>
                <Textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="Paste the code to analyze and evolve..."
                  className="min-h-[200px] font-mono text-xs bg-background/50"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!entityName || !sourceCode || analyzing}
                  variant="outline"
                  className="flex-1"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Analyze
                </Button>
                <Button
                  onClick={handleEvolve}
                  disabled={!entityName || !sourceCode || analyzing}
                  className="flex-1"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Evolve
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="proposals">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {evolutions
                    .filter(e => e.evolution_status === 'proposed')
                    .map((evolution) => (
                      <Card 
                        key={evolution.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedEvolution === evolution.id ? 'border-primary' : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedEvolution(evolution.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Code className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">{evolution.entity_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {evolution.entity_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge className={getStatusColor(evolution.evolution_status)}>
                                  {evolution.evolution_status}
                                </Badge>
                                <span>•</span>
                                <span>{evolution.evolution_type}</span>
                                <span>•</span>
                                <span>Compat: {(evolution.compatibility_score * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-green-500 hover:text-green-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveEvolution(evolution.id);
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectEvolution(evolution.id);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {selectedEvolution === evolution.id && (
                            <div className="mt-3 pt-3 border-t space-y-3">
                              {/* Sonic Signature Visualization */}
                              <div className="p-2 bg-background/50 rounded">
                                <div className="flex items-center gap-2 mb-2">
                                  <Dna className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium">Sonic Signature</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Complexity</span>
                                    <span className="font-mono">{(evolution.sonic_signature?.complexity_score * 100 || 0).toFixed(0)}%</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Depth</span>
                                    <span className="font-mono">{evolution.sonic_signature?.dependency_depth || 0}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-muted-foreground">Generation</span>
                                    <span className="font-mono">{evolution.sonic_signature?.evolution_generation || 0}</span>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Activity className="w-3 h-3 text-primary" />
                                  <span className="text-xs text-muted-foreground">
                                    Waveform: {evolution.sonic_signature?.waveform_encoding || 'sine'} @ {(evolution.sonic_signature?.frequency_fingerprint || 440).toFixed(0)}Hz
                                  </span>
                                </div>
                              </div>

                              {/* Improvements */}
                              {evolution.improvement_analysis?.suggestions?.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Brain className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-medium">Improvements</span>
                                  </div>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {evolution.improvement_analysis.suggestions.slice(0, 3).map((s: string, i: number) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-primary">•</span>
                                        <span>{s}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Risk Assessment */}
                              {evolution.risk_assessment && (
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-yellow-500" />
                                  <span className="text-xs text-muted-foreground">
                                    Testability: {evolution.risk_assessment.testability || 70}%
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                  {evolutions.filter(e => e.evolution_status === 'proposed').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending proposals</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {evolutions
                    .filter(e => e.evolution_status !== 'proposed')
                    .map((evolution) => (
                      <Card key={evolution.id} className="bg-background/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{evolution.entity_name}</span>
                                <Badge className={getStatusColor(evolution.evolution_status)}>
                                  {evolution.evolution_status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(evolution.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {evolution.evolution_status === 'approved' && evolution.rollback_available && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rollbackEvolution(evolution.id)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Rollback
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {evolutions.filter(e => e.evolution_status !== 'proposed').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No evolution history</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
