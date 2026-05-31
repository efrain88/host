import React, { useState, useEffect, useRef } from 'react';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const Container = styled.div`
    ${tw`flex flex-col gap-y-6 max-w-4xl`};
`;

export default () => {
    // LocalStorage states
    const [avatar, setAvatar] = useState<string | null>(null);
    const [appearance, setAppearance] = useState<'dark' | 'light' | 'system'>('dark');
    const [language, setLanguage] = useState('es');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize from localStorage
    useEffect(() => {
        const savedAvatar = localStorage.getItem('user_avatar');
        if (savedAvatar) setAvatar(savedAvatar);

        const savedAppearance = localStorage.getItem('user_appearance') as any;
        if (savedAppearance) setAppearance(savedAppearance);

        const savedLanguage = localStorage.getItem('user_language');
        if (savedLanguage) setLanguage(savedLanguage);
    }, []);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setAvatar(base64);
            localStorage.setItem('user_avatar', base64);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
        localStorage.removeItem('user_avatar');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAppearanceChange = (mode: 'dark' | 'light' | 'system') => {
        setAppearance(mode);
        localStorage.setItem('user_appearance', mode);
        // Optionally add a toast here
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        setLanguage(lang);
        localStorage.setItem('user_language', lang);
    };

    return (
        <PageContentBlock title={'Ajustes del perfil'}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Ajustes del perfil</h1>
                <p className="text-sm text-neutral-400">Actualiza la configuración y preferencias de tu cuenta.</p>
            </div>

            <Container>
                {/* Foto de perfil */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Foto de perfil
                    </h2>
                    <p className="text-sm text-neutral-400 mb-6">
                        Sube un avatar personalizado para tu cuenta. Se admiten PNG, JPG, WEBP y GIF de hasta 4 MB.
                    </p>
                    <div className="flex items-center gap-x-4">
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp, image/gif" 
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-[0_0_15px_rgba(var(--color-primary-500),0.3)]" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-3xl font-bold shadow-[0_0_15px_rgba(var(--color-primary-500),0.3)]">
                                U
                            </div>
                        )}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-primary-500/20"
                        >
                            Subir avatar
                        </button>
                        {avatar && (
                            <button 
                                onClick={handleRemoveAvatar}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-semibold text-sm transition-colors border border-red-500/20"
                            >
                                Quitar avatar
                            </button>
                        )}
                    </div>
                </div>

                {/* Dirección de correo */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Dirección de correo
                    </h2>
                    <UpdateEmailAddressForm />
                </div>

                {/* Idioma */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Idioma
                    </h2>
                    <p className="text-sm text-neutral-400 mb-6">
                        Selecciona tu idioma preferido para la interfaz del panel.
                    </p>
                    <select 
                        value={language}
                        onChange={handleLanguageChange}
                        className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary-500 transition-colors"
                    >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                    </select>
                </div>

                {/* Apariencia */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl shadow-2xl p-6">
                    <h2 className="text-base font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        Apariencia
                    </h2>
                    <p className="text-sm text-neutral-400 mb-6">
                        Elige el esquema de color preferido para la interfaz del panel.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        <div 
                            onClick={() => handleAppearanceChange('dark')}
                            className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors shadow-lg ${appearance === 'dark' ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-primary-500/10' : 'border-white/10 bg-[#050505] text-neutral-400 hover:bg-white/5'}`}
                        >
                            <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            <span className="text-sm font-semibold">Oscuro</span>
                        </div>
                        <div 
                            onClick={() => handleAppearanceChange('light')}
                            className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors shadow-lg ${appearance === 'light' ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-primary-500/10' : 'border-white/10 bg-[#050505] text-neutral-400 hover:bg-white/5'}`}
                        >
                            <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-sm font-semibold">Claro</span>
                        </div>
                        <div 
                            onClick={() => handleAppearanceChange('system')}
                            className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors shadow-lg ${appearance === 'system' ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-primary-500/10' : 'border-white/10 bg-[#050505] text-neutral-400 hover:bg-white/5'}`}
                        >
                            <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-semibold">Sistema</span>
                        </div>
                    </div>
                </div>
            </Container>
        </PageContentBlock>
    );
};
