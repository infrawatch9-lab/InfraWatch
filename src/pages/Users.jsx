import { useState } from "react";
import {
  UserPlus, UserCog, Mail, BadgeCheck, Ban, X,
} from "lucide-react";
import { Dialog } from "@headlessui/react";

export default function Users() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([
    { name: "Ana Silva", email: "ana@infrawatch.com", role: "Admin", status: "Ativo" },
    { name: "Carlos Mendes", email: "carlos@infrawatch.com", role: "Operador", status: "Inativo" },
    { name: "Juliana Costa", email: "juliana@infrawatch.com", role: "Visualizador", status: "Ativo" },
  ]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Visualizador",
  });

  const openAddModal = () => {
    setForm({ name: "", email: "", password: "", confirmPassword: "", role: "Visualizador" });
    setEditingUser(null);
    setIsOpen(true);
  };

  const openEditModal = (user) => {
    setForm({ name: user.name, email: user.email, password: "", confirmPassword: "", role: user.role });
    setEditingUser(user);
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.email === editingUser.email ? { ...u, ...form } : u))
      );
    } else {
      setUsers([...users, { name: form.name, email: form.email, role: form.role, status: "Ativo" }]);
    }

    setIsOpen(false);
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", confirmPassword: "", role: "Visualizador" });
  };

  return (
    <div className="pt-24 pb-10 px-6 max-w-7xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserCog className="text-blue-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Usuários</h1>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          <UserPlus className="w-5 h-5" />
          Adicionar Usuário
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">E-mail</th>
              <th className="px-6 py-3">Função</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  {user.status === "Ativo" ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <BadgeCheck className="w-4 h-4" /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <Ban className="w-4 h-4" /> Inativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Editar
                  </button>
                  <button className="text-red-600 hover:underline font-medium">
                    {user.status === "Ativo" ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="pt-4 text-right">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                  {editingUser ? "Salvar Alterações" : "Adicionar"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
