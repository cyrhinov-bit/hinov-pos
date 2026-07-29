import { useState, useEffect, useCallback } from 'react';
import { PROFILES } from '../data';

const API_URL = 'http://localhost:3000/api';

export function useBackend() {
  const [profiles, setProfiles] = useState<any[]>(Object.values(PROFILES));
  const [sales, setSales] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/profiles`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
        }
      }
    } catch (err) {
      console.warn('Utilisation des profils par défaut', err);
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
