import toast from 'react-hot-toast';

export const notify = {
  success: (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'bottom-right',
      style: {
        background: '#065F46', // dark green
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'bottom-right',
      style: {
        background: '#991B1B', // dark red
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      },
    });
  },

  info: (message) => {
    toast(message, {
      duration: 3000,
      position: 'bottom-right',
      style: {
        background: '#1E40AF', // dark blue
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      position: 'bottom-right',
      style: {
        background: '#374151', // dark gray
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
      },
    });
  },
};
