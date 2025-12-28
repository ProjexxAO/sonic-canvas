import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DollarSign, Calendar, Tag, FileText, Building, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FinancialItem } from '@/hooks/useCSuiteData';

interface FinancialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialItem | null;
  defaultType?: string;
  userId: string;
  onSaved: () => void;
  onDeleted?: () => void;
}

const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income', color: 'text-green-500' },
  { value: 'expense', label: 'Expense', color: 'text-red-500' },
  { value: 'invoice', label: 'Invoice', color: 'text-blue-500' },
  { value: 'bill', label: 'Bill', color: 'text-orange-500' },
  { value: 'transfer', label: 'Transfer', color: 'text-purple-500' },
];

const CATEGORIES = [
  'Sales', 'Services', 'Consulting', 'Subscriptions',
  'Rent', 'Utilities', 'Payroll', 'Marketing', 'Software',
  'Travel', 'Office Supplies', 'Professional Services',
  'Insurance', 'Taxes', 'Interest', 'Other'
];

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];

export function FinancialFormDialog({
  open,
  onOpenChange,
  transaction,
  defaultType = 'expense',
  userId,
  onSaved,
  onDeleted,
}: FinancialFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('pending');
  const [counterparty, setCounterparty] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const isEditing = !!transaction;

  useEffect(() => {
    if (open) {
      if (transaction) {
        setTitle(transaction.title || '');
        setDescription(transaction.preview || '');
        setType(transaction.type || 'expense');
        setAmount(transaction.amount?.toString() || '');
        setCurrency(transaction.currency || 'USD');
        setCategory(transaction.category || '');
        setStatus(transaction.status || 'pending');
        setCounterparty((transaction.metadata as any)?.counterparty || '');
        setTransactionDate(transaction.date ? format(transaction.date, 'yyyy-MM-dd') : '');
        setDueDate((transaction.metadata as any)?.due_date || '');
      } else {
        setTitle('');
        setDescription('');
        setType(defaultType);
        setAmount('');
        setCurrency('USD');
        setCategory('');
        setStatus('pending');
        setCounterparty('');
        setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
        setDueDate('');
      }
    }
  }, [open, transaction, defaultType]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        amount: parseFloat(amount),
        currency,
        category: category || null,
        status,
        counterparty: counterparty.trim() || null,
        transaction_date: transactionDate || null,
        due_date: dueDate || null,
        source: 'manual',
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && transaction) {
        const { error } = await supabase
          .from('csuite_financials')
          .update(data)
          .eq('id', transaction.id);
        if (error) throw error;
        toast.success('Transaction updated');
      } else {
        const { error } = await supabase
          .from('csuite_financials')
          .insert(data);
        if (error) throw error;
        toast.success('Transaction created');
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('csuite_financials')
        .delete()
        .eq('id', transaction.id);
      if (error) throw error;
      toast.success('Transaction deleted');
      onDeleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              {isEditing ? 'Edit Transaction' : 'New Transaction'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Transaction title"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className={t.color}>{t.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <DollarSign size={12} />
                  Amount *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono flex items-center gap-1">
                <Tag size={12} />
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono flex items-center gap-1">
                <Building size={12} />
                Counterparty
              </Label>
              <Input
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Customer/Vendor name"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Calendar size={12} />
                  Transaction Date
                </Label>
                <Input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Calendar size={12} />
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono flex items-center gap-1">
                <FileText size={12} />
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="sm:mr-auto"
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{transaction?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
