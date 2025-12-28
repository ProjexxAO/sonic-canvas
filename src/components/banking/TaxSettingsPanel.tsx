import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, FileText, Calculator, Check, Info } from 'lucide-react';
import { useBanking, TaxConfiguration } from '@/hooks/useBanking';
import { toast } from 'sonner';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function TaxSettingsPanel() {
  const { taxConfigs, userTaxSettings, saveUserTaxSettings } = useBanking();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    primary_country_code: userTaxSettings?.primary_country_code || '',
    tax_registration_number: userTaxSettings?.tax_registration_number || '',
    is_registered_for_tax: userTaxSettings?.is_registered_for_tax || false,
    filing_frequency: userTaxSettings?.filing_frequency || 'quarterly',
    accounting_method: userTaxSettings?.accounting_method || 'accrual',
    tax_year_end_month: userTaxSettings?.tax_year_end_month || 12,
    auto_calculate_tax: userTaxSettings?.auto_calculate_tax ?? true,
    include_tax_in_prices: userTaxSettings?.include_tax_in_prices || false,
  });

  const selectedTaxConfig = taxConfigs.find(c => c.country_code === formData.primary_country_code);

  const handleSave = async () => {
    if (!formData.primary_country_code) {
      toast.error('Please select a country');
      return;
    }

    setIsSaving(true);
    try {
      await saveUserTaxSettings(formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Tax Configuration</CardTitle>
                <CardDescription>Configure your tax settings for Atlas to handle compliance</CardDescription>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Settings
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Tax Jurisdiction</Label>
              <Select
                value={formData.primary_country_code}
                onValueChange={(v) => setFormData({ ...formData, primary_country_code: v })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {taxConfigs.map((config) => (
                    <SelectItem key={config.country_code} value={config.country_code}>
                      {config.country_name} ({config.tax_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tax Registration Number</Label>
              <Input
                placeholder={selectedTaxConfig?.country_code === 'AU' ? 'ABN' : 
                            selectedTaxConfig?.country_code === 'GB' ? 'VAT Number' : 
                            'Tax ID'}
                value={formData.tax_registration_number}
                onChange={(e) => setFormData({ ...formData, tax_registration_number: e.target.value })}
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                {selectedTaxConfig?.country_code === 'AU' ? 'Australian Business Number' :
                 selectedTaxConfig?.country_code === 'GB' ? 'VAT Registration Number' :
                 selectedTaxConfig?.country_code === 'US' ? 'EIN or SSN' :
                 'Your tax identification number'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Registered for {selectedTaxConfig?.tax_name || 'Tax'}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTaxConfig?.threshold_amount && (
                    <>Threshold: {formatCurrency(selectedTaxConfig.threshold_amount, selectedTaxConfig.threshold_currency)}</>
                  )}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.is_registered_for_tax}
              onCheckedChange={(checked) => setFormData({ ...formData, is_registered_for_tax: checked })}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filing Frequency</Label>
              <Select
                value={formData.filing_frequency}
                onValueChange={(v) => setFormData({ ...formData, filing_frequency: v })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accounting Method</Label>
              <Select
                value={formData.accounting_method}
                onValueChange={(v) => setFormData({ ...formData, accounting_method: v })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash Basis</SelectItem>
                  <SelectItem value="accrual">Accrual Basis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Year End</Label>
              <Select
                value={formData.tax_year_end_month.toString()}
                onValueChange={(v) => setFormData({ ...formData, tax_year_end_month: parseInt(v) })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Auto-calculate tax on transactions</p>
                  <p className="text-xs text-muted-foreground">Atlas will automatically apply tax rates</p>
                </div>
              </div>
              <Switch
                checked={formData.auto_calculate_tax}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_calculate_tax: checked })}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Prices include tax</p>
                  <p className="text-xs text-muted-foreground">Tax-inclusive pricing mode</p>
                </div>
              </div>
              <Switch
                checked={formData.include_tax_in_prices}
                onCheckedChange={(checked) => setFormData({ ...formData, include_tax_in_prices: checked })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTaxConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {selectedTaxConfig.country_name} Tax Information
              <Badge variant="secondary">{selectedTaxConfig.tax_name}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Standard Rate</p>
                <p className="text-lg font-semibold">{selectedTaxConfig.standard_rate}%</p>
              </div>
              {selectedTaxConfig.threshold_amount && (
                <div>
                  <p className="text-xs text-muted-foreground">Registration Threshold</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedTaxConfig.threshold_amount, selectedTaxConfig.threshold_currency)}
                  </p>
                </div>
              )}
              {selectedTaxConfig.filing_frequency && (
                <div>
                  <p className="text-xs text-muted-foreground">Filing Frequency</p>
                  <p className="text-lg font-semibold capitalize">{selectedTaxConfig.filing_frequency}</p>
                </div>
              )}
              {selectedTaxConfig.tax_year_start && (
                <div>
                  <p className="text-xs text-muted-foreground">Tax Year Starts</p>
                  <p className="text-lg font-semibold capitalize">{selectedTaxConfig.tax_year_start}</p>
                </div>
              )}
            </div>

            {selectedTaxConfig.rules && typeof selectedTaxConfig.rules === 'object' && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm font-medium mb-2">Additional Information</p>
                {selectedTaxConfig.rules.exemptions && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Exemptions: </span>
                    {(selectedTaxConfig.rules.exemptions as string[]).map((ex: string) => (
                      <Badge key={ex} variant="outline" className="text-xs">{ex}</Badge>
                    ))}
                  </div>
                )}
                {selectedTaxConfig.rules.note && (
                  <p className="text-xs text-muted-foreground mt-2">{selectedTaxConfig.rules.note as string}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Tax Jurisdictions</CardTitle>
          <CardDescription>Atlas supports tax compliance for these regions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {taxConfigs.map((config) => (
                <div 
                  key={config.id} 
                  className={`p-2 rounded-lg border text-sm ${
                    config.country_code === formData.primary_country_code 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{config.country_name}</span>
                    {config.country_code === formData.primary_country_code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {config.tax_name} @ {config.standard_rate}%
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
