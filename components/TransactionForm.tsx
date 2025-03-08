"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialValues?: {
    recipient?: string;
    amount?: string;
    tokenAddress?: string;
  };
}

export function TransactionForm({ onSubmit, onCancel, initialValues = {} }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    recipient: initialValues.recipient || '',
    amount: initialValues.amount || '0.01',
    tokenAddress: initialValues.tokenAddress || '',
    type: initialValues.tokenAddress ? 'token' : 'eth'
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      to: formData.recipient,
      amount: formData.amount,
      tokenAddress: formData.type === 'token' ? formData.tokenAddress : null
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Send Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue={formData.type} onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="eth">Send ETH</TabsTrigger>
                <TabsTrigger value="token">Send Tokens</TabsTrigger>
              </TabsList>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    placeholder="0x..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <TabsContent value="token">
                  <div className="space-y-2">
                    <Label htmlFor="tokenAddress">Token Contract Address</Label>
                    <Input
                      id="tokenAddress"
                      name="tokenAddress"
                      value={formData.tokenAddress}
                      onChange={handleChange}
                      placeholder="0x..."
                      required={formData.type === 'token'}
                    />
                  </div>
                </TabsContent>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Send
                </Button>
              </div>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 