import { useState, useCallback } from 'react';
import { getInfraDefinition } from '../data/infrastructure';

const TOTAL_BUDGET = 1000;

export function useBudget() {
  const [budget, setBudget] = useState(TOTAL_BUDGET);

  const spend = useCallback((type) => {
    const def = getInfraDefinition(type);
    setBudget(prev => prev - def.cost);
  }, []);

  const refund = useCallback((type) => {
    const def = getInfraDefinition(type);
    setBudget(prev => Math.min(TOTAL_BUDGET, prev + def.cost));
  }, []);

  const canAfford = useCallback((type) => {
    const def = getInfraDefinition(type);
    return budget >= def.cost;
  }, [budget]);

  const reset = useCallback(() => {
    setBudget(TOTAL_BUDGET);
  }, []);

  return { budget, totalBudget: TOTAL_BUDGET, spend, refund, canAfford, reset };
}
