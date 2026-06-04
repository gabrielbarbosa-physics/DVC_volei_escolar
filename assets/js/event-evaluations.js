/**
 * ============================================================================
 * Módulo: EVENT-EVALUATIONS
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a event-evaluations.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// EVENT EVALUATIONS MODULE DVC APP

import { auth, db, doc, getDoc, setDoc, updateDoc } from "./firebase.js";
import { currentUserData } from "./state.js";
import {
    escaparHtml,
    safeEditParam,
    normalizarEmailIdDVC,
    renderBadgeIdadeAtletaDVC
} from "./utils.js";

function usuarioEhEquipeTecnica() {
    return typeof window.usuarioEhEquipeTecnica === "function"
        ? window.usuarioEhEquipeTecnica()
        : false;
}

function normalizarResponsaveisTecnicosEvento(evento = {}) {
    return typeof window.normalizarResponsaveisTecnicosEvento === "function"
        ? window.normalizarResponsaveisTecnicosEvento(evento)
        : [];
}

async function carregarPresencasEventoDVC(eventId, force = false) {
    return typeof window.carregarPresencasEventoDVC === "function"
        ? window.carregarPresencasEventoDVC(eventId, force)
        : [];
}

async function carregarConvocadosEventoDVC(eventId, force = false) {
    return typeof window.carregarConvocadosEventoDVC === "function"
        ? window.carregarConvocadosEventoDVC(eventId, force)
        : [];
}

function limparCacheDados(tipo = "todos") {
    if (typeof window.limparCacheDados === "function") {
        return window.limparCacheDados(tipo);
    }
}

function renderMural() {
    if (typeof window.renderMural === "function") {
        return window.renderMural();
    }
}

function renderCalendar() {
    if (typeof window.renderCalendar === "function") {
        return window.renderCalendar();
    }
}

function renderProfile() {
    if (typeof window.renderProfile === "function") {
        return window.renderProfile();
    }
}

function getCriteriosAvaliacaoEvento(tipoEvento) {
    if (tipoEvento === "jogo") {
        return [
            { chave: "antecipacao", nome: "Antecipação" },
            { chave: "tomadaDecisao", nome: "Tomada de Decisão" },
            { chave: "leituraJogo", nome: "Leitura de Jogo" },
            { chave: "resiliencia", nome: "Resiliência" },
            { chave: "comunicacaoQuadra", nome: "Comunicação em Quadra" },
            { chave: "trabalhoEquipe", nome: "Trabalho em Equipe" }
        ];
    }

    return [
        { chave: "recepcao", nome: "Recepção" },
        { chave: "levantamento", nome: "Levantamento" },
        { chave: "ataque", nome: "Ataque" },
        { chave: "bloqueio", nome: "Bloqueio" },
        { chave: "defesa", nome: "Defesa" },
        { chave: "saque", nome: "Saque" }
    ];
}

window.avaliacaoTreinoTempDVC = window.avaliacaoTreinoTempDVC || {};

function getEstadoAvaliacaoTreinoDVC(eventId) {
    window.avaliacaoTreinoTempDVC = window.avaliacaoTreinoTempDVC || {};
    if (!window.avaliacaoTreinoTempDVC[eventId]) {
        window.avaliacaoTreinoTempDVC[eventId] = {
            atletasAlterados: new Set(),
            atletasConfirmadosSemMudanca: new Set(),
            todosAtletas: new Set()
        };
    }

    return window.avaliacaoTreinoTempDVC[eventId];
}

function getChaveAtletaAvaliacaoTreinoDVC(email = "") {
    return String(email || "").trim().toLowerCase();
}

function atualizarStatusCardAvaliacaoTreinoDVC(eventId, emailAtleta, texto = "Sem alteração", tipo = "neutro") {
    const statusEl = document.getElementById(`status-avaliacao-treino-${normalizarEmailIdDVC(emailAtleta)}`);
    const card = document.getElementById(`card-avaliacao-treino-${normalizarEmailIdDVC(emailAtleta)}`);
    if (!statusEl) return;

    const estilos = {
        neutro: "bg-gray-50 text-gray-500 border-gray-100",
        alterada: "bg-yellow-50 text-yellow-800 border-yellow-100",
        confirmada: "bg-green-50 text-green-700 border-green-100"
    };

    statusEl.className = `inline-flex items-center justify-center whitespace-nowrap leading-none rounded-full px-2.5 py-1 text-[8px] font-black uppercase border ${estilos[tipo] || estilos.neutro}`;
    statusEl.textContent = texto;

    if (card) {
        card.classList.toggle("border-yellow-200", tipo === "alterada");
        card.classList.toggle("border-green-200", tipo === "confirmada");
    }
}

function marcarAtletaAlteradoNaAvaliacaoTreino(eventId, emailAtleta) {
    const estado = getEstadoAvaliacaoTreinoDVC(eventId);
    const chave = getChaveAtletaAvaliacaoTreinoDVC(emailAtleta);
    if (!chave) return;

    estado.atletasAlterados.add(chave);
    estado.atletasConfirmadosSemMudanca.delete(chave);
    atualizarStatusCardAvaliacaoTreinoDVC(eventId, emailAtleta, "Avaliação alterada", "alterada");
}

function confirmarAtletaAvaliacaoTreino(eventId, emailAtleta) {
    const estado = getEstadoAvaliacaoTreinoDVC(eventId);
    const chave = getChaveAtletaAvaliacaoTreinoDVC(emailAtleta);
    if (!chave) return;

    estado.atletasConfirmadosSemMudanca.add(chave);
    atualizarStatusCardAvaliacaoTreinoDVC(eventId, emailAtleta, "Avaliação confirmada", "confirmada");
}

function limparAlteracoesAtletaAvaliacaoTreino(eventId, emailAtleta) {
    const estado = getEstadoAvaliacaoTreinoDVC(eventId);
    const chave = getChaveAtletaAvaliacaoTreinoDVC(emailAtleta);
    const card = document.getElementById(`card-avaliacao-treino-${normalizarEmailIdDVC(emailAtleta)}`);
    if (!chave) return;

    estado.atletasAlterados.delete(chave);
    estado.atletasConfirmadosSemMudanca.delete(chave);

    if (card) {
        card.querySelectorAll("select[data-criterio]").forEach(select => {
            select.value = "3";
        });
        const observacao = card.querySelector('[data-observacao="true"]');
        if (observacao) observacao.value = "";
    }

    atualizarStatusCardAvaliacaoTreinoDVC(eventId, emailAtleta, "Sem alteração", "neutro");
}

function limparAtletasAvaliadosTreino(eventId, emailAtleta) {
    return limparAlteracoesAtletaAvaliacaoTreino(eventId, emailAtleta);
}

function marcarTodosAvaliadosAvaliacaoTreino(eventId) {
    if (!confirm("Você tem certeza que deseja registrar as notas atuais para todos os atletas? Isso pode alterar as médias mesmo para quem ficou com nota 3.")) {
        return;
    }

    const estado = getEstadoAvaliacaoTreinoDVC(eventId);
    document.querySelectorAll("#m-avaliacao-evento .card-avaliacao-evento").forEach(card => {
        const emailAtleta = card.dataset.email || "";
        const chave = getChaveAtletaAvaliacaoTreinoDVC(emailAtleta);
        if (!chave) return;

        estado.atletasConfirmadosSemMudanca.add(chave);
        atualizarStatusCardAvaliacaoTreinoDVC(eventId, emailAtleta, "Avaliação confirmada", "confirmada");
    });
}

async function abrirAvaliacaoEvento(evId) {
    try {
        const eventoRef = doc(db, "events", evId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
            return alert("Evento não encontrado.");
        }

        const evento = eventoSnap.data();
        if (!podeAvaliarEvento(evento)) {
    return alert("A avaliação deste evento está disponível apenas para o responsável técnico, Treinador ou ADM.");
}
        const tipoEvento = evento.tipo === "jogo" ? "jogo" : "treino";
        const criterios = getCriteriosAvaliacaoEvento(tipoEvento);

        let presentes = [];

        const presencasCache = await carregarPresencasEventoDVC(evId);

        presencasCache.forEach(data => {
            presentes.push({
                email: data.id,
                nome: data.nome || data.id,
                nascimento: data.nascimento || data.dataNascimento || data.data_nascimento || "",
                funcao: data.funcao || "",
                funcaoVolei: data.funcaoVolei || "",
                sexo: data.sexo || ""
            });
        });

        if (presentes.length === 0) {
            const convocadosCache = await carregarConvocadosEventoDVC(evId);

            convocadosCache.forEach(data => {
                presentes.push({
                    email: data.email || data.id,
                    nome: data.nome || data.id,
                    nascimento: data.nascimento || data.dataNascimento || data.data_nascimento || "",
                    funcao: data.funcao || "",
                    funcaoVolei: data.funcaoVolei || "",
                    sexo: data.sexo || ""
                });
            });
        }

        if (presentes.length === 0) {
            return alert("Nenhum atleta presente ou convocado foi encontrado para avaliação.");
        }

        presentes.sort((a, b) => a.nome.localeCompare(b.nome));
        window.avaliacaoTreinoTempDVC[evId] = {
            atletasAlterados: new Set(),
            atletasConfirmadosSemMudanca: new Set(),
            todosAtletas: new Set(presentes.map(atleta => getChaveAtletaAvaliacaoTreinoDVC(atleta.email)).filter(Boolean))
        };

        const cardsAtletas = presentes.map((atleta, index) => {
            const atletaEmailSeguro = safeEditParam(atleta.email);
            const atletaIdSeguro = normalizarEmailIdDVC(atleta.email);
            const criteriosHtml = criterios.map(criterio => `
                <div class="flex justify-between items-center border-b border-gray-100 py-2">
                    <label class="text-[10px] font-black uppercase text-gray-600">
                        ${criterio.nome}
                    </label>

                    <select 
                        data-criterio="${criterio.chave}" 
                        onchange="marcarAtletaAlteradoNaAvaliacaoTreino('${safeEditParam(evId)}', '${atletaEmailSeguro}')"
                        class="p-2 border rounded-lg text-xs font-black bg-gray-50 w-20 text-center">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3" selected>3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
            `).join('');

            return `
                <div 
                    id="card-avaliacao-treino-${atletaIdSeguro}"
                    class="card-avaliacao-evento bg-white border rounded-2xl p-4 mb-3 shadow-sm"
                    data-email="${escaparHtml(atleta.email)}"
                    data-nome="${escaparHtml(atleta.nome || atleta.email)}">

                    <div class="flex justify-between items-start gap-2 mb-3">
                        <div>
                            <p class="text-[9px] font-black text-gray-400 uppercase">
                                Atleta ${index + 1} de ${presentes.length}
                            </p>
                            <p class="text-sm font-black text-gray-800 uppercase">
                                ${atleta.nome}
                            </p>
                        </div>

                        <div class="flex flex-col items-end gap-1 shrink-0">
                            ${renderBadgeIdadeAtletaDVC(atleta)}
                            <span class="bg-red-50 border border-red-100 text-[#990000] text-[8px] font-black px-2 py-1 rounded-full uppercase">
                                ${tipoEvento === "jogo" ? "Jogo" : "Treino"}
                            </span>
                            <span id="status-avaliacao-treino-${atletaIdSeguro}" class="inline-flex items-center justify-center whitespace-nowrap leading-none rounded-full px-2.5 py-1 text-[8px] font-black uppercase border bg-gray-50 text-gray-500 border-gray-100">
                                Sem alteração
                            </span>
                        </div>
                    </div>

                    <div class="bg-gray-50 border border-gray-100 rounded-xl p-2 mb-2">
                        <p class="text-[8px] font-bold text-gray-500 uppercase leading-relaxed">
                            Nota sugerida: 3. Altere ou confirme para registrar avaliação.
                        </p>
                    </div>

                    <div class="space-y-1">
                        ${criteriosHtml}
                    </div>

                    <div class="grid grid-cols-2 gap-2 mt-3">
                        <button type="button" onclick="confirmarAtletaAvaliacaoTreino('${safeEditParam(evId)}', '${atletaEmailSeguro}')" class="bg-green-50 text-green-700 border border-green-100 py-2 rounded-xl text-[8px] font-black uppercase">
                            Confirmar este atleta
                        </button>
                        <button type="button" onclick="limparAlteracoesAtletaAvaliacaoTreino('${safeEditParam(evId)}', '${atletaEmailSeguro}')" class="bg-gray-50 text-gray-500 border border-gray-100 py-2 rounded-xl text-[8px] font-black uppercase">
                            Limpar alterações
                        </button>
                    </div>

                    <textarea 
                        data-observacao="true"
                        placeholder="Observação opcional sobre o desempenho..."
                        class="w-full mt-3 p-2 border rounded-lg text-[10px] h-16 outline-none bg-gray-50"></textarea>
                </div>
            `;
        }).join('');

        const modal = `
            <div id="m-avaliacao-evento" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
                    <button 
                        onclick="document.getElementById('m-avaliacao-evento').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        &times;
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-1 text-[#990000]">
                        ${tipoEvento === "jogo" ? "Avaliação Pós-Jogo" : "Avaliação de Treino"}
                    </h2>

                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-4">
                        ${evento.titulo || "Evento DVC"} • ${presentes.length} presente(s)
                    </p>

                    <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4">
                        <p class="text-[9px] font-bold text-yellow-800 leading-relaxed">
                            A nota 3 é apenas sugestão visual. Ela só será salva para atletas alterados ou confirmados manualmente.
                        </p>
                    </div>

                    <button
                        type="button"
                        onclick="marcarTodosAvaliadosAvaliacaoTreino('${safeEditParam(evId)}')"
                        class="w-full bg-gray-900 text-white py-2.5 rounded-2xl font-black text-[9px] uppercase shadow-sm mb-4">
                        Marcar todos como avaliados com as notas atuais
                    </button>

                    ${cardsAtletas}

                    <button 
                        onclick="salvarAvaliacaoEvento('${evId}', '${tipoEvento}')"
                        class="w-full bg-[#990000] text-white py-3 rounded-full font-black text-[10px] uppercase shadow-md mt-2">
                        Salvar avaliações alteradas
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir avaliação do evento:", e);
        alert("Não foi possível abrir a avaliação deste evento.");
    }
}

async function abrirAvaliacaoAtletasDoTreino(eventId) {
    return abrirAvaliacaoEvento(eventId);
}

async function salvarAvaliacaoEvento(evId, tipoEvento) {
    try {
        const cards = document.querySelectorAll('#m-avaliacao-evento .card-avaliacao-evento');

        if (!cards.length) {
            return alert("Nenhum atleta para avaliar.");
        }

        const criterios = getCriteriosAvaliacaoEvento(tipoEvento);
        const avaliadorEmail = auth.currentUser?.email || "";
        const avaliadorNome = currentUserData?.nome || avaliadorEmail || "Equipe técnica";
        const estado = getEstadoAvaliacaoTreinoDVC(evId);
        const cardsAvaliados = Array.from(cards).filter(card => {
            const chave = getChaveAtletaAvaliacaoTreinoDVC(card.dataset.email || "");
            return estado.atletasAlterados.has(chave) || estado.atletasConfirmadosSemMudanca.has(chave);
        });

        const atualizarTelaDepoisDeSalvar = () => {
            document.getElementById('m-avaliacao-evento')?.remove();
            delete window.avaliacaoTreinoTempDVC[evId];

            limparCacheDados("eventos");
            limparCacheDados("avaliacoes");

            if (window.__abaAtualDVC === "mural") {
                renderMural();
            } else if (window.__abaAtualDVC === "calendar") {
                renderCalendar();
            } else {
                renderProfile();
            }
        };

        if (cardsAvaliados.length === 0) {
            const concluirSemAlterar = confirm("Nenhuma avaliação foi alterada. As notas dos atletas permanecerão como estão.\n\nClique em OK para concluir sem alterar notas ou Cancelar para voltar e avaliar.");

            if (!concluirSemAlterar) return;

            const agora = new Date().toISOString();
            await updateDoc(doc(db, "events", evId), {
                avaliacaoTecnicaStatus: "Concluida",
                avaliacaoTecnicaEm: agora,
                avaliacaoTecnicaPor: avaliadorNome,
                avaliacaoTecnicaPorEmail: avaliadorEmail,
                avaliacaoTecnicaTotalAtletas: 0,
                avaliacaoTreinoConcluidaEm: agora,
                avaliacaoTreinoConcluidaPor: avaliadorNome,
                avaliacaoTreinoConcluidaPorEmail: avaliadorEmail,
                avaliacoesAplicadas: 0
            });

            alert("Avaliação concluída sem alterar notas dos atletas.");
            atualizarTelaDepoisDeSalvar();
            return;
        }

        let totalSalvos = 0;

        for (const card of cardsAvaliados) {
            const emailAtleta = card.dataset.email;
            const nomeAtleta = card.dataset.nome || emailAtleta;
            const observacao = card.querySelector('[data-observacao="true"]')?.value || "";

            let notasEvento = {};

            criterios.forEach(criterio => {
                const select = card.querySelector(`[data-criterio="${criterio.chave}"]`);
                notasEvento[criterio.chave] = Number(select?.value || 3);
            });

            await setDoc(doc(db, "events", evId, "avaliacoesTecnicasPendentes", emailAtleta), {
                email: emailAtleta,
                nome: nomeAtleta,
                tipoEvento: tipoEvento,
                criterios: notasEvento,
                observacao: observacao,
                avaliadorEmail: avaliadorEmail,
                avaliadorNome: avaliadorNome,
                status: "Pendente",
                impactoAplicado: false,
                impactoAplicadoEm: "",
                impactoAplicadoPor: "",
                criadoEm: new Date().toISOString()
            });

            totalSalvos++;
        }

        const agora = new Date().toISOString();
        await updateDoc(doc(db, "events", evId), {
            avaliacaoTecnicaStatus: "Pendente",
            avaliacaoTecnicaEm: agora,
            avaliacaoTecnicaPor: avaliadorNome,
            avaliacaoTecnicaPorEmail: avaliadorEmail,
            avaliacaoTecnicaTotalAtletas: totalSalvos,
            avaliacaoTreinoConcluidaEm: agora,
            avaliacaoTreinoConcluidaPor: avaliadorNome,
            avaliacaoTreinoConcluidaPorEmail: avaliadorEmail,
            avaliacoesAplicadas: totalSalvos
        });

        alert(`Avaliação enviada para aprovação com ${totalSalvos} atleta(s).`);

        atualizarTelaDepoisDeSalvar();

    } catch (e) {
        console.error("Erro ao salvar avaliação do evento:", e);
        alert("Não foi possível salvar a avaliação. Verifique as permissões do Firebase.");
    }
}

function podeAvaliarEvento(evento) {
    const emailAtual = (auth.currentUser.email || "").trim().toLowerCase();
    const responsavelEmail = (evento.responsavelEmail || "").trim().toLowerCase();
    const responsaveisTecnicos = normalizarResponsaveisTecnicosEvento(evento);

    const podeAvaliarComoGestaoTecnica = usuarioEhEquipeTecnica();
    const isResponsavel = (responsavelEmail && responsavelEmail === emailAtual) ||
        responsaveisTecnicos.some(resp => resp.email === emailAtual);

    return podeAvaliarComoGestaoTecnica || isResponsavel;
}

window.getCriteriosAvaliacaoEvento = getCriteriosAvaliacaoEvento;
window.marcarAtletaAlteradoNaAvaliacaoTreino = marcarAtletaAlteradoNaAvaliacaoTreino;
window.confirmarAtletaAvaliacaoTreino = confirmarAtletaAvaliacaoTreino;
window.limparAlteracoesAtletaAvaliacaoTreino = limparAlteracoesAtletaAvaliacaoTreino;
window.limparAtletasAvaliadosTreino = limparAtletasAvaliadosTreino;
window.marcarTodosAvaliadosAvaliacaoTreino = marcarTodosAvaliadosAvaliacaoTreino;
window.abrirAvaliacaoEvento = abrirAvaliacaoEvento;
window.abrirAvaliacaoAtletasDoTreino = abrirAvaliacaoAtletasDoTreino;
window.salvarAvaliacaoEvento = salvarAvaliacaoEvento;
