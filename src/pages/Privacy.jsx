import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="pt-24 pb-10 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Política de Privacidade</h1>

      <p className="text-gray-700 mb-4">
        Esta Política de Privacidade descreve como a InfraWatch coleta, usa e protege as informações dos usuários.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Coleta de Informações</h2>
      <p className="text-gray-700 mb-4">
        Coletamos informações como nome, e-mail e dados de uso da aplicação. Todas as informações são utilizadas exclusivamente para fins operacionais da plataforma.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Armazenamento e Segurança</h2>
      <p className="text-gray-700 mb-4">
        Utilizamos medidas de segurança apropriadas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Direitos dos Usuários</h2>
      <p className="text-gray-700 mb-4">
        Os usuários podem solicitar a exclusão ou atualização de seus dados pessoais a qualquer momento entrando em contato com a equipe InfraWatch.
      </p>

      <p className="text-sm text-gray-500 mt-6">Última atualização: Agosto de 2025</p>

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
