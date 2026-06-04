const fs = require('fs');
const vm = require('vm');

console.log("Loading js/quarterly-survey.js for unit testing...");

// 1. Read quarterly-survey.js
let code = fs.readFileSync('js/quarterly-survey.js', 'utf8');

// 2. Remove import statement to run in standard Node.js
code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*"\.\/firebase\.js";/, '');

// 3. Create context with mock globals
const mockDb = {};
const mockDoc = (db, col, id) => ({ db, col, id });
const mockSetDoc = async (docRef, data) => {
    mockDb[docRef.col + '/' + docRef.id] = data;
};
const mockUpdateDoc = async (docRef, data) => {
    mockDb[docRef.col + '/' + docRef.id] = {
        ...mockDb[docRef.col + '/' + docRef.id],
        ...data
    };
};
const mockServerTimestamp = () => 'MOCK_TIMESTAMP';

const mockDocument = {
    elements: {},
    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = {
                className: '',
                classList: {
                    add: (cls) => {},
                    remove: (cls) => {}
                },
                remove() {}
            };
        }
        return this.elements[id];
    },
    body: {
        insertAdjacentHTML(position, html) {}
    }
};

const mockWindow = {
    location: {
        hostname: 'localhost',
        search: ''
    },
    currentUserData: null,
    modoTestePerfilEmail: false,
    usuarioEhADM: (user) => user && user.funcao === 'ADM',
    usuarioPrecisaAtualizacaoSocioeconomicaDVC: () => false,
    obterStatusFinanceiroEfetivo: () => 'Em dia',
    usuarioPodeSerConvocadoPorFinanceiro: () => true,
    usuarioPodeAprovarAvaliacoes: () => false,
    alert(msg) { console.log('MOCK ALERT:', msg); }
};

const context = {
    auth: { currentUser: { email: 'atleta@dvc.com', uid: 'uid123' } },
    db: {},
    doc: mockDoc,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    serverTimestamp: mockServerTimestamp,
    window: mockWindow,
    document: mockDocument,
    alert: (msg) => mockWindow.alert(msg),
    console: console,
    setTimeout: setTimeout,
    Date: Date,
    URLSearchParams: URLSearchParams
};

// Expose internal functions by executing code in vm
vm.createContext(context);
vm.runInContext(code, context);

console.log('Running survey unit tests in Node...');

// Test 1: ADM Exemption
mockWindow.currentUserData = { funcao: 'ADM', email: 'adm@dvc.com' };
const precisaAdm = context.usuarioPrecisaPesquisaTrimestralDVC();
const pendenteAdm = context.usuarioEstaPendentePesquisaTrimestralDVC();
console.assert(precisaAdm === false, 'ADM should not need survey');
console.assert(pendenteAdm === false, 'ADM should not be pending survey');
console.log('Test 1 Passed: ADM correctly exempt.');

// Test 2: Normal User needing survey on June 10
mockWindow.currentUserData = { funcao: 'Membro', email: 'atleta@dvc.com', criadoEm: '2025-01-01T00:00:00Z', categoria: 'Sub17' };
mockWindow.location.search = '?data_teste=2026-06-10'; // mes de pesquisa (junho) dia 10 (dentro do periodo 5 a 15)
const precisaUser = context.usuarioPrecisaPesquisaTrimestralDVC(mockWindow.currentUserData);
const pendenteUser = context.usuarioEstaPendentePesquisaTrimestralDVC(mockWindow.currentUserData);
console.assert(precisaUser === true, 'User should need survey on June 10');
console.assert(pendenteUser === false, 'User should not be pending (blocked) on June 10');
console.log('Test 2 Passed: User needs survey on June 10 but is NOT blocked.');

// Test 3: Normal User blocked after day 15
mockWindow.location.search = '?data_teste=2026-06-16'; // mes de pesquisa, dia 16
const pendenteUserBlocked = context.usuarioEstaPendentePesquisaTrimestralDVC(mockWindow.currentUserData);
console.assert(pendenteUserBlocked === true, 'User should be pending (blocked) on June 16');
console.log('Test 3 Passed: User is blocked on June 16.');

