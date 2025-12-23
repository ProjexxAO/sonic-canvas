import { icons, LucideIcon } from 'lucide-react';

// Convert kebab-case to PascalCase for lucide icon lookup
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function getIconComponent(iconName: string): LucideIcon {
  const pascalName = toPascalCase(iconName);
  return icons[pascalName as keyof typeof icons] || icons.Wrench;
}
