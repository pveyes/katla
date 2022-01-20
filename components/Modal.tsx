import { Dialog } from "@headlessui/react";

export default function Modal({ isOpen, onClose, children }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-10 inset-0 overflow-y-auto">
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
      <div className="bg-gray-900 text-gray-200 w-5/6 max-w-lg absolute top-12 md:top-16 left-6 right-6 mx-auto p-4">
        <button onClick={onClose} title="close" aria-label="close" className="absolute right-4 top-4 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
          </svg>
        </button>
        {children}
      </div>
    </Dialog>
  )
}

const Title = ({ children }) => <Dialog.Title className="text-center uppercase font-semibold my-4">{children}</Dialog.Title>
Modal.Title = Title
