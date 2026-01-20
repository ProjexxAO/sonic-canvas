import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SonicSignature {
  complexity_score: number;
  dependency_depth: number;
  evolution_generation: number;
  semantic_hash: string;
  capability_vector: number[];
  waveform_encoding: string;
  frequency_fingerprint: number;
}

interface EvolutionRequest {
  action: 'analyze' | 'evolve' | 'integrate' | 'rollback';
  entityType: 'agent' | 'workflow' | 'capability' | 'function';
  entityId?: string;
  entityName: string;
  sourceCode?: string;
  evolutionType?: 'improvement' | 'new_feature' | 'refactor' | 'optimization';
  userId: string;
}

// Generate sophisticated Sonic Signature for code entities
function generateSonicSignature(code: string, entityName: string, entityType: string): SonicSignature {
  // Complexity analysis
  const lines = code.split('\n').length;
  const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || []).length;
  const conditionals = (code.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g) || []).length;
  const complexity_score = Math.min(1, (lines * 0.01 + functions * 0.1 + conditionals * 0.15));

  // Dependency depth (imports/requires)
  const imports = (code.match(/import\s+.*from|require\s*\(/g) || []).length;
  const dependency_depth = Math.min(10, imports);

  // Evolution generation (starts at 0)
  const evolution_generation = 0;

  // Semantic hash based on structure
  const structuralElements = [entityName, entityType, functions, conditionals, imports].join(':');
  const semantic_hash = btoa(structuralElements).slice(0, 16);

  // Capability vector (8-dimensional representation)
  const capability_vector = [
    complexity_score,
    dependency_depth / 10,
    functions / 20,
    conditionals / 10,
    code.includes('async') ? 1 : 0,
    code.includes('try') ? 1 : 0,
    code.includes('Promise') ? 1 : 0,
    code.includes('class') ? 1 : 0
  ];

  // Waveform encoding based on code patterns
  const patterns = ['sine', 'square', 'sawtooth', 'triangle'];
  const patternIndex = (functions + conditionals) % patterns.length;
  const waveform_encoding = patterns[patternIndex];

  // Frequency fingerprint derived from code characteristics
  const baseFreq = 220;
  const frequency_fingerprint = baseFreq + (complexity_score * 440) + (dependency_depth * 55);

  return {
    complexity_score,
    dependency_depth,
    evolution_generation,
    semantic_hash,
    capability_vector,
    waveform_encoding,
    frequency_fingerprint
  };
}

// Analyze code for potential improvements
async function analyzeCode(code: string, entityType: string): Promise<{
  improvements: string[];
  compatibility_score: number;
  performance_impact: Record<string, any>;
  risk_assessment: Record<string, any>;
}> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const analysisPrompt = `Analyze this ${entityType} code for potential improvements:

\`\`\`javascript
${code}
\`\`\`

Provide analysis in JSON format:
{
  "improvements": ["list of specific improvement suggestions"],
  "performance_issues": ["any performance concerns"],
  "security_considerations": ["security-related observations"],
  "maintainability_score": 0-100,
  "testability_score": 0-100,
  "recommended_patterns": ["design patterns that could help"]
}`;

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Parse the analysis
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      improvements: analysis.improvements || [],
      compatibility_score: (analysis.maintainability_score || 70) / 100,
      performance_impact: {
        issues: analysis.performance_issues || [],
        optimization_potential: analysis.improvements?.length > 3 ? 'high' : 'moderate'
      },
      risk_assessment: {
        security: analysis.security_considerations || [],
        testability: analysis.testability_score || 70,
        patterns: analysis.recommended_patterns || []
      }
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      improvements: ['Unable to analyze - please review manually'],
      compatibility_score: 0.5,
      performance_impact: { error: 'Analysis failed' },
      risk_assessment: { error: 'Analysis failed' }
    };
  }
}

