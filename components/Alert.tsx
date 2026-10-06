import toast, { Toaster } from "react-hot-toast";

export default function Alert() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      toastOptions={Alert.options}
      containerStyle={{ top: 180 }}
    />
  );
}

Alert.options = {
  duration: 750,
  className:
    "bg-ink text-surface text-center font-semibold py-2 px-4 rounded-full shadow-lg",
};

interface AlertOptions {
  duration?: number;
  cb?: () => void;
  id: string;
}

Alert.show = (message: string, options: AlertOptions) => {
  const duration = options.duration || Alert.options.duration;

  let formatted: any = message;
  if (message.includes("\n")) {
    const lines = message.split("\n");
    formatted = (
      <div>
        {lines.map((line, i) => {
          if (i === lines.length) {
            return line;
          }

          return (
            <>
              {line}
              <br />
            </>
          );
        })}
      </div>
    );
  }

  toast(formatted, {
    id: options.id,
    duration,
  });

  if (options.cb) {
    setTimeout(() => {
      options.cb();
    }, duration);
  }
};
