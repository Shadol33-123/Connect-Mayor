import cx from 'classnames';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost' };
export default function Button({ className, variant='primary', ...rest }: Props) {
  const base = 'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-brand-green text-white hover:bg-brand-green-dark focus:ring-brand-green',
    secondary: 'bg-slate-900 text-white hover:bg-black focus:ring-slate-700',
    ghost: 'bg-transparent text-brand-green hover:bg-green-50 focus:ring-brand-green'
  } as const;
  return <button className={cx(base, variants[variant], className)} {...rest} />;
}
