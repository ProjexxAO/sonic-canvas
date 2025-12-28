import { PersonaLayoutProps } from './types';
import { CEOLayout } from './CEOLayout';
import { CFOLayout } from './CFOLayout';
import { CMOLayout } from './CMOLayout';
import { CTOLayout } from './CTOLayout';
import { COOLayout } from './COOLayout';
import { CHROLayout } from './CHROLayout';
import { CROLayout } from './CROLayout';
import { CLOLayout } from './CLOLayout';
import { CISOLayout } from './CISOLayout';
import { CCOLayout } from './CCOLayout';
import { ChiefOfStaffLayout } from './ChiefOfStaffLayout';
import { ChiefPeopleLayout } from './ChiefPeopleLayout';

interface PersonaLayoutRendererProps extends PersonaLayoutProps {
  personaId: string;
}

const PERSONA_LAYOUT_MAP: Record<string, React.ComponentType<PersonaLayoutProps>> = {
  ceo: CEOLayout,
  cfo: CFOLayout,
  cmo: CMOLayout,
  cto: CTOLayout,
  coo: COOLayout,
  chro: CHROLayout,
  cro: CROLayout,
  clo: CLOLayout,
  ciso: CISOLayout,
  cco: CCOLayout,
  chief_of_staff: ChiefOfStaffLayout,
  chief_people: ChiefPeopleLayout,
};

export function PersonaLayoutRenderer({ personaId, ...props }: PersonaLayoutRendererProps) {
  const LayoutComponent = PERSONA_LAYOUT_MAP[personaId] || CEOLayout;
  return <LayoutComponent {...props} />;
}
