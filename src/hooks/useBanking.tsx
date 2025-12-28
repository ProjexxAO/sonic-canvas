import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_number_masked: string | null;
  institution_name: string;
  institution_logo_url: string | null;
  account_type: string;
  currency: string;
  current_balance: number | null;
  available_balance: number | null;
  connection_provider: string | null;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  bank_account_id: string;
  external_id: string | null;
  transaction_date: string;
  posted_date: string | null;
  description: string;
  merchant_name: string | null;
  merchant_category: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  category: string | null;
  is_pending: boolean;
  created_at: string;
}

export interface TransactionReconciliation {
  id: string;
  user_id: string;
  bank_transaction_id: string;
  financial_record_id: string | null;
  match_type: string;
  match_confidence: number | null;
  match_status: string;
  matched_by: string | null;
  match_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface TaxConfiguration {
  id: string;
  country_code: string;
  country_name: string;
  tax_type: string;
  tax_name: string;
  standard_rate: number;
  reduced_rates: any;
  threshold_amount: number | null;
  threshold_currency: string;
  filing_frequency: string | null;
  tax_year_start: string | null;
  rules: any;
  is_active: boolean;
  effective_from: string;
}

export interface UserTaxSettings {
  id: string;
  user_id: string;
  primary_country_code: string;
  tax_registration_number: string | null;
  is_registered_for_tax: boolean;
  registration_date: string | null;
  filing_frequency: string | null;
  accounting_method: string;
  tax_year_end_month: number;
  auto_calculate_tax: boolean;
  include_tax_in_prices: boolean;
}

export interface FinancialInsight {
  id: string;
  user_id: string;
  insight_type: string;
  priority: string;
  title: string;
  description: string;
  recommendation: string | null;
  impact_amount: number | null;
  impact_currency: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  data: any;
  is_read: boolean;
  is_actioned: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useBanking() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [reconciliations, setReconciliations] = useState<TransactionReconciliation[]>([]);
  const [taxConfigs, setTaxConfigs] = useState<TaxConfiguration[]>([]);
  const [userTaxSettings, setUserTaxSettings] = useState<UserTaxSettings | null>(null);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching bank accounts:', error);
      return;
    }

