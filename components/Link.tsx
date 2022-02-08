import NextLink from "next/link";
import { ComponentProps } from "react";

export default function Link(props: ComponentProps<typeof NextLink>) {
  const { children, ...rest } = props;
  return (
    <NextLink {...rest}>
      <a className="color-accent">{children}</a>
    </NextLink>
  );
}