// Generate evolved code
async function evolveCode(
  sourceCode: string, 
  entityName: string, 
  entityType: string, 
  evolutionType: string,
  improvements: string[]
): Promise<{ evolvedCode: string; integrationPlan: Record<string, any> }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const evolutionPrompt = `You are an expert code evolution engine. Evolve this ${entityType} code named "${entityName}" with focus on: ${evolutionType}

Original code:
\`\`\`javascript
${sourceCode}
\`\`\`

Suggested improvements to apply:
${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

Generate the evolved code that incorporates these improvements while maintaining backward compatibility.
Also provide an integration plan in JSON format at the end:

Respond with:
1. The complete evolved code in a code block
2. Integration plan as JSON: {"steps": ["step1", "step2"], "breaking_changes": [], "migration_notes": "", "rollback_strategy": ""}`;

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: evolutionPrompt }],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract code block
    const codeMatch = content.match(/```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/);
    const evolvedCode = codeMatch ? codeMatch[1].trim() : sourceCode;

    // Extract integration plan
    const planMatch = content.match(/\{[\s\S]*"steps"[\s\S]*\}/);
    const integrationPlan = planMatch ? JSON.parse(planMatch[0]) : {
      steps: ['Review evolved code', 'Test in sandbox', 'Deploy incrementally'],
      breaking_changes: [],
      migration_notes: 'Standard evolution - no breaking changes expected',
      rollback_strategy: 'Revert to previous version stored in rollback_data'
    };

    return { evolvedCode, integrationPlan };
  } catch (error) {
    console.error('Evolution error:', error);
    return { 
      evolvedCode: sourceCode, 
      integrationPlan: { error: 'Evolution failed', fallback: true } 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EvolutionRequest = await req.json();
    const { action, entityType, entityId, entityName, sourceCode, evolutionType, userId } = request;

    console.log(`Code Evolution Engine: ${action} for ${entityType} "${entityName}"`);

    let result: Record<string, any> = {};

    switch (action) {
      case 'analyze': {
        if (!sourceCode) {
          throw new Error('Source code required for analysis');
        }

        const signature = generateSonicSignature(sourceCode, entityName, entityType);
        const analysis = await analyzeCode(sourceCode, entityType);

        result = {
          sonic_signature: signature,
          improvement_analysis: {
            suggestions: analysis.improvements,
            priority_order: analysis.improvements.slice(0, 5)
          },
          compatibility_score: analysis.compatibility_score,
          performance_impact: analysis.performance_impact,
          risk_assessment: analysis.risk_assessment
        };
        break;
      }

      case 'evolve': {
        if (!sourceCode) {
          throw new Error('Source code required for evolution');
        }

        // First analyze
        const signature = generateSonicSignature(sourceCode, entityName, entityType);
        const analysis = await analyzeCode(sourceCode, entityType);

        // Then evolve
        const { evolvedCode, integrationPlan } = await evolveCode(
          sourceCode,
          entityName,
          entityType,
          evolutionType || 'improvement',
          analysis.improvements
        );

        // Generate new signature for evolved code
        const evolvedSignature = generateSonicSignature(evolvedCode, entityName, entityType);
        evolvedSignature.evolution_generation = signature.evolution_generation + 1;

        result = {
          source_code: sourceCode,
          evolved_code: evolvedCode,
          sonic_signature: evolvedSignature,
          improvement_analysis: { suggestions: analysis.improvements },
          compatibility_score: analysis.compatibility_score,
          performance_impact: analysis.performance_impact,
          risk_assessment: analysis.risk_assessment,
          integration_plan: integrationPlan,
          rollback_data: {
            original_code: sourceCode,
            original_signature: signature,
            timestamp: new Date().toISOString()
          }
        };
        break;
      }

      case 'integrate': {
        // Mark evolution as applied
        result = {
          status: 'integration_ready',
          message: 'Evolution approved for integration',
          applied_at: new Date().toISOString()
        };
        break;
      }

      case 'rollback': {
        result = {
          status: 'rollback_ready',
          message: 'Ready to restore previous version'
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      entityType,
      entityName,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Code Evolution Engine error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
