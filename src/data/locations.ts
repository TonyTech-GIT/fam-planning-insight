/**
 * LOCATION DATA LAYER
 *
 * Cost multipliers are DERIVED / ESTIMATED modelling assumptions (see source
 * `internal-model`). A national urban reference basket = 1.00. Separate
 * multipliers are kept for housing (which varies far more by city than food)
 * and for general goods/services.
 */
import type { DataKind } from './sources';

export interface CityRecord {
  id: string;
  name: string;
  state: string;
  housingMultiplier: number;
  generalMultiplier: number;
  kind: DataKind;
  sourceId: string;
  note?: string;
}

export interface CountryRecord {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  available: boolean;
}

export const COUNTRIES: CountryRecord[] = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦', locale: 'en-NG', available: true },
  { code: 'GH', name: 'Ghana', currency: 'GHS', currencySymbol: 'GH₵', locale: 'en-GH', available: false },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh', locale: 'en-KE', available: false },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R', locale: 'en-ZA', available: false },
];

export const SETTLEMENT_TYPES = [
  { id: 'urban', label: 'Urban / city centre', multiplier: 1.0 },
  { id: 'suburban', label: 'Suburban / outskirts', multiplier: 0.85 },
  { id: 'rural', label: 'Rural / semi-rural', multiplier: 0.68 },
] as const;

export type SettlementId = (typeof SETTLEMENT_TYPES)[number]['id'];

const m = (
  id: string,
  name: string,
  state: string,
  housingMultiplier: number,
  generalMultiplier: number,
  note?: string,
): CityRecord => ({
  id,
  name,
  state,
  housingMultiplier,
  generalMultiplier,
  kind: 'derived',
  sourceId: 'internal-model',
  note,
});

export const CITIES: CityRecord[] = [
  m('lagos-island', 'Lagos (Island / Lekki axis)', 'Lagos', 2.6, 1.34, 'Highest published rent band in the country.'),
  m('lagos-mainland', 'Lagos (Mainland)', 'Lagos', 1.65, 1.22),
  m('abuja-central', 'Abuja (Central districts)', 'FCT Abuja', 2.1, 1.28),
  m('abuja-satellite', 'Abuja (Satellite towns)', 'FCT Abuja', 1.05, 1.08),
  m('port-harcourt', 'Port Harcourt', 'Rivers', 1.35, 1.18),
  m('ibadan', 'Ibadan', 'Oyo', 0.72, 0.95),
  m('benin-city', 'Benin City', 'Edo', 0.7, 0.95),
  m('enugu', 'Enugu', 'Enugu', 0.68, 0.92),
  m('onitsha', 'Onitsha', 'Anambra', 0.8, 0.98),
  m('awka', 'Awka', 'Anambra', 0.72, 0.94),
  m('aba', 'Aba', 'Abia', 0.62, 0.9),
  m('owerri', 'Owerri', 'Imo', 0.7, 0.93),
  m('uyo', 'Uyo', 'Akwa Ibom', 0.78, 0.97),
  m('calabar', 'Calabar', 'Cross River', 0.7, 0.94),
  m('warri', 'Warri', 'Delta', 0.82, 1.0),
  m('asaba', 'Asaba', 'Delta', 0.85, 1.0),
  m('abeokuta', 'Abeokuta', 'Ogun', 0.72, 0.96),
  m('ota', 'Ota / Sango', 'Ogun', 0.78, 1.0),
  m('akure', 'Akure', 'Ondo', 0.6, 0.9),
  m('ado-ekiti', 'Ado-Ekiti', 'Ekiti', 0.55, 0.88),
  m('ilorin', 'Ilorin', 'Kwara', 0.58, 0.89),
  m('oshogbo', 'Osogbo', 'Osun', 0.55, 0.88),
  m('kano', 'Kano', 'Kano', 0.62, 0.9),
  m('kaduna', 'Kaduna', 'Kaduna', 0.65, 0.92),
  m('jos', 'Jos', 'Plateau', 0.6, 0.91),
  m('maiduguri', 'Maiduguri', 'Borno', 0.55, 0.95),
  m('sokoto', 'Sokoto', 'Sokoto', 0.5, 0.88),
  m('minna', 'Minna', 'Niger', 0.52, 0.88),
  m('makurdi', 'Makurdi', 'Benue', 0.5, 0.87),
  m('lokoja', 'Lokoja', 'Kogi', 0.55, 0.9),
  m('yola', 'Yola', 'Adamawa', 0.5, 0.9),
  m('bauchi', 'Bauchi', 'Bauchi', 0.5, 0.88),
  m('gombe', 'Gombe', 'Gombe', 0.5, 0.88),
  m('umuahia', 'Umuahia', 'Abia', 0.62, 0.9),
  m('other-urban', 'Other Nigerian city (urban)', 'Other', 0.75, 0.95),
];

export const NIGERIAN_STATES: string[] = Array.from(new Set(CITIES.map((c) => c.state))).sort();

export const citiesForState = (state: string): CityRecord[] =>
  CITIES.filter((c) => c.state === state);

export const cityById = (id: string): CityRecord | undefined => CITIES.find((c) => c.id === id);

export const settlementMultiplier = (id: SettlementId): number =>
  SETTLEMENT_TYPES.find((s) => s.id === id)?.multiplier ?? 1;

/** Cities offered in the relocation comparison. */
export const RELOCATION_SHORTLIST = [
  'lagos-island',
  'lagos-mainland',
  'abuja-central',
  'port-harcourt',
  'ibadan',
  'enugu',
  'kano',
  'uyo',
];
