/**
 * ============================================================================
 * Módulo: CACHE
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a cache.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

import { getDoc, getDocs } from "./firebase.js";

// Inicializa a estrutura de cache se não existir
window.AppCache = window.AppCache || {};
window.DVC_DEBUG_FIRESTORE = window.DVC_DEBUG_FIRESTORE || false;

// TTL Padrão em ms (minutos * 60 * 1000)
export const TTL_CACHE = {
    users: 5 * 60 * 1000,
    atletas: 5 * 60 * 1000,
    events: 3 * 60 * 1000,
    ranking: 5 * 60 * 1000,
    painel: 5 * 60 * 1000,
    avisos: 2 * 60 * 1000,
    historico_quiz: 10 * 60 * 1000,
    historico_tecnico: 0 // Sob demanda, sem TTL global padrão longo ou apenas a sessão
};

export function registrarLeituraFirestoreDVC(nome, tipo = "READ") {
    if (window.DVC_DEBUG_FIRESTORE) {
        if (tipo === "READ") {
            console.warn(`[DVC Firestore] READ ${nome}`);
        } else if (tipo === "HIT") {
            console.info(`[DVC Firestore] CACHE HIT ${nome}`);
        } else if (tipo === "MISS") {
            console.log(`[DVC Firestore] CACHE MISS ${nome}`);
        }
    }
}

export function cacheValidoDVC(chave) {
    const item = window.AppCache[chave];
    if (!item || !item.data || !item.ts || !item.ttl) return false;
    return (Date.now() - item.ts) < item.ttl;
}

export function salvarCacheDVC(chave, data, ttl) {
    if (!ttl && TTL_CACHE[chave] !== undefined) {
        ttl = TTL_CACHE[chave];
    }
    
    window.AppCache[chave] = {
        data: data,
        ts: Date.now(),
        ttl: ttl || (5 * 60 * 1000) // Default 5 min
    };
}

export function obterCacheDVC(chave) {
    if (cacheValidoDVC(chave)) {
        registrarLeituraFirestoreDVC(chave, "HIT");
        return window.AppCache[chave].data;
    }
    registrarLeituraFirestoreDVC(chave, "MISS");
    return null;
}

export function invalidarCacheDVC(chave) {
    if (window.AppCache[chave]) {
        delete window.AppCache[chave];
        if (window.DVC_DEBUG_FIRESTORE) console.log(`[DVC Cache] Invalidated: ${chave}`);
    }
}

export function invalidarCachesDVC(lista) {
    lista.forEach(chave => invalidarCacheDVC(chave));
}

/**
 * Wrapper para getDoc com cache e log.
 * @param {object} ref - Referência do documento Firebase (doc(db, ...))
 * @param {object} opcoes - { cacheKey: string, ttl: number, force: boolean }
 */
export async function getDocDVC(ref, opcoes = {}) {
    const { cacheKey, ttl, force = false } = opcoes;

    if (cacheKey && !force) {
        const cached = obterCacheDVC(cacheKey);
        if (cached) return cached; // cached deve ser um objeto compatível com snapshot (ex: { exists: true, data: () => ... })
    }

    const docName = cacheKey || ref.id || "document";
    registrarLeituraFirestoreDVC(docName, "READ");
    
    const snap = await getDoc(ref);
    
    if (cacheKey) {
        // Armazena o snapshot original se precisar dos métodos data() ou exists()
        salvarCacheDVC(cacheKey, snap, ttl);
    }
    
    return snap;
}

/**
 * Wrapper para getDocs com cache e log.
 * @param {object} queryOrCollection - query ou collection Firebase
 * @param {object} opcoes - { cacheKey: string, ttl: number, force: boolean }
 */
export async function getDocsDVC(queryOrCollection, opcoes = {}) {
    const { cacheKey, ttl, force = false } = opcoes;

    if (cacheKey && !force) {
        const cached = obterCacheDVC(cacheKey);
        if (cached) return cached;
    }

    const colName = cacheKey || "collection_or_query";
    registrarLeituraFirestoreDVC(colName, "READ");
    
    const snap = await getDocs(queryOrCollection);
    
    if (cacheKey) {
        salvarCacheDVC(cacheKey, snap, ttl);
    }
    
    return snap;
}

window.cacheValidoDVC = cacheValidoDVC;
window.salvarCacheDVC = salvarCacheDVC;
window.obterCacheDVC = obterCacheDVC;
window.invalidarCacheDVC = invalidarCacheDVC;
window.invalidarCachesDVC = invalidarCachesDVC;
window.registrarLeituraFirestoreDVC = registrarLeituraFirestoreDVC;
window.getDocDVC = getDocDVC;
window.getDocsDVC = getDocsDVC;
