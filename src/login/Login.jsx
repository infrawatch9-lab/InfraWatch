import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login com', username, password);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center divimg" >
      <div className="bg-white p-10 rounded-md shadow-md w-full max-w-sm">
        <img src="/img/logo.png" alt="Logo" className="w-20 h-20 mx-auto"/>
        <h2 className="text-center text-[#080F2A] font-semibold text-xl mb-6">
          Bem-vindo
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">
              <i className="fas fa-user" />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username ou E-mail"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">
              <i className="fas fa-lock" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-[#080F2A] text-white py-2 rounded-sm text-sm font-semibold hover:bg-[#0a1c47]"
          >
            Iniciar Sessão
          </button>

          <div className="text-center mt-2">
            <a>
              Esqueceu a senha? 
            </a>
            <a href="#" className="ml-2 text-base text-gray-600 hover:underline">
               Recuperar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

