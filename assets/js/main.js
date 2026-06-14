/**
 * ============================================================================
 * Módulo: MAIN
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a main.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// POINT OF ENTRY DVC APP

import { 
    app,
    auth,
    db,
    provider,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    arrayUnion,
    increment,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "./firebase.js";

import {
    PROJETO_ATUAL_DVC,
    COLECAO_CONTRIBUICOES_GLOBAIS,
    EMAILS_ADM_DVC,
    DIA_INICIO_CARENCIA_CADASTRO_FIM_MES,
    DIA_LIMITE_FINANCEIRO_MENSAL,
    STATUS_FINANCEIRO_CARENCIA,
    FUNCOES_VOLEI_DVC,
    PESOS_FUNCAO_VOLEI_DVC,
    DVC_CACHE,
    AppCache,
    currentUserData,
    editingEventId,
    modoTestePerfilEmail,
    modoTestePerfilNome,
    subAbaPerfilAtiva
} from "./state.js";

import * as utils from "./utils.js";
import * as cache from "./cache.js";
import * as navigation from "./navigation.js";

import * as home from "./home.js";
import * as mural from "./mural.js";
import * as ranking from "./ranking.js";
import * as quiz from "./quiz.js";
import * as evaluations from "./evaluations.js";
import * as trainingGames from "./training-games.js";
import * as eventEvaluations from "./event-evaluations.js";
import * as calendar from "./calendar.js";
import * as finance from "./finance.js";
import * as profile from "./profile.js";
import * as admin from "./admin.js";
import * as socioeconomic from "./socioeconomic.js";
import * as authModule from "./auth.js";
import * as quarterlySurvey from "./quarterly-survey.js";
import * as pacto from "./pacto.js";
import "./escalador.js";

// Bind Firebase to window
window.app = app;
window.auth = auth;
window.db = db;
window.provider = provider;
window.signInWithPopup = signInWithPopup;
window.GoogleAuthProvider = GoogleAuthProvider;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.setPersistence = setPersistence;
window.browserLocalPersistence = browserLocalPersistence;
window.collection = collection;
window.doc = doc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.addDoc = addDoc;
window.arrayUnion = arrayUnion;
window.increment = increment;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.limit = limit;
window.onSnapshot = onSnapshot;
window.serverTimestamp = serverTimestamp;
window.Timestamp = Timestamp;

console.log("[DVC App] Modular system initialized successfully.");

// Add global click listener to close modals when clicking outside
document.addEventListener('click', function(e) {
    // Verify if the clicked element is a modal backdrop
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        // Prevent closing critical/blocking modals
        const blockingModals = [
            'm-pacto-dvc', 
            'm-bloqueio-pesquisa-trimestral-dvc', 
            'm-pesquisa-trimestral-dvc',
            'm-autoavaliacao-obrigatoria',
            'm-grupo-whatsapp'
        ];
        if (blockingModals.includes(e.target.id)) {
            return;
        }
        // Safely remove the modal from the DOM
        e.target.remove();
    }
});

// Sincronização e escuta do tema (Dark Mode)
document.addEventListener('DOMContentLoaded', () => {
    const atualizarIconesTema = (isDark) => {
        const icons = document.querySelectorAll('#login-dark-mode-btn i, #header-dark-mode-btn i');
        icons.forEach(icon => {
            if (isDark) {
                icon.className = 'fa-solid fa-sun text-sm text-amber-400';
            } else {
                icon.className = 'fa-solid fa-moon text-sm text-gray-600';
            }
        });
    };

    const isDark = document.documentElement.classList.contains('dark');
    atualizarIconesTema(isDark);

    window.addEventListener('themeChanged', (e) => {
        atualizarIconesTema(e.detail.isDark);
    });
});

