"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  google_review_url?: string;
  threshold_positive?: number;
  is_active: boolean;
  created_at: string;
}

export default function BusinessSwitcher() {
  const [businessManager, setBusinessManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await fetch("/api/businesses/user");
      const data = await response.json();
      setBusinessManager(data);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessChange = async (businessId: string) => {
    try {
      await fetch("/api/businesses/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId })
      });
      await loadBusinesses(); // Recharger pour mettre à jour l'entreprise active
      setIsOpen(false);
      // Recharger la page pour appliquer le changement
      window.location.reload();
    } catch (error) {
      console.error('Error changing active business:', error);
    }
  };

  if (loading) {
    return <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>;
  }

  if (!businessManager || !Array.isArray(businessManager.businesses) || businessManager.businesses.length <= 1) {
    return null;
  }

  const { businesses, activeBusiness, canCreateMore, remainingSlots } = businessManager;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-48"
      >
        <div className="flex items-center gap-2 flex-1">
          {activeBusiness?.logo_url ? (
            <img 
              src={activeBusiness.logo_url} 
              alt={activeBusiness.name}
              className="w-4 h-4 rounded object-cover"
            />
          ) : (
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {activeBusiness?.name?.charAt(0) || 'B'}
              </span>
            </div>
          )}
          <span className="truncate">{activeBusiness?.name}</span>
        </div>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-slate-500 px-2 py-1">
              Vos entreprises ({businesses?.length || 0}/{remainingSlots === null ? '∞' : (businesses?.length || 0) + (remainingSlots || 0)})
            </div>
            
            {businesses?.map((business: Business) => (
              <button
                key={business.id}
                onClick={() => handleBusinessChange(business.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                  business.id === activeBusiness?.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  {business.logo_url ? (
                    <img 
                      src={business.logo_url} 
                      alt={business.name}
                      className="w-4 h-4 rounded object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {business.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="truncate">{business.name}</span>
                </div>
                
                {business.id === activeBusiness?.id && (
                  <Badge variant="secondary" className="text-xs">
                    Actif
                  </Badge>
                )}
                
                {!business.is_active && (
                  <Badge variant="outline" className="text-xs">
                    Inactif
                  </Badge>
                )}
              </button>
            ))}
            
            {canCreateMore && (
              <div className="border-t border-slate-200 mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-slate-600"
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/app/business';
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter une entreprise
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
