'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Loader2, Shield, Trash2, Pencil } from 'lucide-react';

interface User {
    id: string;
    username: string;
    email?: string;
    role: string;
    createdAt: string;
}

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user?.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    if (authLoading || user?.role !== 'ADMIN') return null;
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('VIEWER');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('VIEWER');
        setError('');
        setEditingId(null);
    };

    const handleEditClick = (user: User) => {
        setEditingId(user.id);
        setUsername(user.username);
        setEmail(user.email || '');
        setRole(user.role);
        setPassword(''); // Password is not pre-filled for security
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const method = editingId ? 'PUT' : 'POST';
        const url = '/api/users'; // We use the same route for both, PUT handles ID in body
        const body: any = { username, email, role };

        if (password) {
            body.password = password;
        } else if (!editingId) {
            setError('La contraseña es requerida para nuevos usuarios.');
            return;
        }

        if (editingId) {
            body.id = editingId;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchUsers();
            } else {
                setError(data.error || `Error al ${editingId ? 'actualizar' : 'crear'} usuario`);
            }
        } catch (error) {
            setError('Error de conexión');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

        try {
            const res = await fetch(`/api/users?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error de conexión al eliminar');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-400" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-400 mt-2">Administra el acceso al sistema.</p>
                </div>

                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {/* Users List */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-blue-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Usuario</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Rol</th>
                                <th className="px-6 py-4 font-medium">Fecha Creación</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {user.email || <span className="text-gray-600 italic">Sin email</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${user.role === 'ADMIN'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-gray-500 hover:text-blue-400 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => { setShowModal(false); resetForm(); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <Shield className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                        </h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="usuario@ejemplo.com"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Contraseña {editingId && <span className="text-xs text-gray-500">(Dejar en blanco para mantener actual)</span>}
                                </label>
                                <input
                                    type="password"
                                    required={!editingId}
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Rol</label>
                                <select
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none [&>option]:bg-gray-900"
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                >
                                    <option value="VIEWER">Visualizador</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="EDITOR">Editor</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold mt-4"
                            >
                                {editingId ? 'Actualizar Usuario' : 'Crear Usuario'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
