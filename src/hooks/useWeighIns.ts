import { useFireproof } from 'use-fireproof';
import { WeighIn } from '../types';
import { format } from 'date-fns';

export function useWeighIns() {
  const { database, useLiveQuery } = useFireproof('body-electric');

  // Query all weigh-ins, sorted by date
  const result = useLiveQuery<WeighIn>(
    (doc) => doc.type === 'weighin',
    {
      limit: 100,
      // @ts-ignore - Fireproof types may be incomplete
      sort: [['_id', 'asc']]
    }
  );

  // Filter out any non-weighin docs and ensure valid data
  const weighIns = result.docs
    .filter((doc) => doc.type === 'weighin' && doc._id !== 'settings' && typeof doc.weightKg === 'number')
    .sort((a, b) => a._id.localeCompare(b._id));

  const addWeighIn = async (weightKg: number, date?: Date) => {
    const dateISO = format(date || new Date(), 'yyyy-MM-dd');
    const doc: WeighIn = {
      _id: dateISO,
      weightKg,
      type: 'weighin',
    };
    await database.put(doc);
  };

  const deleteWeighIn = async (id: string) => {
    await database.del(id);
  };

  return {
    weighIns,
    addWeighIn,
    deleteWeighIn,
    loading: result.docs.length === 0 && !result.docs,
  };
}
