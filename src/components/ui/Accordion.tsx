import React, { useId, useState } from 'react';
import cx from 'classnames';

export interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, defaultOpen }: AccordionItemProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();
  return (
    <div className="border rounded-xl bg-white">
      <button
        className={cx('w-full flex items-center justify-between px-4 py-3 text-left rounded-xl', open ? 'bg-slate-50' : '')}
        aria-expanded={open}
        aria-controls={`sect-${id}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium text-slate-800">{title}</span>
        <span className={cx('transition', open ? 'rotate-180' : '')} aria-hidden>⌄</span>
      </button>
      <div id={`sect-${id}`} role="region" className={cx('px-4 pb-4', open ? 'block' : 'hidden')}>
        {children}
      </div>
    </div>
  );
}

export default function Accordion({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('space-y-2', className)}>{children}</div>;
}
