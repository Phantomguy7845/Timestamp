import { useApp } from '../../context/AppContext';

export default function Toast() {
    const { state } = useApp();

    if (state.toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {state.toasts.map((toast) => (
                <div key={toast.id} className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
