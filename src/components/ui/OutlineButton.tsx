import cx from 'classnames';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'md'|'lg' };
export default function OutlineButton({ className, size='md', ...rest }: Props) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl border-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizes = { md: 'text-sm px-4 py-2', lg: 'text-base px-6 py-3' };
  return <button className={cx(base, sizes[size], 'bg-white/10 border-white/40 text-white hover:bg-white/20', className)} {...rest} />;
}