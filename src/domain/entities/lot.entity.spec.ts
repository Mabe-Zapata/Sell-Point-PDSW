import { Lot } from './lot.entity';
import { BusinessRuleException } from '../exceptions';

describe('Lot', () => {
  const baseLot = {
    id: 'lot-1',
    productId: 'prod-1',
    lotCode: 'LOT-001',
    quantityReceived: 10,
    quantityAvailable: 10,
    unitCost: 4,
    estimatedUnitProfit: 6,
    receivedAt: new Date('2026-05-01T00:00:00.000Z'),
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  };

  it('creates a valid lot', () => {
    const lot = new Lot(baseLot);

    expect(lot.quantityAvailable).toBe(10);
    expect(lot.estimatedUnitProfit).toBe(6);
  });

  it('rejects non-positive unit cost', () => {
    expect(() => new Lot({ ...baseLot, unitCost: 0 })).toThrow(BusinessRuleException);
  });

  it('rejects future received date', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

    expect(() => new Lot({ ...baseLot, receivedAt: future })).toThrow(BusinessRuleException);
  });

  it('rejects negative available quantity', () => {
    expect(() => new Lot({ ...baseLot, quantityAvailable: -1 })).toThrow(BusinessRuleException);
  });
});
