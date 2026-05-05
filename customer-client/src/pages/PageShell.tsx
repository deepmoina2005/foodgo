import type { ReactNode } from 'react';
import { Card, SectionTitle } from '../components/common';

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  action,
  top,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  top?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={`mx-auto w-full space-y-6 px-4 py-8 lg:px-8 ${centered ? 'max-w-2xl text-center' : 'max-w-7xl'}`}>
      {top}
      <SectionTitle eyebrow={eyebrow} title={title} description={description} action={action} centered={centered} />
      {children}
    </div>
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <Card className="p-6">{children}</Card>;
}
