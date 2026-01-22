// Financial Intelligence Hook - Atlas-powered investment and vacation budget guidance
// Analyzes user finances to suggest vacation affordability and investment strategies

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useBanking, BankAccount, BankTransaction } from './useBanking';
import { differenceInDays, subDays, format } from 'date-fns';

export interface FinancialHealth {
  totalBalance: number;
  availableFunds: number; // After essential expenses
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  emergencyFundMonths: number;
  disposableIncome: number;
  healthScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

export interface VacationBudget {
  destination: string;
  estimatedCost: number;
  currency: string;
  breakdown: {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    other: number;
  };
  daysToSave: number;
  affordableNow: boolean;
  affordableDate?: Date;
  monthlySavingsNeeded: number;
  recommendation: string;
}

export interface InvestmentSuggestion {
  id: string;
  type: 'emergency_fund' | 'retirement' | 'short_term' | 'medium_term' | 'long_term' | 'vacation_fund';
  title: string;
  description: string;
  suggestedAmount: number;
  priority: 'high' | 'medium' | 'low';
  percentageOfIncome: number;
  vehicle: string; // e.g., "High-yield savings", "Index fund", "401k"
  reasoning: string;
}

export interface DestinationEstimate {
  destination: string;
  country: string;
  isInternational: boolean;
  averageDailyCost: number;
  flightEstimate: number;
  currency: string;
  bestTimeToVisit: string;
  budgetLevel: 'budget' | 'moderate' | 'luxury';
}

// Rough destination cost estimates (per day, USD)
const DESTINATION_COSTS: Record<string, DestinationEstimate> = {
  // Domestic US destinations
  'Las Vegas': { destination: 'Las Vegas', country: 'USA', isInternational: false, averageDailyCost: 200, flightEstimate: 250, currency: 'USD', bestTimeToVisit: 'Spring/Fall', budgetLevel: 'moderate' },
  'New York': { destination: 'New York', country: 'USA', isInternational: false, averageDailyCost: 300, flightEstimate: 300, currency: 'USD', bestTimeToVisit: 'Spring/Fall', budgetLevel: 'moderate' },
  'Miami': { destination: 'Miami', country: 'USA', isInternational: false, averageDailyCost: 220, flightEstimate: 280, currency: 'USD', bestTimeToVisit: 'Winter', budgetLevel: 'moderate' },
  'Hawaii': { destination: 'Hawaii', country: 'USA', isInternational: false, averageDailyCost: 280, flightEstimate: 400, currency: 'USD', bestTimeToVisit: 'April-June', budgetLevel: 'moderate' },
  
  // International destinations
  'Paris': { destination: 'Paris', country: 'France', isInternational: true, averageDailyCost: 250, flightEstimate: 800, currency: 'EUR', bestTimeToVisit: 'Spring/Fall', budgetLevel: 'moderate' },
  'London': { destination: 'London', country: 'UK', isInternational: true, averageDailyCost: 280, flightEstimate: 750, currency: 'GBP', bestTimeToVisit: 'May-Sept', budgetLevel: 'moderate' },
  'Tokyo': { destination: 'Tokyo', country: 'Japan', isInternational: true, averageDailyCost: 200, flightEstimate: 1200, currency: 'JPY', bestTimeToVisit: 'Spring/Fall', budgetLevel: 'moderate' },
  'Bali': { destination: 'Bali', country: 'Indonesia', isInternational: true, averageDailyCost: 80, flightEstimate: 900, currency: 'IDR', bestTimeToVisit: 'Apr-Oct', budgetLevel: 'budget' },
  'Thailand': { destination: 'Thailand', country: 'Thailand', isInternational: true, averageDailyCost: 60, flightEstimate: 850, currency: 'THB', bestTimeToVisit: 'Nov-Feb', budgetLevel: 'budget' },
  'Mexico': { destination: 'Mexico', country: 'Mexico', isInternational: true, averageDailyCost: 100, flightEstimate: 350, currency: 'MXN', bestTimeToVisit: 'Dec-Apr', budgetLevel: 'budget' },
  'Italy': { destination: 'Italy', country: 'Italy', isInternational: true, averageDailyCost: 220, flightEstimate: 850, currency: 'EUR', bestTimeToVisit: 'Spring/Fall', budgetLevel: 'moderate' },
  'Australia': { destination: 'Australia', country: 'Australia', isInternational: true, averageDailyCost: 200, flightEstimate: 1400, currency: 'AUD', bestTimeToVisit: 'Sept-Nov', budgetLevel: 'moderate' },
  'Greece': { destination: 'Greece', country: 'Greece', isInternational: true, averageDailyCost: 150, flightEstimate: 800, currency: 'EUR', bestTimeToVisit: 'May-Oct', budgetLevel: 'moderate' },
  'Portugal': { destination: 'Portugal', country: 'Portugal', isInternational: true, averageDailyCost: 120, flightEstimate: 700, currency: 'EUR', bestTimeToVisit: 'Spring/Fall', budgetLevel: 'budget' },
};

export function useFinancialIntelligence() {
  const { user } = useAuth();
  const { accounts, transactions, refreshAll } = useBanking();
  
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
  const [investmentSuggestions, setInvestmentSuggestions] = useState<InvestmentSuggestion[]>([]);
  const [vacationBudgets, setVacationBudgets] = useState<VacationBudget[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate financial health metrics
  const analyzeFinancialHealth = useCallback(() => {
    if (!accounts.length) {
      setFinancialHealth(null);
      return;
    }

    setIsAnalyzing(true);

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    
    // Calculate monthly income/expenses from transactions (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= thirtyDaysAgo
    );
    
    const monthlyIncome = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const netMonthlyCashflow = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (netMonthlyCashflow / monthlyIncome) * 100 : 0;
    
    // Estimate essential expenses (rent, utilities, food) as ~60% of total expenses
    const essentialExpenses = monthlyExpenses * 0.6;
    const disposableIncome = monthlyIncome - essentialExpenses;
    const availableFunds = Math.max(0, totalBalance - (monthlyExpenses * 2)); // Keep 2 months buffer
    
    // Emergency fund calculation (ideally 3-6 months of expenses)
    const emergencyFundMonths = monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0;
    
    // Calculate health score
    let healthScore = 50;
    if (savingsRate >= 20) healthScore += 20;
    else if (savingsRate >= 10) healthScore += 10;
    else if (savingsRate < 0) healthScore -= 20;
    
    if (emergencyFundMonths >= 6) healthScore += 20;
    else if (emergencyFundMonths >= 3) healthScore += 10;
    else if (emergencyFundMonths < 1) healthScore -= 10;
    
    if (netMonthlyCashflow > 0) healthScore += 10;
    else healthScore -= 10;
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Determine trend based on balance changes
    const trend: 'improving' | 'stable' | 'declining' = 
      netMonthlyCashflow > monthlyIncome * 0.1 ? 'improving' :
      netMonthlyCashflow < -monthlyIncome * 0.1 ? 'declining' : 'stable';

    setFinancialHealth({
      totalBalance,
      availableFunds,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      emergencyFundMonths,
      disposableIncome,
      healthScore,
      trend
    });

    setIsAnalyzing(false);
  }, [accounts, transactions]);

  // Generate investment suggestions based on financial health
  const generateInvestmentSuggestions = useCallback(() => {
    if (!financialHealth) {
      setInvestmentSuggestions([]);
      return;
    }

    const suggestions: InvestmentSuggestion[] = [];
    const { monthlyIncome, emergencyFundMonths, disposableIncome, savingsRate } = financialHealth;

    // Priority 1: Emergency fund (if < 3 months)
    if (emergencyFundMonths < 3) {
      const targetEmergency = financialHealth.monthlyExpenses * 3;
      const currentEmergency = financialHealth.monthlyExpenses * emergencyFundMonths;
      const needed = targetEmergency - currentEmergency;
      
      suggestions.push({
        id: 'emergency-fund',
        type: 'emergency_fund',
        title: 'Build Emergency Fund',
        description: `You have ${emergencyFundMonths.toFixed(1)} months of expenses saved. Aim for 3-6 months.`,
        suggestedAmount: Math.min(monthlyIncome * 0.2, needed / 6),
        priority: 'high',
        percentageOfIncome: 20,
        vehicle: 'High-yield savings account',
        reasoning: 'An emergency fund protects you from unexpected expenses without going into debt.'
      });
    }

    // Priority 2: Retirement (if not maximizing)
    if (monthlyIncome > 3000 && savingsRate < 50) {
      suggestions.push({
        id: 'retirement',
        type: 'retirement',
        title: 'Retirement Contributions',
        description: 'Maximize tax-advantaged retirement accounts before other investments.',
        suggestedAmount: monthlyIncome * 0.15,
        priority: emergencyFundMonths >= 3 ? 'high' : 'medium',
        percentageOfIncome: 15,
        vehicle: '401(k) or IRA',
        reasoning: 'Tax advantages and compound growth make early retirement contributions extremely valuable.'
      });
    }

    // Priority 3: Vacation fund
    if (disposableIncome > 500) {
      suggestions.push({
        id: 'vacation-fund',
        type: 'vacation_fund',
        title: 'Vacation Savings',
        description: 'Set aside funds for travel without impacting your emergency fund.',
        suggestedAmount: disposableIncome * 0.1,
        priority: 'low',
        percentageOfIncome: 5,
        vehicle: 'Dedicated savings account',
        reasoning: 'Regular small contributions add up for guilt-free vacations.'
      });
    }

    // Priority 4: General investing
    if (emergencyFundMonths >= 3 && disposableIncome > 500) {
      suggestions.push({
        id: 'index-funds',
        type: 'long_term',
        title: 'Index Fund Investing',
        description: 'Low-cost diversified investing for long-term wealth building.',
        suggestedAmount: disposableIncome * 0.15,
        priority: 'medium',
        percentageOfIncome: 10,
        vehicle: 'Total market index fund',
        reasoning: 'Index funds offer diversification and historically strong long-term returns.'
      });
    }

    setInvestmentSuggestions(suggestions);
  }, [financialHealth]);

  // Estimate vacation budget for a destination
  const estimateVacationBudget = useCallback((
    destination: string,
    days: number,
    travelers: number = 1,
    budgetLevel: 'budget' | 'moderate' | 'luxury' = 'moderate'
  ): VacationBudget | null => {
    if (!financialHealth) return null;

    // Find destination or use average
    const destInfo = DESTINATION_COSTS[destination] || {
      destination,
      country: 'Unknown',
      isInternational: true,
      averageDailyCost: 150,
      flightEstimate: 800,
      currency: 'USD',
      bestTimeToVisit: 'Year-round',
      budgetLevel: 'moderate'
    };

    // Adjust for budget level
    const budgetMultiplier = budgetLevel === 'budget' ? 0.6 : budgetLevel === 'luxury' ? 1.8 : 1;
    const dailyCost = destInfo.averageDailyCost * budgetMultiplier;
    
    // Calculate breakdown
    const flights = destInfo.flightEstimate * travelers * budgetMultiplier;
    const accommodation = dailyCost * 0.4 * days; // ~40% of daily
    const food = dailyCost * 0.3 * days * travelers;
    const activities = dailyCost * 0.2 * days * travelers;
    const other = dailyCost * 0.1 * days * travelers;
    
    const totalCost = flights + accommodation + food + activities + other;
    
    // Calculate affordability
    const { availableFunds, disposableIncome } = financialHealth;
    const affordableNow = availableFunds >= totalCost;
    
    let daysToSave = 0;
    let affordableDate: Date | undefined;
    let monthlySavingsNeeded = 0;
    
    if (!affordableNow && disposableIncome > 0) {
      const vacationSavingsPerMonth = disposableIncome * 0.2; // Assume 20% of disposable for vacation
      daysToSave = Math.ceil((totalCost - availableFunds) / (vacationSavingsPerMonth / 30));
      affordableDate = new Date(Date.now() + daysToSave * 24 * 60 * 60 * 1000);
      monthlySavingsNeeded = (totalCost - availableFunds) / (daysToSave / 30);
    }
    
    // Generate recommendation
    let recommendation = '';
    if (affordableNow) {
      recommendation = `Great news! You can afford this trip now while maintaining a healthy financial buffer.`;
    } else if (daysToSave < 90) {
      recommendation = `Save $${monthlySavingsNeeded.toFixed(0)}/month and you'll be ready in ${Math.ceil(daysToSave / 30)} months.`;
    } else if (daysToSave < 180) {
      recommendation = `This is achievable with dedicated saving. Consider a ${budgetLevel === 'moderate' ? 'budget' : 'moderate'} option to reach your goal faster.`;
    } else {
      recommendation = `Consider a closer or more budget-friendly destination first, or save aggressively for this dream trip.`;
    }

    return {
      destination,
      estimatedCost: totalCost,
      currency: 'USD',
      breakdown: { flights, accommodation, food, activities, other },
      daysToSave,
      affordableNow,
      affordableDate,
      monthlySavingsNeeded,
      recommendation
    };
  }, [financialHealth]);

  // Get affordable destinations based on current finances
  const getAffordableDestinations = useCallback((
    days: number = 7,
    travelers: number = 1
  ): { affordable: VacationBudget[]; reachable: VacationBudget[] } => {
    const destinations = Object.keys(DESTINATION_COSTS);
    const budgets = destinations
      .map(dest => estimateVacationBudget(dest, days, travelers, 'moderate'))
      .filter((b): b is VacationBudget => b !== null);
    
    const affordable = budgets.filter(b => b.affordableNow).sort((a, b) => a.estimatedCost - b.estimatedCost);
    const reachable = budgets.filter(b => !b.affordableNow && b.daysToSave <= 180).sort((a, b) => a.daysToSave - b.daysToSave);
    
    return { affordable, reachable };
  }, [estimateVacationBudget]);

  // Run analysis when data changes
  useEffect(() => {
    if (accounts.length > 0) {
      analyzeFinancialHealth();
    }
  }, [accounts, transactions, analyzeFinancialHealth]);

  // Generate suggestions when health changes
  useEffect(() => {
    if (financialHealth) {
      generateInvestmentSuggestions();
    }
  }, [financialHealth, generateInvestmentSuggestions]);

  // Available destinations list
  const availableDestinations = useMemo(() => Object.keys(DESTINATION_COSTS), []);

  return {
    financialHealth,
    investmentSuggestions,
    vacationBudgets,
    isAnalyzing,
    analyzeFinancialHealth,
    estimateVacationBudget,
    getAffordableDestinations,
    availableDestinations,
    DESTINATION_COSTS
  };
}
