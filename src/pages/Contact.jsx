import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <div className="pt-24 pb-10 px-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Contato</h1>

      <p className="text-gray-700 mb-4">
        Precisas de ajuda, tens dúvidas ou queres entrar em contato com a equipa InfraWatch? Preenche o formulário abaixo:
      </p>

      <form className="space-y-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input type="text" required className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input type="email" required className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mensagem</label>
          <textarea rows="4" required className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Enviar
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-6">
        Também podes nos contactar por e-mail: <span className="text-blue-700">suporte@infrawatch.com</span>
      </p>

      <div className="mt-10">
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          Voltar à página inicial
        </Link>
      </div>
    </div>
  );
}