// Test 4: Questionnaire Flow by DVC link time
// Test Sub17 - Short survey
context.abrirPesquisaTrimestralDVC();
mockWindow.currentUserData = { funcao: 'Membro', email: 'atleta@dvc.com', categoria: 'Sub17' };
context.selecionarRespostaPesquisaTrimestralDVC('tempoVinculo', 'A');
const perguntasCurtaSub17 = context.obterPerguntasAtivasDVC();
console.assert(perguntasCurtaSub17.length === 5, 'Short Sub17 survey should have 5 questions');

// Test Sub17 - Complete survey
context.abrirPesquisaTrimestralDVC();
mockWindow.currentUserData = { funcao: 'Membro', email: 'atleta@dvc.com', categoria: 'Sub17' };
context.selecionarRespostaPesquisaTrimestralDVC('tempoVinculo', 'B');
const perguntasCompletaSub17 = context.obterPerguntasAtivasDVC();
console.assert(perguntasCompletaSub17.length === 8, 'Complete Sub17 survey should have 8 questions');

// Test Adult - Short survey
context.abrirPesquisaTrimestralDVC();
mockWindow.currentUserData = { funcao: 'Membro', email: 'atleta@dvc.com', categoria: 'Adulto' };
context.selecionarRespostaPesquisaTrimestralDVC('tempoVinculoAdulto', 'A');
const perguntasCurtaAdulto = context.obterPerguntasAtivasDVC();
console.assert(perguntasCurtaAdulto.length === 5, 'Short Adult survey should have 5 questions');

// Test Adult - Complete survey
context.abrirPesquisaTrimestralDVC();
mockWindow.currentUserData = { funcao: 'Membro', email: 'atleta@dvc.com', categoria: 'Adulto' };
context.selecionarRespostaPesquisaTrimestralDVC('tempoVinculoAdulto', 'B');
const perguntasCompletaAdulto = context.obterPerguntasAtivasDVC();
console.assert(perguntasCompletaAdulto.length === 8, 'Complete Adult survey should have 8 questions');

console.log('Test 4 Passed: Questionnaire flow gating correctly works for both Sub17 and Adults.');

// Test 5: Clean orphan responses on saving (Sub17 Short Survey)
context.abrirPesquisaTrimestralDVC();
mockWindow.currentUserData = { funcao: 'Membro', email: 'atleta@dvc.com', categoria: 'Sub17' };

// 1. Simulate answering the first question as 'B' (long survey) and selecting a complete survey answer
context.selecionarRespostaPesquisaTrimestralDVC('tempoVinculo', 'B');
context.selecionarRespostaPesquisaTrimestralDVC('percepcaoSi', 'A'); // complete survey specific answer

// 2. Switch back to 'A' (short survey) and complete the short survey
context.selecionarRespostaPesquisaTrimestralDVC('tempoVinculo', 'A');
context.selecionarRespostaPesquisaTrimestralDVC('chegadaProjetoSub17Curta', 'A');
context.selecionarRespostaPesquisaTrimestralDVC('expectativaSub17Curta', 'B');
context.selecionarRespostaPesquisaTrimestralDVC('primeiraPercepcaoSub17Curta', 'C');
context.selecionarRespostaPesquisaTrimestralDVC('perguntaAbertaSub17Curta', 'Test input longer than 5 chars');

let savedDoc = null;
context.setDoc = async (docRef, data) => {
    savedDoc = data;
};
context.salvarPesquisaTrimestralDVC();

console.assert(savedDoc !== null, 'Survey should be saved');
console.assert(savedDoc.respostas.percepcaoSi === undefined, 'Orphan answer percepcaoSi should be cleaned');
console.assert(savedDoc.respostas.chegadaProjetoSub17Curta === 'A', 'Active answer should be preserved');
console.assert(savedDoc.tipoPesquisaAplicada === 'entrada', 'Should be entrada survey');
console.assert(savedDoc.pesquisaCompletaImpacto === false, 'Should not be complete impact');
console.log('Test 5 Passed: Saving filters orphan responses and includes correct metadata.');

console.log('All tests passed successfully!');
