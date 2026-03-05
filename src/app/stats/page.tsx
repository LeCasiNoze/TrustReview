"use client";

import { useState, useEffect } from "react";

interface Stats {
  averageRating: number;
  totalRatings: number;
  totalFeedbacks: number;
  positiveRate: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur
          </h1>
          <p className="text-gray-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Statistiques
          </h1>
          <p className="text-gray-600 text-lg">
            Vue d'ensemble de vos avis et feedbacks
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Moyenne des notes
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ⭐ {stats?.averageRating.toFixed(1) || "0.0"}
                </p>
              </div>
              <div className="text-4xl">
                ⭐
              </div>
            </div>
          </div>

          {/* Total Ratings Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Avis reçus
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  📝 {stats?.totalRatings || 0}
                </p>
              </div>
              <div className="text-4xl">
                📝
              </div>
            </div>
          </div>

          {/* Total Feedbacks Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Feedbacks privés
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  💬 {stats?.totalFeedbacks || 0}
                </p>
              </div>
              <div className="text-4xl">
                💬
              </div>
            </div>
          </div>

          {/* Positive Rate Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Taux de satisfaction
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  📈 {stats?.positiveRate || 0}%
                </p>
              </div>
              <div className="text-4xl">
                📈
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Les données sont mises à jour en temps réel
          </p>
        </div>
      </div>
    </div>
  );
}
