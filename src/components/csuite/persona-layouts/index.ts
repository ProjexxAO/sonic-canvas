export * from './types';
export * from './CEOLayout';
export * from './CFOLayout';
export * from './CMOLayout';
export * from './CTOLayout';
export * from './COOLayout';
export * from './CHROLayout';
export * from './CROLayout';
export * from './CLOLayout';
export * from './CISOLayout';
export * from './CCOLayout';
export * from './ChiefOfStaffLayout';
export * from './ChiefPeopleLayout';

// Persona to Layout mapping
export const PERSONA_LAYOUTS: Record<string, React.ComponentType<any>> = {
  ceo: require('./CEOLayout').CEOLayout,
  cfo: require('./CFOLayout').CFOLayout,
  cmo: require('./CMOLayout').CMOLayout,
  cto: require('./CTOLayout').CTOLayout,
  coo: require('./COOLayout').COOLayout,
  chro: require('./CHROLayout').CHROLayout,
  cro: require('./CROLayout').CROLayout,
  clo: require('./CLOLayout').CLOLayout,
  ciso: require('./CISOLayout').CISOLayout,
  cco: require('./CCOLayout').CCOLayout,
  chief_of_staff: require('./ChiefOfStaffLayout').ChiefOfStaffLayout,
  chief_people: require('./ChiefPeopleLayout').ChiefPeopleLayout,
};
