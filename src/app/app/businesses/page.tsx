"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getPublicUrlForPath } from "@/lib/utils";
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

export default function BusinessesPage() {
  const [businessManager, setBusinessManager] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    slug: "",
    google_review_url: "",
    threshold_positive: 4,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [businessesResponse, billingResponse] = await Promise.all([
        fetch("/api/businesses/user"),
        fetch("/api/billing", { cache: "no-store" })
      ]);
      
      const businessesData = await businessesResponse.json();
      const billingData = await billingResponse.json();
      setBusinessManager(businessesData);
      setSubscriptionInfo(billingData.info);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async () => {
    if (!newBusiness.name.trim()) return;

    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBusiness.name,
          slug: newBusiness.slug || newBusiness.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          google_review_url: newBusiness.google_review_url,
          threshold_positive: newBusiness.threshold_positive,
          is_active: newBusiness.is_active
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create business');
      }
      
      setNewBusiness({
        name: "",
        slug: "",
        google_review_url: "",
        threshold_positive: 4,
        is_active: true
      });
      setShowCreateForm(false);
      await loadData();
    } catch (error) {
      console.error('Error creating business:', error);
      alert('Erreur lors de la création de l\'entreprise');
    }
  };

  const handleSetActiveBusiness = async (businessId: string) => {
    try {
      await fetch("/api/businesses/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId })
      });
      await loadData();
    } catch (error) {
      console.error('Error setting active business:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!businessManager) {
    return <div className="p-8">Erreur de chargement</div>;
  }

  const { businesses, activeBusiness, canCreateMore, remainingSlots } = businessManager;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Entreprises</h1>
          <p className="page-desc">
            Gérez vos établissements ({businesses.length}/{remainingSlots === null ? '∞' : businesses.length + remainingSlots})
          </p>
        </div>
        {canCreateMore && (
          <Button onClick={() => setShowCreateForm(true)}>
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle entreprise
          </Button>
        )}
      </div>

      {/* Subscription Banner */}
      {subscriptionInfo && !subscriptionInfo.canAccess && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800">Abonnement requis</h3>
                <p className="text-sm text-red-600">
                  {subscriptionInfo.subscriptionStatus === 'canceled' || subscriptionInfo.subscriptionStatus === 'past_due'
                    ? "Votre abonnement a expiré. Renouvelez-le pour gérer plusieurs entreprises."
                    : "Passez à un plan supérieur pour gérer plusieurs entreprises."
                  }
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = '/app/billing'}
              >
                Voir les plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>Nouvelle entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'entreprise *</Label>
              <Input
                id="name"
                value={newBusiness.name}
                onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                placeholder="Restaurant Le Gourmet"
              />
            </div>

            <div>
              <Label htmlFor="slug">Identifiant URL</Label>
              <Input
                id="slug"
                value={newBusiness.slug}
                onChange={(e) => setNewBusiness({ ...newBusiness, slug: e.target.value })}
                placeholder="restaurant-le-gourmet"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sera utilisé dans l'URL : {getPublicUrlForPath(`/r/${newBusiness.slug || 'identifiant'}`).replace('https://', '').replace('http://', '')}
              </p>
            </div>

            <div>
              <Label htmlFor="google_review_url">URL Google Reviews</Label>
              <Input
                id="google_review_url"
                value={newBusiness.google_review_url}
                onChange={(e) => setNewBusiness({ ...newBusiness, google_review_url: e.target.value })}
                placeholder="https://g.page/restaurant-le-gourmet/review"
              />
            </div>

            <div>
              <Label htmlFor="threshold_positive">Seuil positif</Label>
              <Input
                id="threshold_positive"
                type="number"
                min="1"
                max="5"
                value={newBusiness.threshold_positive}
                onChange={(e) => setNewBusiness({ ...newBusiness, threshold_positive: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Notes ≥ à ce seuil seront considérées comme positives
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={newBusiness.is_active}
                onCheckedChange={(checked) => setNewBusiness({ ...newBusiness, is_active: checked })}
              />
              <Label htmlFor="is_active">Entreprise active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateBusiness} disabled={!newBusiness.name.trim()}>
                Créer l'entreprise
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Businesses List */}
      <div className="space-y-4">
        {businesses.map((business: Business) => (
          <Card key={business.id} className={`card-enhanced ${business.id === activeBusiness?.id ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {business.logo_url ? (
                      <img 
                        src={business.logo_url} 
                        alt={business.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {business.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-lg">{business.name}</h3>
                      <p className="text-sm text-muted-foreground">{getPublicUrlForPath(`/r/${business.slug}`).replace('https://', '').replace('http://', '')}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          business.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {business.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        
                        {business.id === activeBusiness?.id && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Actuel
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {business.id !== activeBusiness?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetActiveBusiness(business.id)}
                    >
                      Définir comme actif
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.location.href = `/app/business/${business.id}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {businesses.length === 0 && (
          <Card className="card-enhanced">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Aucune entreprise</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première entreprise pour collecter des avis.
              </p>
              {canCreateMore && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Créer une entreprise
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
