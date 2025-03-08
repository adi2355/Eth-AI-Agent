"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { blockchainApi } from '@/lib/api/blockchain-api';
import { Loader2 } from 'lucide-react';

type ContractTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
};

interface ContractTemplateSelectorProps {
  onSelect: (templateId: string) => void;
  onCancel: () => void;
}

export function ContractTemplateSelector({ onSelect, onCancel }: ContractTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await blockchainApi.getContractTemplates();
        setTemplates(allTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback templates if API fails
        setTemplates([
          {
            id: 'ERC20',
            name: 'ERC20 Token',
            description: 'Standard fungible token for currencies and assets',
            category: 'token'
          },
          {
            id: 'ERC721',
            name: 'ERC721 NFT',
            description: 'Non-fungible token for unique digital assets',
            category: 'nft'
          },
          {
            id: 'ERC1155',
            name: 'ERC1155 Multi-Token',
            description: 'Multi-token standard for both fungible and non-fungible tokens',
            category: 'token'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle>Select Contract Template</CardTitle>
          <CardDescription>
            Choose a template to deploy your smart contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 py-8 text-center">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <p className="mt-4">Loading templates...</p>
              </div>
            ) : (
              <>
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => onSelect(template.id)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 