import toast, { Toaster, resolveValue } from "react-hot-toast";

export default function Alert() {
  return (
    <Toaster
      gutter={8}
      toastOptions={Alert.options}
      containerStyle={{ top: 100 }}
    >
      {(t) => (
        <div
          role="alert"
          style={{ opacity: t.visible ? 1 : 0 }}
          className="absolute-center bg-white text-black text-center font-semibold py-2 px-3 rounded-sm"
        >
          {resolveValue(t.message, t)}
        </div>
      )}
    </Toaster>
  );
}

Alert.options = {
  duration: 750,
};

interface AlertOptions {
  duration?: number;
  cb?: () => void;
  id: string;
}

Alert.show = (message: string, options: AlertOptions) => {
  const duration = options.duration || Alert.options.duration;

  toast(message, {
    id: options.id,
    duration,
  });

  if (options.cb) {
    setTimeout(() => {
      options.cb();
    }, duration);
  }
};
