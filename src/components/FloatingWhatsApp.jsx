import React from 'react';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5521997914496'; // Altere aqui para mudar o número do WhatsApp
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Tenho uma dúvida sobre o Clube Max Descontos.');

export default function FloatingWhatsApp() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      {/* Tooltip */}
      <span className="absolute right-16 bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
        💬 Precisa de ajuda?
      </span>
    </a>
  );
}