    setAccounts(data as BankAccount[]);
  }, [user?.id]);

  const fetchTransactions = useCallback(async (accountId?: string) => {
    if (!user?.id) return;

    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(100);

    if (accountId) {
      query = query.eq('bank_account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data as BankTransaction[]);
  }, [user?.id]);

  const fetchReconciliations = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('transaction_reconciliations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reconciliations:', error);
      return;
    }

    setReconciliations(data as TransactionReconciliation[]);
  }, [user?.id]);

  const fetchTaxConfigs = useCallback(async () => {
    const { data, error } = await supabase
      .from('tax_configurations')
      .select('*')
      .eq('is_active', true)
      .order('country_name');

    if (error) {
      console.error('Error fetching tax configurations:', error);
      return;
    }

    setTaxConfigs(data as TaxConfiguration[]);
  }, []);

  const fetchUserTaxSettings = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_tax_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user tax settings:', error);
      return;
    }

    setUserTaxSettings(data as UserTaxSettings | null);
  }, [user?.id]);

  const fetchInsights = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('financial_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_actioned', false)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching insights:', error);
      return;
    }

    setInsights(data as FinancialInsight[]);
  }, [user?.id]);

  const addBankAccount = async (account: Partial<BankAccount>) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        account_name: account.account_name || '',
        institution_name: account.institution_name || '',
        account_type: account.account_type || 'checking',
        currency: account.currency || 'USD',
        account_number_masked: account.account_number_masked,
        current_balance: account.current_balance,
        available_balance: account.available_balance,
        connection_provider: account.connection_provider,
        is_primary: account.is_primary || false,
        sync_status: account.sync_status || 'pending',
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add bank account');
      console.error('Error adding bank account:', error);
      return null;
    }

    toast.success('Bank account added successfully');
    await fetchAccounts();
    return data as BankAccount;
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    const { error } = await supabase
      .from('bank_accounts')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update bank account');
      console.error('Error updating bank account:', error);
      return false;
    }

    toast.success('Bank account updated');
    await fetchAccounts();
    return true;
  };

  const deleteBankAccount = async (id: string) => {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete bank account');
      console.error('Error deleting bank account:', error);
      return false;
    }

    toast.success('Bank account deleted');
    await fetchAccounts();
    return true;
  };

  const addTransaction = async (transaction: Partial<BankTransaction>) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        bank_account_id: transaction.bank_account_id!,
        transaction_date: transaction.transaction_date!,
        description: transaction.description!,
        amount: transaction.amount!,
        transaction_type: transaction.transaction_type!,
        currency: transaction.currency || 'USD',
        merchant_name: transaction.merchant_name,
        category: transaction.category,
        is_pending: transaction.is_pending || false,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add transaction');
      console.error('Error adding transaction:', error);
      return null;
    }

    await fetchTransactions();
    return data as BankTransaction;
  };

  const saveUserTaxSettings = async (settings: Partial<UserTaxSettings>) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('user_tax_settings')
      .upsert({
        primary_country_code: settings.primary_country_code!,
        tax_registration_number: settings.tax_registration_number,
        is_registered_for_tax: settings.is_registered_for_tax || false,
        filing_frequency: settings.filing_frequency,
        accounting_method: settings.accounting_method || 'accrual',
        tax_year_end_month: settings.tax_year_end_month || 12,
        auto_calculate_tax: settings.auto_calculate_tax ?? true,
        include_tax_in_prices: settings.include_tax_in_prices || false,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to save tax settings');
      console.error('Error saving tax settings:', error);
      return null;
    }

    toast.success('Tax settings saved');
    await fetchUserTaxSettings();
    return data as UserTaxSettings;
  };

  const confirmReconciliation = async (reconciliationId: string) => {
    if (!user?.id) return false;

    const { error } = await supabase
      .from('transaction_reconciliations')
      .update({
        match_status: 'confirmed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', reconciliationId);

    if (error) {
      toast.error('Failed to confirm reconciliation');
      console.error('Error confirming reconciliation:', error);
      return false;
    }

    toast.success('Transaction reconciled');
    await fetchReconciliations();
    return true;
  };

  const rejectReconciliation = async (reconciliationId: string) => {
    if (!user?.id) return false;

    const { error } = await supabase
      .from('transaction_reconciliations')
      .update({
        match_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', reconciliationId);

    if (error) {
      toast.error('Failed to reject reconciliation');
      console.error('Error rejecting reconciliation:', error);
      return false;
    }

    await fetchReconciliations();
    return true;
  };

  const markInsightRead = async (insightId: string) => {
    const { error } = await supabase
      .from('financial_insights')
      .update({ is_read: true })
      .eq('id', insightId);

    if (error) {
      console.error('Error marking insight as read:', error);
      return false;
    }

    await fetchInsights();
    return true;
  };

  const actionInsight = async (insightId: string) => {
    const { error } = await supabase
      .from('financial_insights')
      .update({ 
        is_actioned: true,
        actioned_at: new Date().toISOString()
      })
      .eq('id', insightId);

    if (error) {
      console.error('Error actioning insight:', error);
      return false;
    }

    toast.success('Insight marked as actioned');
    await fetchInsights();
    return true;
  };

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchAccounts(),
      fetchTransactions(),
      fetchReconciliations(),
      fetchTaxConfigs(),
      fetchUserTaxSettings(),
      fetchInsights(),
    ]);
    setIsLoading(false);
  }, [fetchAccounts, fetchTransactions, fetchReconciliations, fetchTaxConfigs, fetchUserTaxSettings, fetchInsights]);

  useEffect(() => {
    if (user?.id) {
      refreshAll();
    }
  }, [user?.id, refreshAll]);

  return {
    accounts,
    transactions,
    reconciliations,
    taxConfigs,
    userTaxSettings,
    insights,
    isLoading,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addTransaction,
    saveUserTaxSettings,
    confirmReconciliation,
    rejectReconciliation,
    markInsightRead,
    actionInsight,
    fetchAccounts,
    fetchTransactions,
    refreshAll,
  };
}
