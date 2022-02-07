import { PropsWithChildren } from "react";

export default function Container(props: PropsWithChildren<{}>) {
  return (
    <div className="text-gray-800 dark:text-white text-center flex flex-col items-stretch overflow-y-hidden">
      {props.children}
    </div>
  );
}
