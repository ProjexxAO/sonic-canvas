import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Upload, Link, Globe, AlertCircle } from 'lucide-react';
import { useBanking } from '@/hooks/useBanking';

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'loan', label: 'Loan Account' },
  { value: 'investment', label: 'Investment Account' },
];

const BANKING_PROVIDERS = [
  { id: 'plaid', name: 'Plaid', regions: ['US', 'CA', 'UK', 'EU'], status: 'coming_soon' },
  { id: 'truelayer', name: 'TrueLayer', regions: ['UK', 'EU'], status: 'coming_soon' },
  { id: 'basiq', name: 'Basiq', regions: ['AU', 'NZ'], status: 'coming_soon' },
];

export function AddBankAccountDialog({ open, onOpenChange }: AddBankAccountDialogProps) {
  const { addBankAccount } = useBanking();
  const [method, setMethod] = useState<'manual' | 'connect'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    account_name: '',
    institution_name: '',
    account_type: 'checking',
    currency: 'USD',
    account_number_masked: '',
    current_balance: '',
    is_primary: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const account = await addBankAccount({
        account_name: formData.account_name,
        institution_name: formData.institution_name,
        account_type: formData.account_type,
        currency: formData.currency,
        account_number_masked: formData.account_number_masked || null,
        current_balance: formData.current_balance ? parseFloat(formData.current_balance) : null,
        available_balance: formData.current_balance ? parseFloat(formData.current_balance) : null,
        is_primary: formData.is_primary,
        connection_provider: 'manual',
        sync_status: 'synced',
      });

      if (account) {
        onOpenChange(false);
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      institution_name: '',
      account_type: 'checking',
      currency: 'USD',
      account_number_masked: '',
      current_balance: '',
      is_primary: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add Bank Account
          </DialogTitle>
          <DialogDescription>
            Connect your bank account to enable transaction syncing and reconciliation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={method} onValueChange={(v) => setMethod(v as 'manual' | 'connect')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="connect" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Connect Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name *</Label>
                  <Input
                    id="account_name"
                    placeholder="e.g., Business Checking"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution_name">Bank Name *</Label>
                  <Input
                    id="institution_name"
                    placeholder="e.g., Chase, Barclays"
                    value={formData.institution_name}
                    onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(v) => setFormData({ ...formData, account_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number (Last 4 digits)</Label>
                  <Input
                    id="account_number"
                    placeholder="1234"
                    maxLength={4}
                    value={formData.account_number_masked}
                    onChange={(e) => setFormData({ ...formData, account_number_masked: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                  <p className="text-xs text-muted-foreground">For your reference only</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_balance">Current Balance</Label>
                  <Input
                    id="current_balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="is_primary" className="text-sm font-normal cursor-pointer">
                  Set as primary account
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.account_name || !formData.institution_name}>
                  {isSubmitting ? 'Adding...' : 'Add Account'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="connect" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Open Banking Integration</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatic bank connections are coming soon. In the meantime, you can add accounts manually 
                      or import transactions via CSV/OFX files.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {BANKING_PROVIDERS.map((provider) => (
                  <Card key={provider.id} className="opacity-60">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{provider.name}</CardTitle>
                            <CardDescription className="text-xs">
                              Available in: {provider.regions.join(', ')}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setMethod('manual')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Account Manually Instead
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
