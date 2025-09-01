import { Link as RouterLink } from 'react-router-dom';

export default function Link({ path, children, styles }: LinkProps) {
  return (
    <RouterLink to={path} className={styles}>
      {children}
    </RouterLink>
  );
}

interface LinkProps {
  path: string;
  children: React.ReactNode;
  styles: string;
}
