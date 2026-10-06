import { ComponentProps } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = Omit<ComponentProps<typeof RouterLink>, "to"> & { href: string };

export default function Link({ href, children, ...rest }: Props) {
  return (
    <RouterLink to={href} className="color-accent" {...rest}>
      {children}
    </RouterLink>
  );
}
