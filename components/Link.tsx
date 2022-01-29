import NextLink from "next/link";
import { ComponentProps } from "react";

export default function Link(props: ComponentProps<typeof NextLink>) {
  const { children, ...rest } = props;
  return (
    <NextLink {...rest}>
      <a className="text-green-600 hover:text-green-700">{children}</a>
    </NextLink>
  );
}
