import { useFireproof } from 'use-fireproof';
import { Settings } from '../types';
import { useEffect, useState } from 'react';

const DEFAULT_SETTINGS: Settings = {
  _id: 'settings',
  unit: 'kg',
  alpha: 0.1,
  caloriePerKg: 7700,
  type: 'settings',
};

export function useSettings() {
  const { database } = useFireproof('body-electric');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const doc = await database.get('settings');
        setSettings(doc as Settings);
      } catch {
        // Settings don't exist yet, create default
        await database.put(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [database]);

  const updateSettings = async (partial: Partial<Omit<Settings, '_id' | 'type'>>) => {
    const updated: Settings = {
      ...settings,
      ...partial,
    };
    await database.put(updated);
    setSettings(updated);
  };

  return {
    settings,
    updateSettings,
    loading,
  };
}
