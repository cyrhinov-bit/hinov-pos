import { useState, useEffect, useCallback } from 'react';
import { PROFILES } from '../data';

const API_URL = 'http://localhost:3000/api';
const SUPABASE_URL = 'https://slzvsirdoxtgmrjxigxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsenZzaXJkb3h0Z21yanhpZ3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODU1MTcsImV4cCI6MjEwMDc2MTUxN30.DPG4v1Eq0A5v4cflYTGMw1n3qV7Si52_MAOxVd2JtI4';

export function useBackend() {
  const [profiles, setProfiles] = (useState as any)(Object.values(PROFILES));
  const [sales, setSales] = (useState as any)([]);
  const [logs, setLogs] = (useState as any)([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/profiles`, {
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
          return;
        }
      }
    } catch (err) {
      // Si l'API locale échoue, requêter directement Supabase Cloud
    }

    try {
      const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        },
        signal: AbortSignal.timeout(3000)
      });
      if (supaRes.ok) {
        const supaData = await supaRes.json();
        if (Array.isArray(supaData) && supaData.length > 0) {
          setProfiles(supaData);
          return;
        }
      }
    } catch (supaErr) {
      console.warn('Utilisation des profils de démo par défaut', supaErr);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/sales`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.warn('Failed to fetch sales', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/governance_logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.warn('Failed to fetch logs', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProfiles(), fetchSales(), fetchLogs()]);
    setLoading(false);
  }, [fetchProfiles, fetchSales, fetchLogs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    profiles,
    sales,
    logs,
    loading,
    refreshAll: fetchAll
  };
}
