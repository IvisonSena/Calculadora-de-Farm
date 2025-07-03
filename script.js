// Dados armazenados localmente
let atividades = JSON.parse(localStorage.getItem('atividades')) || [];
let itens = JSON.parse(localStorage.getItem('itens')) || [];
let farms = JSON.parse(localStorage.getItem('farms')) || [];
let entradas = [];
let drops = [];

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    carregarSelects();
    carregarFarmsSalvos();
    inicializarUX();
    setTimeout(recuperarFarmTemp, 1000);
    document.getElementById('dataFarm').value = new Date().toISOString().split('T')[0];
});

// === GERENCIAR ATIVIDADES ===
function adicionarTipoAtividade() {
    const tipo = document.getElementById('tipoAtividadeInput').value.trim();
    if (!tipo) {
        mostrarNotificacao('Digite um tipo de atividade!', 'warning');
        return;
    }
    
    const select = document.getElementById('tipoAtividadeSelect');
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo;
    select.appendChild(option);
    
    document.getElementById('tipoAtividadeInput').value = '';
    mostrarNotificacao('Tipo de atividade adicionado!', 'success');
}

function salvarAtividade() {
    const tipo = document.getElementById('tipoAtividadeSelect').value;
    const nome = document.getElementById('nomeAtividadeInput').value.trim();
    const custo = parseFloat(document.getElementById('custoAtividadeInput').value) || 0;
    const imagemFile = document.getElementById('imagemAtividade').files[0];
    
    if (tipo === 'Selecione...' || !nome) {
        mostrarNotificacao('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    const atividade = {
        id: Date.now(),
        tipo: tipo,
        nome: nome,
        custo: custo,
        imagem: ''
    };
    
    if (imagemFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            atividade.imagem = e.target.result;
            atividades.push(atividade);
            localStorage.setItem('atividades', JSON.stringify(atividades));
            carregarSelects();
            mostrarNotificacao('Atividade salva com sucesso!', 'success');
        };
        reader.readAsDataURL(imagemFile);
    } else {
        atividades.push(atividade);
        localStorage.setItem('atividades', JSON.stringify(atividades));
        carregarSelects();
        mostrarNotificacao('Atividade salva com sucesso!', 'success');
    }
    
    // Limpar campos
    document.getElementById('nomeAtividadeInput').value = '';
    document.getElementById('custoAtividadeInput').value = '';
    document.getElementById('imagemAtividade').value = '';
}

// === GERENCIAR ITENS ===
function salvarItem() {
    const nome = document.getElementById('nomeItemInput').value.trim();
    const valor = parseFloat(document.getElementById('valorItemInput').value) || 0;
    const imagemFile = document.getElementById('imagemItem').files[0];
    
    if (!nome) {
        mostrarNotificacao('Digite o nome do item!', 'warning');
        return;
    }
    
    const item = {
        id: Date.now(),
        nome: nome,
        valor: valor,
        imagem: ''
    };
    
    if (imagemFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.imagem = e.target.result;
            itens.push(item);
            localStorage.setItem('itens', JSON.stringify(itens));
            carregarSelects();
            mostrarNotificacao('Item adicionado com sucesso!', 'success');
        };
        reader.readAsDataURL(imagemFile);
    } else {
        itens.push(item);
        localStorage.setItem('itens', JSON.stringify(itens));
        carregarSelects();
        mostrarNotificacao('Item adicionado com sucesso!', 'success');
    }
    
    // Limpar campos
    document.getElementById('nomeItemInput').value = '';
    document.getElementById('valorItemInput').value = '';
    document.getElementById('imagemItem').value = '';
}

// === CARREGAR SELECTS ===
function carregarSelects() {
    // Carregar select de entradas (apenas atividades)
    const entradaSelect = document.getElementById('entradaSelect');
    entradaSelect.innerHTML = '<option>Selecione...</option>';
    
    atividades.forEach(atividade => {
        const option = document.createElement('option');
        option.value = `atividade_${atividade.id}`;
        option.textContent = `${atividade.tipo} - ${atividade.nome}`;
        option.dataset.valor = atividade.custo;
        option.dataset.imagem = atividade.imagem || '';
        entradaSelect.appendChild(option);
    });
    
    // Carregar select de drops (apenas itens)
    const dropSelect = document.getElementById('dropSelect');
    dropSelect.innerHTML = '<option>Selecione...</option>';
    
    itens.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.nome;
        option.dataset.valor = item.valor;
        option.dataset.imagem = item.imagem || '';
        dropSelect.appendChild(option);
    });
}

// === EVENTOS DOS SELECTS ===
function configurarEventosSelects() {
    document.getElementById('entradaSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.valor) {
            document.getElementById('entradaValor').value = selectedOption.dataset.valor;
        }
    });

    document.getElementById('dropSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.valor) {
            document.getElementById('dropValor').value = selectedOption.dataset.valor;
        }
    });
}

// === CALCULAR FARM ===
function adicionarEntrada() {
    const select = document.getElementById('entradaSelect');
    const qtd = parseInt(document.getElementById('entradaQtd').value) || 1;
    const valor = parseFloat(document.getElementById('entradaValor').value) || 0;
    
    if (select.value === 'Selecione...') {
        mostrarNotificacao('Selecione um item/atividade!', 'warning');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    const entrada = {
        id: Date.now(),
        nome: selectedOption.text,
        quantidade: qtd,
        valorUnitario: valor,
        total: qtd * valor,
        imagem: selectedOption.dataset.imagem || ''
    };
    
    entradas.push(entrada);
    atualizarTabelaEntradas();
    calcularResumo();
    
    // Limpar campos
    document.getElementById('entradaQtd').value = 1;
    document.getElementById('entradaValor').value = '';
    
    mostrarNotificacao('Custo adicionado!', 'success');
}

function adicionarDrop() {
    const select = document.getElementById('dropSelect');
    const qtd = parseInt(document.getElementById('dropQtd').value) || 1;
    const valor = parseFloat(document.getElementById('dropValor').value) || 0;
    
    if (select.value === 'Selecione...') {
        mostrarNotificacao('Selecione um item!', 'warning');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    const drop = {
        id: Date.now(),
        nome: selectedOption.text,
        quantidade: qtd,
        valorUnitario: valor,
        total: qtd * valor,
        imagem: selectedOption.dataset.imagem || ''
    };
    
    drops.push(drop);
    atualizarTabelaDrops();
    calcularResumo();
    
    // Limpar campos
    document.getElementById('dropQtd').value = 1;
    document.getElementById('dropValor').value = '';
    
    mostrarNotificacao('Drop adicionado!', 'success');
}

function atualizarTabelaEntradas() {
    const tabela = document.getElementById('tabelaEntradas');
    tabela.innerHTML = '<tr><th>Imagem</th><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
    
    entradas.forEach(entrada => {
        const row = tabela.insertRow();
        const imagemHtml = entrada.imagem ? `<img src="${entrada.imagem}" style="width: 32px; height: 32px;">` : '📦';
        row.innerHTML = `
            <td>${imagemHtml}</td>
            <td>${entrada.nome}</td>
            <td>${entrada.quantidade}</td>
            <td>${formatarAlz(entrada.valorUnitario)}</td>
            <td class="valor-negativo">${formatarAlz(entrada.total)}</td>
            <td><button onclick="removerEntrada(${entrada.id})" title="Remover item">🗑️</button></td>
        `;
    });
}

function atualizarTabelaDrops() {
    const tabela = document.getElementById('tabelaDrops');
    tabela.innerHTML = '<tr><th>Imagem</th><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
    
    drops.forEach(drop => {
        const row = tabela.insertRow();
        const imagemHtml = drop.imagem ? `<img src="${drop.imagem}" style="width: 32px; height: 32px;">` : '💎';
        row.innerHTML = `
            <td>${imagemHtml}</td>
            <td>${drop.nome}</td>
            <td>${drop.quantidade}</td>
            <td>${formatarAlz(drop.valorUnitario)}</td>
            <td class="valor-positivo">${formatarAlz(drop.total)}</td>
            <td><button onclick="removerDrop(${drop.id})" title="Remover item">🗑️</button></td>
        `;
    });
}

function removerEntrada(id) {
    entradas = entradas.filter(entrada => entrada.id !== id);
    atualizarTabelaEntradas();
    calcularResumo();
    mostrarNotificacao('Custo removido!', 'info');
}

function removerDrop(id) {
    drops = drops.filter(drop => drop.id !== id);
    atualizarTabelaDrops();
    calcularResumo();
    mostrarNotificacao('Drop removido!', 'info');
}

function calcularResumo() {
    const totalCustos = entradas.reduce((sum, entrada) => sum + entrada.total, 0);
    const totalDrops = drops.reduce((sum, drop) => sum + drop.total, 0);
    const lucro = totalDrops - totalCustos;
    
    // Lista detalhada de custos
    let listaCustos = '';
    entradas.forEach(entrada => {
        const imagemHtml = entrada.imagem ? `<img src="${entrada.imagem}" style="width: 20px; height: 20px; margin-right: 5px;">` : '📦 ';
        listaCustos += `<div style="display: flex; align-items: center; margin: 2px 0;">
            ${imagemHtml}${entrada.nome} x${entrada.quantidade} = ${formatarAlz(entrada.total)}
        </div>`;
    });
    
    // Lista detalhada de drops
    let listaDrops = '';
    drops.forEach(drop => {
        const imagemHtml = drop.imagem ? `<img src="${drop.imagem}" style="width: 20px; height: 20px; margin-right: 5px;">` : '💎 ';
        listaDrops += `<div style="display: flex; align-items: center; margin: 2px 0;">
            ${imagemHtml}${drop.nome} x${drop.quantidade} = ${formatarAlz(drop.total)}
        </div>`;
    });
    
    const resumo = document.getElementById('resumoFarm');
    resumo.innerHTML = `
        <table>
            <tr>
                <td><strong>💰 Total Custos:</strong></td>
                <td class="valor-negativo">${formatarAlz(totalCustos)}</td>
            </tr>
            <tr>
                <td><strong>💎 Total Drops:</strong></td>
                <td class="valor-positivo">${formatarAlz(totalDrops)}</td>
            </tr>
            <tr>
                <td><strong>📊 Lucro/Prejuízo:</strong></td>
                <td class="${lucro >= 0 ? 'valor-positivo' : 'valor-negativo'}">${formatarAlz(lucro)}</td>
            </tr>
        </table>
        
        ${entradas.length > 0 ? `<div style="margin-top: 15px;"><strong>📋 Detalhes dos Custos:</strong><div style="margin-left: 10px;">${listaCustos}</div></div>` : ''}
        
        ${drops.length > 0 ? `<div style="margin-top: 15px;"><strong>💎 Detalhes dos Drops:</strong><div style="margin-left: 10px;">${listaDrops}</div></div>` : ''}
    `;
}

// === SALVAR E GERENCIAR FARMS ===
function salvarFarm() {
    const nome = document.getElementById('nomeFarmInput').value.trim();
    const observacoes = document.getElementById('observacoesFarm').value.trim();
    const data = document.getElementById('dataFarm').value;
    
    if (!nome) {
        alert('Digite um nome para o farm!');
        return;
    }
    
    if (!data) {
        alert('Selecione uma data!');
        return;
    }
    
    const totalEntradas = entradas.reduce((sum, item) => sum + item.total, 0);
    const totalDrops = drops.reduce((sum, item) => sum + item.total, 0);
    const lucro = totalDrops - totalEntradas;
    
    const farm = {
        id: Date.now(),
        nome: nome,
        observacoes: observacoes,
        data: data,
        entradas: [...entradas],
        drops: [...drops],
        totalEntradas: totalEntradas,
        totalDrops: totalDrops,
        lucro: lucro
    };
    
    farms.push(farm);
    localStorage.setItem('farms', JSON.stringify(farms));
    carregarFarmsSalvos();
    mostrarNotificacao('Farm salvo com sucesso!', 'success');
}

function limparFarm() {
    if (confirm('Tem certeza que deseja limpar todos os dados?')) {
        entradas = [];
        drops = [];
        document.getElementById('nomeFarmInput').value = '';
        document.getElementById('observacoesFarm').value = '';
        document.getElementById('tabelaEntradas').innerHTML = '<tr><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
        document.getElementById('tabelaDrops').innerHTML = '<tr><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
        atualizarResumo();
        mostrarNotificacao('Dados limpos!', 'info');
    }
}

function carregarFarmsSalvos() {
    const lista = document.getElementById('listaFarms');
    lista.innerHTML = '';
    
    if (farms.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Nenhum farm salvo ainda.</p>';
        return;
    }
    
    farms.sort(function(a, b) { return new Date(b.data) - new Date(a.data); }).forEach(function(farm) {
        const div = document.createElement('div');
        
        // Gerar HTML das observações se existir
        let observacoesHtml = '';
        if (farm.observacoes && farm.observacoes.trim() !== '') {
            observacoesHtml = '<div style="margin-bottom: 10px;"><strong>📝 Observações:</strong><br>' +
                '<div style="background: white; padding: 6px; border-radius: 4px; border-left: 3px solid #3498db; margin-top: 3px; font-style: italic;">' +
                farm.observacoes + '</div></div>';
        }
        
        div.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
            '<strong style="color: #2c3e50;">' + farm.nome + '</strong>' +
            '<span class="badge ' + (farm.lucro >= 0 ? 'badge-success' : 'badge-danger') + '">' +
            (farm.lucro >= 0 ? 'Lucro' : 'Prejuízo') + '</span></div>' +
            '<div style="font-size: 12px; color:rgb(3, 3, 3); margin-bottom: 8px;">📅 ' + formatarData(farm.data) + '</div>' +
            '<div style="font-weight: bold; margin-bottom: 10px;">💰 ' + formatarAlz(farm.lucro) + '</div>' +
            '<div id="detalhes_' + farm.id + '" style="display: none; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 11px;">' +
            observacoesHtml +
            '<div><strong>📋 Entradas/Custos:</strong></div>' +
            farm.entradas.map(function(entrada) {
                return '<div style="margin: 2px 0; display: flex; align-items: center;">' +
                    (entrada.imagem ? '<img src="' + entrada.imagem + '" style="width: 16px; height: 16px; margin-right: 5px;">' : '📦 ') +
                    entrada.nome + ' x' + entrada.quantidade + ' = ' + formatarAlz(entrada.total) + '</div>';
            }).join('') +
            '<div style="margin-top: 8px;"><strong>💎 Drops:</strong></div>' +
            farm.drops.map(function(drop) {
                return '<div style="margin: 2px 0; display: flex; align-items: center;">' +
                    (drop.imagem ? '<img src="' + drop.imagem + '" style="width: 16px; height: 16px; margin-right: 5px;">' : '💎 ') +
                    drop.nome + ' x' + drop.quantidade + ' = ' + formatarAlz(drop.total) + '</div>';
            }).join('') +
            '</div>' +
            '<div style="display: flex; gap: 5px;">' +
            '<button onclick="toggleDetalhesFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Ver detalhes">👁️ Detalhes</button>' +
            '<button onclick="carregarFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Carregar farm">📂 Carregar</button>' +
            '<button onclick="duplicarFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Duplicar farm">📋 Duplicar</button>' +
            '<button onclick="excluirFarm(' + farm.id + ')" style="flex: 1; font-size: 11px; background: #e74c3c;" title="Excluir farm">🗑️ Excluir</button>' +
            '</div>';
        lista.appendChild(div);
    });
}

function carregarFarm(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    entradas = [...farm.entradas];
    drops = [...farm.drops];
    
    document.getElementById('nomeFarmInput').value = farm.nome;
    document.getElementById('dataFarm').value = farm.data;
    
    atualizarTabelaEntradas();
    atualizarTabelaDrops();
    calcularResumo();
    
    mostrarNotificacao('Farm carregado com sucesso!', 'success');
}

function duplicarFarm(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    entradas = [...farm.entradas];
    drops = [...farm.drops];
    
    document.getElementById('nomeFarmInput').value = farm.nome + ' (Cópia)';
    document.getElementById('dataFarm').value = new Date().toISOString().split('T')[0];
    
    atualizarTabelaEntradas();
    atualizarTabelaDrops();
    calcularResumo();
    
    mostrarNotificacao('Farm duplicado! Altere o nome e salve novamente.', 'info');
}

function excluirFarm(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    if (confirm(`Tem certeza que deseja excluir o farm "${farm.nome}"?`)) {
        farms = farms.filter(f => f.id !== id);
        localStorage.setItem('farms', JSON.stringify(farms));
        carregarFarmsSalvos();
        mostrarNotificacao('Farm excluído!', 'info');
    }
}

function toggleDetalhesFarm(id) {
    const detalhes = document.getElementById(`detalhes_${id}`);
    if (detalhes.style.display === 'none') {
        detalhes.style.display = 'block';
    } else {
        detalhes.style.display = 'none';
    }
}

// === CALCULAR PERÍODO ===
function calcularPeriodo() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        mostrarNotificacao('Selecione as datas de início e fim!', 'warning');
        return;
    }
    
    if (dataInicio > dataFim) {
        mostrarNotificacao('Data de início deve ser anterior à data fim!', 'error');
        return;
    }
    
    const farmsPeriodo = farms.filter(farm => {
        return farm.data >= dataInicio && farm.data <= dataFim;
    });
    
    if (farmsPeriodo.length === 0) {
        document.getElementById('resultadoPeriodo').innerHTML = 
            '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Nenhum farm encontrado no período.</p>';
        return;
    }
    
    const totalLucro = farmsPeriodo.reduce((sum, farm) => sum + farm.lucro, 0);
    const totalCustos = farmsPeriodo.reduce((sum, farm) => sum + farm.totalCustos, 0);
    const totalDrops = farmsPeriodo.reduce((sum, farm) => sum + farm.totalDrops, 0);
    const farmsLucrativos = farmsPeriodo.filter(f => f.lucro > 0).length;
    const farmsPrejuizo = farmsPeriodo.filter(f => f.lucro < 0).length;
    
    document.getElementById('resultadoPeriodo').innerHTML = `
        <div>
            <div style="text-align: center; margin-bottom: 15px;">
                <strong>📊 Resumo do Período</strong><br>
                <small style="color: #7f8c8d;">📅 ${formatarData(dataInicio)} até ${formatarData(dataFim)}</small>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="text-align: center; padding: 8px; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                    <div style="font-size: 18px; font-weight: bold; color: #3498db;">${farmsPeriodo.length}</div>
                    <div style="font-size: 11px; color: #7f8c8d;">Total Farms</div>
                </div>
                <div style="text-align: center; padding: 8px; background: rgba(39, 174, 96, 0.1); border-radius: 6px;">
                    <div style="font-size: 18px; font-weight: bold; color: #27ae60;">${farmsLucrativos}</div>
                    <div style="font-size: 11px; color: #7f8c8d;">Lucrativos</div>
                </div>
            </div>
            
            <table style="width: 100%; font-size: 12px;">
                <tr>
                    <td><strong>💰 Total investido:</strong></td>
                    <td class="valor-negativo" style="text-align: right;">${formatarAlz(totalCustos)}</td>
                </tr>
                <tr>
                    <td><strong>💎 Total obtido:</strong></td>
                    <td class="valor-positivo" style="text-align: right;">${formatarAlz(totalDrops)}</td>
                </tr>
                <tr style="border-top: 2px solid #3498db;">
                    <td><strong>📈 Lucro total:</strong></td>
                    <td class="${totalLucro >= 0 ? 'valor-positivo' : 'valor-negativo'}" style="text-align: right; font-weight: bold;">
                        ${formatarAlz(totalLucro)}
                    </td>
                </tr>
                <tr>
                    <td><strong>📊 Lucro médio/farm:</strong></td>
                    <td class="${totalLucro >= 0 ? 'valor-positivo' : 'valor-negativo'}" style="text-align: right;">
                        ${formatarAlz(totalLucro / farmsPeriodo.length)}
                    </td>
                </tr>
                <tr>
                    <td><strong>📈 Taxa de sucesso:</strong></td>
                    <td style="text-align: right; color: #3498db; font-weight: bold;">
                        ${((farmsLucrativos / farmsPeriodo.length) * 100).toFixed(1)}%
                    </td>
                </tr>
            </table>
        </div>
    `;
}

// === FUNÇÕES UTILITÁRIAS ===
function formatarAlz(valor) {
    if (valor === 0) return '<span class="color-branco">0 Alz</span>';
    
    const absValor = Math.abs(valor);
    const valorFormatado = absValor.toLocaleString('pt-BR') + ' Alz';
    const corClass = obterCorAlz(absValor);
    
    return `<span class="${corClass}">${valor < 0 ? '-' : ''}${valorFormatado}</span>`;
}

function obterCorAlz(valor) {
    if (valor <= 9999) return 'color-branco';
    if (valor <= 999999) return 'color-amarelo';
    if (valor <= 9999999) return 'color-ciano';
    if (valor <= 99999999) return 'color-verde';
    if (valor <= 999999999) return 'color-laranja';
    if (valor <= 9999999999) return 'color-azul';
    if (valor <= 99999999999) return 'color-verdeclaro';
    return 'color-rosaescuro';
}

function adicionarEventosCoresAlz() {
    const camposAlz = ['custoAtividadeInput', 'valorItemInput', 'entradaValor', 'dropValor'];
    
    camposAlz.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function() {
                const valor = parseFloat(this.value) || 0;
                const corClass = obterCorAlz(valor);
                
                // Remover classes de cor anteriores
                this.classList.remove('color-branco', 'color-amarelo', 'color-ciano', 'color-verde', 'color-laranja', 'color-azul', 'color-verdeclaro', 'color-rosaescuro');
                
                // Adicionar nova classe de cor
                this.classList.add(corClass);
            });
        }
    });
}

function formatarData(data) {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// === SISTEMA DE NOTIFICAÇÕES ===
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao';
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Definir cor baseada no tipo
    const cores = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notificacao.style.background = cores[tipo] || cores.info;
    notificacao.textContent = mensagem;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 3000);
}

// Adicionar CSS das animações das notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// === FUNCIONALIDADES EXTRAS ===

// Exportar dados para backup
function exportarDados() {
    const dados = {
        atividades: atividades,
        itens: itens,
        farms: farms,
        versao: '1.0',
        dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `farm-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    mostrarNotificacao('Backup exportado com sucesso!', 'success');
}

// Importar dados de backup
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            
            // Validar estrutura do backup
            if (!dados.atividades || !dados.itens || !dados.farms) {
                throw new Error('Estrutura de backup inválida');
            }
            
            if (confirm('⚠️ Isso irá substituir todos os dados atuais. Continuar?\n\n💡 Dica: Faça um backup dos dados atuais antes de continuar.')) {
                atividades = dados.atividades || [];
                itens = dados.itens || [];
                farms = dados.farms || [];
                
                localStorage.setItem('atividades', JSON.stringify(atividades));
                localStorage.setItem('itens', JSON.stringify(itens));
                localStorage.setItem('farms', JSON.stringify(farms));
                
                carregarSelects();
                carregarFarmsSalvos();
                
                mostrarNotificacao(`Dados importados com sucesso! ${farms.length} farms, ${atividades.length} atividades, ${itens.length} itens.`, 'success');
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            mostrarNotificacao('Erro ao importar arquivo. Verifique se é um backup válido.', 'error');
        }
    };
    reader.readAsText(file);
    
    // Limpar input para permitir reimportar o mesmo arquivo
    event.target.value = '';
}

// Mostrar estatísticas gerais
function mostrarEstatisticas() {
    if (farms.length === 0) {
        mostrarNotificacao('Nenhum farm registrado ainda!', 'warning');
        return;
    }
    
    const totalFarms = farms.length;
    const farmsLucrativos = farms.filter(f => f.lucro > 0).length;
    const farmsPrejuizo = farms.filter(f => f.lucro < 0).length;
    const farmsNeutros = farms.filter(f => f.lucro === 0).length;
    const lucroTotal = farms.reduce((sum, f) => sum + f.lucro, 0);
    const lucroMedio = lucroTotal / totalFarms;
    const melhorFarm = farms.reduce((max, f) => f.lucro > max.lucro ? f : max);
    const piorFarm = farms.reduce((min, f) => f.lucro < min.lucro ? f : min);
    
    // Calcular estatísticas por período
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const farmsDoMes = farms.filter(f => new Date(f.data) >= inicioMes);
    const lucroDoMes = farmsDoMes.reduce((sum, f) => sum + f.lucro, 0);
    
    const stats = `📊 ESTATÍSTICAS GERAIS

🎯 RESUMO GERAL:
• Total de farms: ${totalFarms}
• Farms lucrativos: ${farmsLucrativos} (${((farmsLucrativos/totalFarms)*100).toFixed(1)}%)
• Farms com prejuízo: ${farmsPrejuizo} (${((farmsPrejuizo/totalFarms)*100).toFixed(1)}%)
• Farms neutros: ${farmsNeutros}

💰 FINANCEIRO:
• Lucro total: ${formatarAlz(lucroTotal)}
• Lucro médio por farm: ${formatarAlz(lucroMedio)}
• Lucro do mês atual: ${formatarAlz(lucroDoMes)} (${farmsDoMes.length} farms)

🏆 RECORDES:
• Melhor farm: "${melhorFarm.nome}" 
  ${formatarAlz(melhorFarm.lucro)} em ${formatarData(melhorFarm.data)}
• Pior farm: "${piorFarm.nome}"
  ${formatarAlz(piorFarm.lucro)} em ${formatarData(piorFarm.data)}

📈 PERFORMANCE:
• Taxa de sucesso geral: ${((farmsLucrativos/totalFarms)*100).toFixed(1)}%
• Farms registrados este mês: ${farmsDoMes.length}`;
    
    alert(stats);
}

// Mostrar dicas de uso
function mostrarDicas() {
    const dicas = `💡 DICAS DE USO DA CALCULADORA

⌨️ ATALHOS DE TECLADO:
• Ctrl + S: Salvar farm atual
• Ctrl + L: Limpar farm atual  
• Ctrl + E: Exportar backup dos dados

🎯 FLUXO RECOMENDADO:
1️⃣ Cadastre suas atividades principais (DG, DX, Arena,)
2️⃣ Cadastre os itens que podem dropar com valores atualizados
3️⃣ Para cada sessão de farm:
   • Adicione todos os custos (entradas, consumíveis, etc.)
   • Adicione todos os drops obtidos
   • Salve o farm para histórico
4️⃣ Use análises por período para avaliar performance

💰 DICAS DE VALORES:
• Use valores em Alz (ex: 1000000 para 1M)
• Mantenha os valores dos itens sempre atualizados
• Considere todos os custos: entradas, pots, repairs, etc.

📊 ANÁLISES AVANÇADAS:
• Use o cálculo por período para análises mensais/semanais
• Compare diferentes tipos de farm
• Identifique os farms mais lucrativos
• Monitore sua taxa de sucesso

🔧 MANUTENÇÃO:
• Faça backup dos dados regularmente
• Limpe farms muito antigos se necessário
• Atualize valores dos itens conforme o mercado
• Use a função de duplicar farm para sessões similares

🎮 DICAS ESPECÍFICAS CABAL:
• Considere o custo de teleporte e consumíveis
• Inclua drops secundários (alz, materiais, etc.)
• Monitore eventos especiais que afetam drops
• Compare eficiência entre diferentes horários`;
    
    alert(dicas);
}

// Limpar todos os dados
function limparTodosDados() {
    const confirmacao1 = confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados salvos!\n\n📋 Dados que serão perdidos:\n• Todas as atividades cadastradas\n• Todos os itens cadastrados\n• Todos os farms salvos\n\nEsta ação NÃO pode ser desfeita!\n\nTem certeza que deseja continuar?');
    
    if (!confirmacao1) return;
    
    const confirmacao2 = confirm('🚨 ÚLTIMA CONFIRMAÇÃO!\n\nTodos os dados serão perdidos permanentemente.\n\n💡 Recomendação: Faça um backup antes de continuar.\n\nDigite "CONFIRMAR" na próxima tela para prosseguir.');
    
    if (!confirmacao2) return;
    
    const confirmacaoTexto = prompt('Digite "CONFIRMAR" (em maiúsculas) para apagar todos os dados:');
    
    if (confirmacaoTexto !== 'CONFIRMAR') {
        mostrarNotificacao('Operação cancelada.', 'info');
        return;
    }
    
    // Limpar todos os dados
    localStorage.clear();
    atividades = [];
    itens = [];
    farms = [];
    entradas = [];
    drops = [];
    
    // Recarregar interface
    carregarSelects();
    carregarFarmsSalvos();
    atualizarTabelaEntradas();
    atualizarTabelaDrops();
    calcularResumo();
    
    // Limpar campos
    document.getElementById('nomeFarmInput').value = '';
    document.getElementById('dataFarm').value = new Date().toISOString().split('T')[0];
    document.getElementById('resultadoPeriodo').innerHTML = '';
    
    mostrarNotificacao('Todos os dados foram apagados!', 'success');
}

// === FUNCIONALIDADES DE UX ===

// Inicializar melhorias de experiência do usuário
function inicializarUX() {
    // Configurar eventos dos selects
    configurarEventosSelects();
    
    // Adicionar placeholder dinâmico nos campos de valor
    const campos = ['entradaValor', 'dropValor', 'custoAtividadeInput', 'valorItemInput'];
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('focus', function() {
                if (!this.placeholder.includes('ex:')) {
                    this.placeholder = 'ex: 1000000 (1M Alz)';
                }
            });
            
            campo.addEventListener('blur', function() {
                if (!this.value) {
                    this.placeholder = this.placeholder.split(' (')[0];
                }
            });
        }
    });
    
    // Auto-save temporário para recuperação
    setInterval(() => {
        if (entradas.length > 0 || drops.length > 0) {
            const farmTemp = {
                entradas: entradas,
                drops: drops,
                nome: document.getElementById('nomeFarmInput').value,
                data: document.getElementById('dataFarm').value,
                timestamp: Date.now()
            };
            localStorage.setItem('farmTemp', JSON.stringify(farmTemp));
        }
    }, 30000); // Auto-save a cada 30 segundos
    
    // Adicionar tooltips informativos
    adicionarTooltips();
    
    // Configurar validações em tempo real
    configurarValidacoes();
    
    // Adicionar esta linha no final da função:
    adicionarEventosCoresAlz();
}

// Adicionar tooltips informativos
function adicionarTooltips() {
    const tooltips = {
        'tipoAtividadeInput': 'Ex: Dungeon, Boss, Evento, PvP',
        'custoAtividadeInput': 'Custo padrão de entrada em Alz',
        'valorItemInput': 'Valor atual do item no mercado',
        'entradaQtd': 'Quantas vezes você fez essa atividade',
        'dropQtd': 'Quantidade do item que dropou',
        'nomeFarmInput': 'Nome para identificar esta sessão de farm',
        'dataFarm': 'Data em que o farm foi realizado'
    };
    
    Object.entries(tooltips).forEach(([id, texto]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.title = texto;
        }
    });
}

// Configurar validações em tempo real
function configurarValidacoes() {
    // Validar campos numéricos
    const camposNumericos = ['custoAtividadeInput', 'valorItemInput', 'entradaQtd', 'dropQtd', 'entradaValor', 'dropValor'];
    
    camposNumericos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function() {
                // Remover caracteres não numéricos (exceto ponto e vírgula)
                this.value = this.value.replace(/[^0-9.,]/g, '');
                
                // Substituir vírgula por ponto
                this.value = this.value.replace(',', '.');
                
                // Validar se é um número válido
                if (this.value && isNaN(parseFloat(this.value))) {
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.borderColor = '#e0e0e0';
                }
            });
        }
    });
}

// Recuperar farm temporário
function recuperarFarmTemp() {
    const farmTempStr = localStorage.getItem('farmTemp');
    if (!farmTempStr) return;
    
    try {
        const farmTemp = JSON.parse(farmTempStr);
        
        // Verificar se o farm temporário não é muito antigo (mais de 24 horas)
        const agora = Date.now();
        const tempoLimite = 24 * 60 * 60 * 1000; // 24 horas em ms
        
        if (agora - farmTemp.timestamp > tempoLimite) {
            localStorage.removeItem('farmTemp');
            return;
        }
        
        if ((farmTemp.entradas && farmTemp.entradas.length > 0) || 
            (farmTemp.drops && farmTemp.drops.length > 0)) {
            
            if (confirm('🔄 Encontrei um farm não salvo da sua última sessão.\n\nDeseja recuperá-lo?')) {
                entradas = farmTemp.entradas || [];
                drops = farmTemp.drops || [];
                
                if (farmTemp.nome) {
                    document.getElementById('nomeFarmInput').value = farmTemp.nome;
                }
                if (farmTemp.data) {
                    document.getElementById('dataFarm').value = farmTemp.data;
                }
                
                atualizarTabelaEntradas();
                atualizarTabelaDrops();
                calcularResumo();
                
                mostrarNotificacao('Farm recuperado com sucesso!', 'success');
            }
            
            localStorage.removeItem('farmTemp');
        }
    } catch (error) {
        console.error('Erro ao recuperar farm temporário:', error);
        localStorage.removeItem('farmTemp');
    }
}

// === ATALHOS DE TECLADO ===
document.addEventListener('keydown', function(e) {
    // Ctrl + S para salvar farm
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        salvarFarm();
    }
    
    // Ctrl + L para limpar farm atual
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        limparFarm();
    }
    
    // Ctrl + E para exportar dados
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportarDados();
    }
    
    // Ctrl + D para duplicar último farm
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (farms.length > 0) {
            duplicarFarm(farms[farms.length - 1].id);
        }
    }
    
    // ESC para limpar seleções
    if (e.key === 'Escape') {
        document.getElementById('entradaSelect').selectedIndex = 0;
        document.getElementById('dropSelect').selectedIndex = 0;
        document.getElementById('entradaValor').value = '';
        document.getElementById('dropValor').value = '';
    }
});

// === INICIALIZAÇÃO FINAL ===

// Adicionar alguns dados de exemplo na primeira execução
function adicionarDadosExemplo() {
    // Não adicionar dados de exemplo - usuário vai cadastrar manualmente
    localStorage.setItem('primeiraExecucao', 'false');
}

// Executar inicialização de dados de exemplo após carregamento
setTimeout(adicionarDadosExemplo, 2000);

// === FUNÇÕES DE FORMATAÇÃO MELHORADAS ===

// Melhorar formatação de números grandes
function formatarNumero(valor) {
    return valor.toLocaleString('pt-BR');
}

// Calcular porcentagem de lucro
function calcularPorcentagemLucro(lucro, investimento) {
    if (investimento === 0) return 0;
    return ((lucro / investimento) * 100).toFixed(1);
}

// === VALIDAÇÕES FINAIS ===

// Validar dados antes de salvar
function validarDadosFarm() {
    if (entradas.length === 0 && drops.length === 0) {
        return { valido: false, mensagem: 'Adicione pelo menos um custo ou drop!' };
    }
    
    const nome = document.getElementById('nomeFarmInput').value.trim();
    if (!nome) {
        return { valido: false, mensagem: 'Digite um nome para o farm!' };
    }
    
    return { valido: true };
}

// Sobrescrever função salvarFarm com validação
const salvarFarmOriginal = salvarFarm;
salvarFarm = function() {
    const validacao = validarDadosFarm();
    if (!validacao.valido) {
        mostrarNotificacao(validacao.mensagem, 'warning');
        return;
    }
    salvarFarmOriginal();
};

// === LOG DE ATIVIDADES (OPCIONAL) ===
function logAtividade(acao, detalhes = '') {
    const log = {
        timestamp: new Date().toISOString(),
        acao: acao,
        detalhes: detalhes
    };
    
    let logs = JSON.parse(localStorage.getItem('logs')) || [];
    logs.push(log);
    
    // Manter apenas os últimos 100 logs
    if (logs.length > 100) {
        logs = logs.slice(-100);
    }
    
    localStorage.setItem('logs', JSON.stringify(logs));
}

// Adicionar logs nas principais ações
const salvarAtividadeOriginal = salvarAtividade;
salvarAtividade = function() {
    salvarAtividadeOriginal();
    logAtividade('Atividade salva', document.getElementById('nomeAtividadeInput').value);
};

const salvarItemOriginal = salvarItem;
salvarItem = function() {
    salvarItemOriginal();
    logAtividade('Item salvo', document.getElementById('nomeItemInput').value);
};

// Adicionar funções de gerenciamento de listas:
function mostrarAbaGerenciar(tipo) {
    // Ocultar todas as abas
    document.getElementById('abaAtividades').style.display = 'none';
    document.getElementById('abaItens').style.display = 'none';
    
    // Resetar botões
    document.getElementById('btnAbaAtividades').style.background = '';
    document.getElementById('btnAbaItens').style.background = '';
    
    if (tipo === 'atividades') {
        document.getElementById('abaAtividades').style.display = 'block';
        document.getElementById('btnAbaAtividades').style.background = '#3498db';
        carregarListaAtividades();
    } else {
        document.getElementById('abaItens').style.display = 'block';
        document.getElementById('btnAbaItens').style.background = '#3498db';
        carregarListaItens();
    }
}

function carregarListaAtividades() {
    const lista = document.getElementById('listaAtividades');
    lista.innerHTML = '';
    
    if (atividades.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhuma atividade cadastrada.</p>';
        return;
    }
    
    atividades.forEach((atividade, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; align-items: center; gap: 10px;';
        
        div.innerHTML = `
            <div style="width: 40px;">
                ${atividade.imagem ? `<img src="${atividade.imagem}" style="width: 32px; height: 32px;">` : '📦'}
            </div>
            <div style="flex: 1;">
                <strong>${atividade.tipo} - ${atividade.nome}</strong><br>
                <small>Custo: ${formatarAlz(atividade.custo)}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="moverAtividade(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">⬆️</button>
                <button onclick="moverAtividade(${index}, 1)" ${index === atividades.length - 1 ? 'disabled' : ''} title="Mover para baixo">⬇️</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="editarAtividade(${atividade.id})" title="Editar">✏️</button>
                <button onclick="excluirAtividade(${atividade.id})" title="Excluir" style="background: #e74c3c;">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function carregarListaItens() {
    const lista = document.getElementById('listaItens');
    lista.innerHTML = '';
    
    if (itens.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhum item cadastrado.</p>';
        return;
    }
    
    itens.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; align-items: center; gap: 10px;';
        
        div.innerHTML = `
            <div style="width: 40px;">
                ${item.imagem ? `<img src="${item.imagem}" style="width: 32px; height: 32px;">` : '💎'}
            </div>
            <div style="flex: 1;">
                <strong>${item.nome}</strong><br>
                <small>Valor: ${formatarAlz(item.valor)}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="moverItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">⬆️</button>
                <button onclick="moverItem(${index}, 1)" ${index === itens.length - 1 ? 'disabled' : ''} title="Mover para baixo">⬇️</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="editarItem(${item.id})" title="Editar">✏️</button>
                <button onclick="excluirItem(${item.id})" title="Excluir" style="background: #e74c3c;">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Funções de movimentação:
function moverAtividade(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= atividades.length) return;
    
    [atividades[index], atividades[novoIndex]] = [atividades[novoIndex], atividades[index]];
    localStorage.setItem('atividades', JSON.stringify(atividades));
    carregarListaAtividades();
    carregarSelects();
}

function moverItem(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= itens.length) return;
    
    [itens[index], itens[novoIndex]] = [itens[novoIndex], itens[index]];
    localStorage.setItem('itens', JSON.stringify(itens));
    carregarListaItens();
    carregarSelects();
}

// Funções de exclusão:
function excluirAtividade(id) {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
        atividades = atividades.filter(a => a.id !== id);
        localStorage.setItem('atividades', JSON.stringify(atividades));
        carregarListaAtividades();
        carregarSelects();
        mostrarNotificacao('Atividade excluída!', 'info');
    }
}

function excluirItem(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        itens = itens.filter(i => i.id !== id);
        localStorage.setItem('itens', JSON.stringify(itens));
        carregarListaItens();
        carregarSelects();
        mostrarNotificacao('Item excluído!', 'info');
    }
}

function recolherAbas() {
    document.getElementById('abaAtividades').style.display = 'none';
    document.getElementById('abaItens').style.display = 'none';
    document.getElementById('btnAbaAtividades').style.background = '';
    document.getElementById('btnAbaItens').style.background = '';
}
// === FUNÇÕES DE EDIÇÃO ===

// Editar atividade
function editarAtividade(id) {
    const atividade = atividades.find(a => a.id === id);
    if (!atividade) return;
    
    // Preencher o formulário com os dados da atividade
    document.getElementById('tipoAtividadeSelect').value = atividade.tipo;
    document.getElementById('nomeAtividadeInput').value = atividade.nome;
    document.getElementById('custoAtividadeInput').value = atividade.custo;
    
    // Criar botão temporário de atualização
    const btnSalvar = document.querySelector('button[onclick="salvarAtividade()"]');
    btnSalvar.textContent = "✅ Atualizar Atividade";
    btnSalvar.onclick = function() {
        atualizarAtividade(id);
    };
    
    // Adicionar botão para cancelar edição
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = "❌ Cancelar";
    btnCancelar.style.background = "#e74c3c";
    btnCancelar.onclick = function() {
        document.getElementById('nomeAtividadeInput').value = '';
        document.getElementById('custoAtividadeInput').value = '';
        btnSalvar.textContent = "💾 Salvar Atividade";
        btnSalvar.onclick = salvarAtividade;
        this.remove();
    };
    
    // Adicionar botão de cancelar após o botão de salvar
    if (!document.getElementById('btnCancelarAtividade')) {
        btnCancelar.id = 'btnCancelarAtividade';
        btnSalvar.parentNode.insertBefore(btnCancelar, btnSalvar.nextSibling);
    }
    
    // Rolar até o formulário
    document.querySelector('.box').scrollIntoView({ behavior: 'smooth' });
    
    mostrarNotificacao('Editando atividade: ' + atividade.nome, 'info');
}

function atualizarAtividade(id) {
    const tipo = document.getElementById('tipoAtividadeSelect').value;
    const nome = document.getElementById('nomeAtividadeInput').value.trim();
    const custo = parseFloat(document.getElementById('custoAtividadeInput').value) || 0;
    const imagemFile = document.getElementById('imagemAtividade').files[0];
    
    if (tipo === 'Selecione...' || !nome) {
        mostrarNotificacao('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    // Encontrar a atividade pelo ID
    const index = atividades.findIndex(a => a.id === id);
    if (index === -1) return;
    
    // Manter a imagem atual se não for enviada uma nova
    const atividadeAtual = atividades[index];
    
    const atividade = {
        id: id,
        tipo: tipo,
        nome: nome,
        custo: custo,
        imagem: atividadeAtual.imagem
    };
    
    if (imagemFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            atividade.imagem = e.target.result;
            atividades[index] = atividade;
            localStorage.setItem('atividades', JSON.stringify(atividades));
            carregarSelects();
            carregarListaAtividades();
            
            // Restaurar botão original
            const btnSalvar = document.querySelector('button[onclick="atualizarAtividade(' + id + ')"]');
            btnSalvar.textContent = "💾 Salvar Atividade";
            btnSalvar.onclick = salvarAtividade;
            
            // Remover botão de cancelar
            const btnCancelar = document.getElementById('btnCancelarAtividade');
            if (btnCancelar) btnCancelar.remove();
            
            // Limpar campos
            document.getElementById('nomeAtividadeInput').value = '';
            document.getElementById('custoAtividadeInput').value = '';
            document.getElementById('imagemAtividade').value = '';
            
            mostrarNotificacao('Atividade atualizada com sucesso!', 'success');
        };
        reader.readAsDataURL(imagemFile);
    } else {
        atividades[index] = atividade;
        localStorage.setItem('atividades', JSON.stringify(atividades));
        carregarSelects();
        carregarListaAtividades();
        
        // Restaurar botão original
        const btnSalvar = document.querySelector('button[onclick="atualizarAtividade(' + id + ')"]');
        btnSalvar.textContent = "💾 Salvar Atividade";
        btnSalvar.onclick = salvarAtividade;
        
        // Remover botão de cancelar
        const btnCancelar = document.getElementById('btnCancelarAtividade');
        if (btnCancelar) btnCancelar.remove();
        
        // Limpar campos
        document.getElementById('nomeAtividadeInput').value = '';
        document.getElementById('custoAtividadeInput').value = '';
        document.getElementById('imagemAtividade').value = '';
        
        mostrarNotificacao('Atividade atualizada com sucesso!', 'success');
    }
}

// Editar item
function editarItem(id) {
    const item = itens.find(i => i.id === id);
    if (!item) return;
    
    // Preencher o formulário com os dados do item
    document.getElementById('nomeItemInput').value = item.nome;
    document.getElementById('valorItemInput').value = item.valor;
    
    // Criar botão temporário de atualização
    const btnSalvar = document.querySelector('button[onclick="salvarItem()"]');
    btnSalvar.textContent = "✅ Atualizar Item";
    btnSalvar.onclick = function() {
        atualizarItem(id);
    };
    
    // Adicionar botão para cancelar edição
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = "❌ Cancelar";
    btnCancelar.style.background = "#e74c3c";
    btnCancelar.onclick = function() {
        document.getElementById('nomeItemInput').value = '';
        document.getElementById('valorItemInput').value = '';
        btnSalvar.textContent = "➕ Adicionar Item";
        btnSalvar.onclick = salvarItem;
        this.remove();
    };
    
    // Adicionar botão de cancelar após o botão de salvar
    if (!document.getElementById('btnCancelarItem')) {
        btnCancelar.id = 'btnCancelarItem';
        btnSalvar.parentNode.insertBefore(btnCancelar, btnSalvar.nextSibling);
    }
    
    // Rolar até o formulário
    document.querySelectorAll('.box')[1].scrollIntoView({ behavior: 'smooth' });
    
    mostrarNotificacao('Editando item: ' + item.nome, 'info');
}

function atualizarItem(id) {
    const nome = document.getElementById('nomeItemInput').value.trim();
    const valor = parseFloat(document.getElementById('valorItemInput').value) || 0;
    const imagemFile = document.getElementById('imagemItem').files[0];
    
    if (!nome) {
        mostrarNotificacao('Digite o nome do item!', 'warning');
        return;
    }
    
    // Encontrar o item pelo ID
    const index = itens.findIndex(i => i.id === id);
    if (index === -1) return;
    
    // Manter a imagem atual se não for enviada uma nova
    const itemAtual = itens[index];
    
    const item = {
        id: id,
        nome: nome,
        valor: valor,
        imagem: itemAtual.imagem
    };
    
    if (imagemFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.imagem = e.target.result;
            itens[index] = item;
            localStorage.setItem('itens', JSON.stringify(itens));
            carregarSelects();
            carregarListaItens();
            
            // Restaurar botão original
            const btnSalvar = document.querySelector('button[onclick="atualizarItem(' + id + ')"]');
            btnSalvar.textContent = "➕ Adicionar Item";
            btnSalvar.onclick = salvarItem;
            
            // Remover botão de cancelar
            const btnCancelar = document.getElementById('btnCancelarItem');
            if (btnCancelar) btnCancelar.remove();
            
            // Limpar campos
            document.getElementById('nomeItemInput').value = '';
            document.getElementById('valorItemInput').value = '';
            document.getElementById('imagemItem').value = '';
            
            mostrarNotificacao('Item atualizado com sucesso!', 'success');
        };
        reader.readAsDataURL(imagemFile);
    } else {
        itens[index] = item;
        localStorage.setItem('itens', JSON.stringify(itens));
        carregarSelects();
        carregarListaItens();
        
        // Restaurar botão original
        const btnSalvar = document.querySelector('button[onclick="atualizarItem(' + id + ')"]');
        btnSalvar.textContent = "➕ Adicionar Item";
        btnSalvar.onclick = salvarItem;
        
        // Remover botão de cancelar
        const btnCancelar = document.getElementById('btnCancelarItem');
        if (btnCancelar) btnCancelar.remove();
        
        // Limpar campos
        document.getElementById('nomeItemInput').value = '';
        document.getElementById('valorItemInput').value = '';
        document.getElementById('imagemItem').value = '';
        
        mostrarNotificacao('Item atualizado com sucesso!', 'success');
    }
}

// === EDIÇÃO DE ENTRADAS E DROPS NA SEÇÃO DE CÁLCULO ===

// Editar entrada
function editarEntrada(id) {
    const entrada = entradas.find(e => e.id === id);
    if (!entrada) return;
    
    // Preencher campos com os dados da entrada
    document.getElementById('entradaQtd').value = entrada.quantidade;
    document.getElementById('entradaValor').value = entrada.valorUnitario;
    
    // Selecionar o item no dropdown (se possível)
    const entradaSelect = document.getElementById('entradaSelect');
    for (let i = 0; i < entradaSelect.options.length; i++) {
        if (entradaSelect.options[i].text === entrada.nome) {
            entradaSelect.selectedIndex = i;
            break;
        }
    }
    
    // Substituir botão de adicionar por atualizar
    const btnAdicionar = document.querySelector('button[onclick="adicionarEntrada()"]');
    btnAdicionar.textContent = "✅ Atualizar Custo";
    btnAdicionar.onclick = function() {
        atualizarEntrada(id);
    };
    
    // Adicionar botão para cancelar edição
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = "❌ Cancelar";
    btnCancelar.style.background = "#e74c3c";
    btnCancelar.onclick = function() {
        document.getElementById('entradaQtd').value = 1;
        document.getElementById('entradaValor').value = '';
        entradaSelect.selectedIndex = 0;
        btnAdicionar.textContent = "➕ Adicionar Custo";
        btnAdicionar.onclick = adicionarEntrada;
        this.remove();
    };
    
    // Adicionar botão de cancelar após o botão de adicionar
    if (!document.getElementById('btnCancelarEntrada')) {
        btnCancelar.id = 'btnCancelarEntrada';
        btnAdicionar.parentNode.insertBefore(btnCancelar, btnAdicionar.nextSibling);
    }
    
    mostrarNotificacao('Editando entrada: ' + entrada.nome, 'info');
}

function atualizarEntrada(id) {
    const select = document.getElementById('entradaSelect');
    const qtd = parseInt(document.getElementById('entradaQtd').value) || 1;
    const valor = parseFloat(document.getElementById('entradaValor').value) || 0;
    
    if (select.value === 'Selecione...') {
        mostrarNotificacao('Selecione um item/atividade!', 'warning');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    
    // Encontrar a entrada pelo ID
    const index = entradas.findIndex(e => e.id === id);
    if (index === -1) return;
    
    // Atualizar a entrada
    entradas[index] = {
        id: id,
        nome: selectedOption.text,
        quantidade: qtd,
        valorUnitario: valor,
        total: qtd * valor,
        imagem: selectedOption.dataset.imagem || ''
    };
    
    // Atualizar a tabela e o resumo
    atualizarTabelaEntradas();
    calcularResumo();
    
    // Restaurar botão original
    const btnAdicionar = document.querySelector('button[onclick="atualizarEntrada(' + id + ')"]');
    btnAdicionar.textContent = "➕ Adicionar Custo";
    btnAdicionar.onclick = adicionarEntrada;
    
    // Remover botão de cancelar
    const btnCancelar = document.getElementById('btnCancelarEntrada');
    if (btnCancelar) btnCancelar.remove();
    
    // Limpar campos
    document.getElementById('entradaQtd').value = 1;
    document.getElementById('entradaValor').value = '';
    select.selectedIndex = 0;
    
    mostrarNotificacao('Custo atualizado com sucesso!', 'success');
}

// Editar drop
function editarDrop(id) {
    const drop = drops.find(d => d.id === id);
    if (!drop) return;
    
    // Preencher campos com os dados do drop
    document.getElementById('dropQtd').value = drop.quantidade;
    document.getElementById('dropValor').value = drop.valorUnitario;
    
    // Selecionar o item no dropdown (se possível)
    const dropSelect = document.getElementById('dropSelect');
    for (let i = 0; i < dropSelect.options.length; i++) {
        if (dropSelect.options[i].text === drop.nome) {
             dropSelect.selectedIndex = i;
            break;
        }
    }
    
    // Substituir botão de adicionar por atualizar
    const btnAdicionar = document.querySelector('button[onclick="adicionarDrop()"]');
    btnAdicionar.textContent = "✅ Atualizar Drop";
    btnAdicionar.onclick = function() {
        atualizarDrop(id);
    };
    
    // Adicionar botão para cancelar edição
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = "❌ Cancelar";
    btnCancelar.style.background = "#e74c3c";
    btnCancelar.onclick = function() {
        document.getElementById('dropQtd').value = 1;
        document.getElementById('dropValor').value = '';
        dropSelect.selectedIndex = 0;
        btnAdicionar.textContent = "➕ Adicionar Drop";
        btnAdicionar.onclick = adicionarDrop;
        this.remove();
    };
    
    // Adicionar botão de cancelar após o botão de adicionar
    if (!document.getElementById('btnCancelarDrop')) {
        btnCancelar.id = 'btnCancelarDrop';
        btnAdicionar.parentNode.insertBefore(btnCancelar, btnAdicionar.nextSibling);
    }
    
    mostrarNotificacao('Editando drop: ' + drop.nome, 'info');
}

function atualizarDrop(id) {
    const select = document.getElementById('dropSelect');
    const qtd = parseInt(document.getElementById('dropQtd').value) || 1;
    const valor = parseFloat(document.getElementById('dropValor').value) || 0;
    
    if (select.value === 'Selecione...') {
        mostrarNotificacao('Selecione um item!', 'warning');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    
    // Encontrar o drop pelo ID
    const index = drops.findIndex(d => d.id === id);
    if (index === -1) return;
    
    // Atualizar o drop
    drops[index] = {
        id: id,
        nome: selectedOption.text,
        quantidade: qtd,
        valorUnitario: valor,
        total: qtd * valor,
        imagem: selectedOption.dataset.imagem || ''
    };
    
    // Atualizar a tabela e o resumo
    atualizarTabelaDrops();
    calcularResumo();
    
    // Restaurar botão original
    const btnAdicionar = document.querySelector('button[onclick="atualizarDrop(' + id + ')"]');
    btnAdicionar.textContent = "➕ Adicionar Drop";
    btnAdicionar.onclick = adicionarDrop;
    
    // Remover botão de cancelar
    const btnCancelar = document.getElementById('btnCancelarDrop');
    if (btnCancelar) btnCancelar.remove();
    
    // Limpar campos
    document.getElementById('dropQtd').value = 1;
    document.getElementById('dropValor').value = '';
    select.selectedIndex = 0;
    
    mostrarNotificacao('Drop atualizado com sucesso!', 'success');
}
function atualizarTabelaEntradas() {
    const tabela = document.getElementById('tabelaEntradas');
    tabela.innerHTML = '<tr><th>Imagem</th><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
    
    entradas.forEach(entrada => {
        const row = tabela.insertRow();
        const imagemHtml = entrada.imagem ? `<img src="${entrada.imagem}" style="width: 32px; height: 32px;">` : '📦';
        row.innerHTML = `
            <td>${imagemHtml}</td>
            <td>${entrada.nome}</td>
            <td>${entrada.quantidade}</td>
            <td>${formatarAlz(entrada.valorUnitario)}</td>
            <td class="valor-negativo">${formatarAlz(entrada.total)}</td>
            <td>
                <button onclick="editarEntrada(${entrada.id})" title="Editar item" style="background: #3498db; margin-right: 3px;">✏️</button>
                <button onclick="removerEntrada(${entrada.id})" title="Remover item" style="background: #e74c3c;">🗑️</button>
            </td>
        `;
    });
}

function atualizarTabelaDrops() {
    const tabela = document.getElementById('tabelaDrops');
    tabela.innerHTML = '<tr><th>Imagem</th><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
    
    drops.forEach(drop => {
        const row = tabela.insertRow();
        const imagemHtml = drop.imagem ? `<img src="${drop.imagem}" style="width: 32px; height: 32px;">` : '💎';
        row.innerHTML = `
            <td>${imagemHtml}</td>
            <td>${drop.nome}</td>
            <td>${drop.quantidade}</td>
            <td>${formatarAlz(drop.valorUnitario)}</td>
            <td class="valor-positivo">${formatarAlz(drop.total)}</td>
            <td>
                <button onclick="editarDrop(${drop.id})" title="Editar item" style="background: #3498db; margin-right: 3px;">✏️</button>
                <button onclick="removerDrop(${drop.id})" title="Remover item" style="background: #e74c3c;">🗑️</button>
            </td>
        `;
    });
}
// Adicionar função de pesquisa para itens e atividades
function adicionarPesquisa() {
    // Criar campo de pesquisa para atividades
    const pesquisaAtividades = document.createElement('input');
    pesquisaAtividades.type = 'text';
    pesquisaAtividades.placeholder = '🔍 Pesquisar atividades...';
    pesquisaAtividades.id = 'pesquisaAtividades';
    pesquisaAtividades.addEventListener('input', function() {
        filtrarAtividades(this.value);
    });
    
    // Criar campo de pesquisa para itens
    const pesquisaItens = document.createElement('input');
    pesquisaItens.type = 'text';
    pesquisaItens.placeholder = '🔍 Pesquisar itens...';
    pesquisaItens.id = 'pesquisaItens';
    pesquisaItens.addEventListener('input', function() {
        filtrarItens(this.value);
    });
    
    // Adicionar campos de pesquisa às respectivas abas
    document.getElementById('abaAtividades').insertBefore(pesquisaAtividades, document.getElementById('listaAtividades'));
    document.getElementById('abaItens').insertBefore(pesquisaItens, document.getElementById('listaItens'));
}

function filtrarAtividades(termo) {
    const listaDiv = document.getElementById('listaAtividades');
    const elementos = listaDiv.querySelectorAll('div[data-nome]');
    
    elementos.forEach(el => {
        const nome = el.dataset.nome.toLowerCase();
        const tipo = el.dataset.tipo.toLowerCase();
        if (nome.includes(termo.toLowerCase()) || tipo.includes(termo.toLowerCase())) {
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
}

function filtrarItens(termo) {
    const listaDiv = document.getElementById('listaItens');
    const elementos = listaDiv.querySelectorAll('div[data-nome]');
    
    elementos.forEach(el => {
        const nome = el.dataset.nome.toLowerCase();
        if (nome.includes(termo.toLowerCase())) {
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
}

// Modificar as funções de carregamento para adicionar atributos data-*
function carregarListaAtividades() {
    const lista = document.getElementById('listaAtividades');
    lista.innerHTML = '';
    
    if (atividades.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhuma atividade cadastrada.</p>';
        return;
    }
    
    atividades.forEach((atividade, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; align-items: center; gap: 10px;';
        div.dataset.nome = atividade.nome;
        div.dataset.tipo = atividade.tipo;
        
        div.innerHTML = `
            <div style="width: 40px;">
                ${atividade.imagem ? `<img src="${atividade.imagem}" style="width: 32px; height: 32px;">` : '📦'}
            </div>
            <div style="flex: 1;">
                <strong>${atividade.tipo} - ${atividade.nome}</strong><br>
                <small>Custo: ${formatarAlz(atividade.custo)}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="moverAtividade(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">⬆️</button>
                <button onclick="moverAtividade(${index}, 1)" ${index === atividades.length - 1 ? 'disabled' : ''} title="Mover para baixo">⬇️</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="editarAtividade(${atividade.id})" title="Editar">✏️</button>
                <button onclick="excluirAtividade(${atividade.id})" title="Excluir" style="background: #e74c3c;">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}
// Adicionar função para alternar entre modo claro e escuro
function adicionarAlternadorTema() {
    const btnTema = document.createElement('button');
    btnTema.id = 'btnAlternarTema';
    btnTema.innerHTML = '🌙 Modo Escuro';
    btnTema.classList.add('tool-btn');
    btnTema.onclick = alternarTema;
    
    // Adicionar botão na seção de ferramentas
    const ferramentas = document.querySelector('.sidebar .box:last-child');
    ferramentas.appendChild(btnTema);
    
    // Verificar tema salvo
    const temaEscuro = localStorage.getItem('temaEscuro') === 'true';
    if (temaEscuro) {
        document.body.classList.add('dark-mode');
        btnTema.innerHTML = '☀️ Modo Claro';
    }
}

function alternarTema() {
    const btnTema = document.getElementById('btnAlternarTema');
    const temaEscuroAtivo = document.body.classList.toggle('dark-mode');
    
    if (temaEscuroAtivo) {
        btnTema.innerHTML = '☀️ Modo Claro';
        localStorage.setItem('temaEscuro', 'true');
    } else {
        btnTema.innerHTML = '🌙 Modo Escuro';
        localStorage.setItem('temaEscuro', 'false');
    }
}
// Adicionar função para mostrar gráficos de desempenho
function mostrarGraficos() {
    // Verificar se há farms para analisar
    if (farms.length === 0) {
        mostrarNotificacao('Nenhum farm registrado para análise!', 'warning');
        return;
    }
    
    // Criar modal para exibir gráficos
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="this.parentNode.parentNode.remove()">&times;</span>
            <h2>📊 Análise de Desempenho</h2>
            
            <div class="tabs">
                <button class="tab-button active" onclick="mostrarAbaGrafico('lucroTempo')">Lucro por Tempo</button>
                <button class="tab-button" onclick="mostrarAbaGrafico('tiposAtividade')">Por Tipo de Atividade</button>
                <button class="tab-button" onclick="mostrarAbaGrafico('itensRentaveis')">Itens Mais Rentáveis</button>
            </div>
            
            <div id="lucroTempo" class="tab-content" style="display: block;">
                <h3>Evolução do Lucro ao Longo do Tempo</h3>
                <div class="grafico-container">
                    <canvas id="graficoLucroTempo"></canvas>
                </div>
            </div>
            
            <div id="tiposAtividade" class="tab-content" style="display: none;">
                <h3>Rentabilidade por Tipo de Atividade</h3>
                <div class="grafico-container">
                    <canvas id="graficoTiposAtividade"></canvas>
                </div>
            </div>
            
            <div id="itensRentaveis" class="tab-content" style="display: none;">
                <h3>Top 10 Itens Mais Rentáveis</h3>
                <div class="grafico-container">
                    <canvas id="graficoItensRentaveis"></canvas>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Função para alternar entre abas
    window.mostrarAbaGrafico = function(abaId) {
        // Ocultar todas as abas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remover classe ativa de todos os botões
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        document.getElementById(abaId).style.display = 'block';
        
        // Adicionar classe ativa ao botão
        document.querySelector(`.tab-button[onclick="mostrarAbaGrafico('${abaId}')"]`).classList.add('active');
    };
    
    // Aqui você pode adicionar o código para gerar os gráficos
    // Usando uma biblioteca como Chart.js
    // Exemplo: gerarGraficoLucroTempo();
}

// Adicionar botão para mostrar gráficos na seção de ferramentas
function adicionarBotaoGraficos() {
    const btnGraficos = document.createElement('button');
    btnGraficos.innerHTML = '📈 Gráficos de Desempenho';
    btnGraficos.classList.add('tool-btn');
    btnGraficos.onclick = mostrarGraficos;
    
    const ferramentas = document.querySelector('.sidebar .box:last-child');
    ferramentas.insertBefore(btnGraficos, ferramentas.querySelector('button:nth-child(2)'));
}
// Adicionar campo de tags ao formulário de itens
function adicionarCampoTags() {
    const campoTags = document.createElement('div');
    campoTags.innerHTML = `
        <label>Tags (separadas por vírgula):</label>
        <input type="text" id="tagsItemInput" placeholder="Ex: Arma, Raro, Evento">
    `;
    
    // Inserir antes do botão de salvar
    const btnSalvar = document.querySelector('button[onclick="salvarItem()"]');
    btnSalvar.parentNode.insertBefore(campoTags, btnSalvar);
    
        // Modificar função salvarItem para incluir tags
    const salvarItemOriginal = salvarItem;
    window.salvarItem = function() {
        const nome = document.getElementById('nomeItemInput').value.trim();
        const valor = parseFloat(document.getElementById('valorItemInput').value) || 0;
        const imagemFile = document.getElementById('imagemItem').files[0];
        const tagsInput = document.getElementById('tagsItemInput').value.trim();
        
        if (!nome) {
            mostrarNotificacao('Digite o nome do item!', 'warning');
            return;
        }
        
        // Processar tags
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        const item = {
            id: Date.now(),
            nome: nome,
            valor: valor,
            imagem: '',
            tags: tags
        };
        
        if (imagemFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                item.imagem = e.target.result;
                itens.push(item);
                localStorage.setItem('itens', JSON.stringify(itens));
                carregarSelects();
                mostrarNotificacao('Item adicionado com sucesso!', 'success');
            };
            reader.readAsDataURL(imagemFile);
        } else {
            itens.push(item);
            localStorage.setItem('itens', JSON.stringify(itens));
            carregarSelects();
            mostrarNotificacao('Item adicionado com sucesso!', 'success');
        }
        
        // Limpar campos
        document.getElementById('nomeItemInput').value = '';
        document.getElementById('valorItemInput').value = '';
        document.getElementById('imagemItem').value = '';
        document.getElementById('tagsItemInput').value = '';
    };
    
    // Também modificar a função de edição de item
    const atualizarItemOriginal = atualizarItem;
    window.atualizarItem = function(id) {
        const nome = document.getElementById('nomeItemInput').value.trim();
        const valor = parseFloat(document.getElementById('valorItemInput').value) || 0;
        const imagemFile = document.getElementById('imagemItem').files[0];
        const tagsInput = document.getElementById('tagsItemInput').value.trim();
        
        if (!nome) {
            mostrarNotificacao('Digite o nome do item!', 'warning');
            return;
        }
        
        // Processar tags
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        // Encontrar o item pelo ID
        const index = itens.findIndex(i => i.id === id);
        if (index === -1) return;
        
        // Manter a imagem atual se não for enviada uma nova
        const itemAtual = itens[index];
        
        const item = {
            id: id,
            nome: nome,
            valor: valor,
            imagem: itemAtual.imagem,
            tags: tags
        };
        
        // Resto da função igual ao original...
    };
}

// Adicionar filtro por tags
function adicionarFiltroTags() {
    // Extrair todas as tags únicas
    const todasTags = [];
    itens.forEach(item => {
        if (item.tags && item.tags.length > 0) {
            item.tags.forEach(tag => {
                if (!todasTags.includes(tag)) {
                    todasTags.push(tag);
                }
            });
        }
    });
    
    if (todasTags.length === 0) return;
    
    // Criar seletor de tags
    const filtroTags = document.createElement('div');
    filtroTags.className = 'filtro-tags';
    filtroTags.innerHTML = `
        <label>Filtrar por tag:</label>
        <select id="filtroTagsSelect">
            <option value="">Todas as tags</option>
            ${todasTags.map(tag => `<option value="${tag}">${tag}</option>`).join('')}
        </select>
    `;
    
    // Adicionar ao topo da lista de itens
    const listaItens = document.getElementById('abaItens');
    listaItens.insertBefore(filtroTags, listaItens.firstChild);
    
    // Adicionar evento de filtro
    document.getElementById('filtroTagsSelect').addEventListener('change', function() {
        const tagSelecionada = this.value;
        filtrarItensPorTag(tagSelecionada);
    });
}

function filtrarItensPorTag(tag) {
    const listaDiv = document.getElementById('listaItens');
    const elementos = listaDiv.querySelectorAll('div[data-id]');
    
    if (!tag) {
        // Mostrar todos
        elementos.forEach(el => {
            el.style.display = 'flex';
        });
        return;
    }
    
    elementos.forEach(el => {
        const itemId = parseInt(el.dataset.id);
        const item = itens.find(i => i.id === itemId);
        
        if (item && item.tags && item.tags.includes(tag)) {
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
}
// Adicionar sistema de metas
function adicionarSistemaMetas() {
    // Criar nova seção na sidebar
    const metasBox = document.createElement('div');
    metasBox.className = 'box';
    metasBox.innerHTML = `
        <h3>🎯 Metas de Farm</h3>
        <div id="formMetas">
            <label>Descrição da Meta:</label>
            <input type="text" id="descricaoMeta" placeholder="Ex: Juntar 10M para comprar armor">
            
            <label>Valor Alvo (Alz):</label>
            <input type="number" id="valorMeta" placeholder="Ex: 10000000">
            
            <label>Data Limite:</label>
            <input type="date" id="dataMeta">
            
            <button onclick="salvarMeta()" class="tool-btn">💾 Salvar Meta</button>
        </div>
        
        <div id="listaMetas"></div>
    `;
    
    // Inserir antes da última box da sidebar
    const sidebar = document.querySelector('.sidebar');
    sidebar.insertBefore(metasBox, sidebar.lastElementChild);
    
    // Inicializar metas do localStorage
    carregarMetas();
}

// Funções para gerenciar metas
function salvarMeta() {
    const descricao = document.getElementById('descricaoMeta').value.trim();
    const valor = parseFloat(document.getElementById('valorMeta').value) || 0;
    const data = document.getElementById('dataMeta').value;
    
    if (!descricao || valor <= 0 || !data) {
        mostrarNotificacao('Preencha todos os campos da meta!', 'warning');
        return;
    }
    
    const meta = {
        id: Date.now(),
        descricao: descricao,
        valorAlvo: valor,
        dataLimite: data,
        progresso: 0,
        concluida: false
    };
    
    // Salvar meta
    let metas = JSON.parse(localStorage.getItem('metas')) || [];
    metas.push(meta);
    localStorage.setItem('metas', JSON.stringify(metas));
    
    // Limpar campos
    document.getElementById('descricaoMeta').value = '';
    document.getElementById('valorMeta').value = '';
    document.getElementById('dataMeta').value = '';
    
    carregarMetas();
    mostrarNotificacao('Meta adicionada com sucesso!', 'success');
}

function carregarMetas() {
    const listaMetas = document.getElementById('listaMetas');
    const metas = JSON.parse(localStorage.getItem('metas')) || [];
    
    if (metas.length === 0) {
        listaMetas.innerHTML = '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Nenhuma meta definida.</p>';
        return;
    }
    
    listaMetas.innerHTML = '';
    
    // Calcular progresso total baseado nos farms
    const lucroTotal = farms.reduce((sum, farm) => sum + farm.lucro, 0);
    
    metas.forEach(meta => {
        // Atualizar progresso
        meta.progresso = Math.min(100, (lucroTotal / meta.valorAlvo) * 100);
        meta.concluida = meta.progresso >= 100;
        
        // Verificar se está atrasada
        const hoje = new Date();
        const dataLimite = new Date(meta.dataLimite);
        const atrasada = !meta.concluida && hoje > dataLimite;
        
        // Criar elemento da meta
        const metaEl = document.createElement('div');
        metaEl.className = 'meta-item';
        metaEl.innerHTML = `
            <div class="meta-header">
                <strong>${meta.descricao}</strong>
                <span class="badge ${meta.concluida ? 'badge-success' : atrasada ? 'badge-danger' : 'badge-info'}">
                    ${meta.concluida ? 'Concluída' : atrasada ? 'Atrasada' : 'Em andamento'}
                </span>
            </div>
            
            <div class="meta-info">
                <div>Alvo: ${formatarAlz(meta.valorAlvo)}</div>
                <div>Prazo: ${formatarData(meta.dataLimite)}</div>
            </div>
            
            <div class="meta-progresso">
                <div class="progresso-barra">
                    <div class="progresso-preenchimento" style="width: ${meta.progresso}%; 
                         background-color: ${meta.concluida ? '#27ae60' : atrasada ? '#e74c3c' : '#3498db'};">
                    </div>
                </div>
                <div class="progresso-texto">${meta.progresso.toFixed(1)}%</div>
            </div>
            
            <div class="meta-acoes">
                <button onclick="excluirMeta(${meta.id})" title="Excluir meta">🗑️</button>
            </div>
        `;
        
        listaMetas.appendChild(metaEl);
    });
    
    // Atualizar metas no localStorage
    localStorage.setItem('metas', JSON.stringify(metas));
}

function excluirMeta(id) {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
        let metas = JSON.parse(localStorage.getItem('metas')) || [];
        metas = metas.filter(m => m.id !== id);
        localStorage.setItem('metas', JSON.stringify(metas));
        carregarMetas();
        mostrarNotificacao('Meta excluída!', 'info');
    }
}
// Adicionar histórico de preços para itens
function adicionarHistoricoPrecos() {
    // Modificar a função salvarItem para registrar histórico de preços
    const salvarItemOriginal = window.salvarItem;
    window.salvarItem = function() {
        const nome = document.getElementById('nomeItemInput').value.trim();
        const valor = parseFloat(document.getElementById('valorItemInput').value) || 0;
        
        if (!nome) {
            mostrarNotificacao('Digite o nome do item!', 'warning');
            return;
        }
        
        // Verificar se o item já existe
        const itemExistente = itens.find(i => i.nome.toLowerCase() === nome.toLowerCase());
        
        // Se o item existe e o valor mudou, registrar no histórico
        if (itemExistente && itemExistente.valor !== valor) {
            // Inicializar histórico se não existir
            if (!itemExistente.historicoPrecos) {
                itemExistente.historicoPrecos = [];
            }
            
            // Adicionar entrada no histórico
            itemExistente.historicoPrecos.push({
                data: new Date().toISOString(),
                valor: itemExistente.valor
            });
            
            // Limitar histórico a 10 entradas
            if (itemExistente.historicoPrecos.length > 10) {
                itemExistente.historicoPrecos = itemExistente.historicoPrecos.slice(-10);
            }
        }
        
        // Continuar com a função original
        salvarItemOriginal();
    };
    
    // Adicionar função para visualizar histórico
    window.verHistoricoPrecos = function(id) {
        const item = itens.find(i => i.id === id);
        if (!item) return;
        
        if (!item.historicoPrecos || item.historicoPrecos.length === 0) {
            mostrarNotificacao('Este item não possui histórico de preços.', 'info');
            return;
        }
        
        // Criar modal para mostrar histórico
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-button" onclick="this.parentNode.parentNode.remove()">&times;</span>
                <h3>📈 Histórico de Preços: ${item.nome}</h3>
                
                <table>
                    <tr>
                        <th>Data</th>
                        <th>Valor</th>
                        <th>Variação</th>
                    </tr>
                    ${item.historicoPrecos.map((registro, index, array) => {
                        // Calcular variação em relação ao registro anterior
                        let variacao = 0;
                        let variacaoClass = '';
                        let variacaoTexto = '-';
                        
                        if (index > 0) {
                            const valorAnterior = array[index - 1].valor;
                            variacao = ((registro.valor - valorAnterior) / valorAnterior) * 100;
                            variacaoClass = variacao > 0 ? 'valor-positivo' : variacao < 0 ? 'valor-negativo' : '';
                            variacaoTexto = variacao > 0 ? `+${variacao.toFixed(1)}%` : `${variacao.toFixed(1)}%`;
                        }
                        
                        return `
                            <tr>
                                <td>${formatarData(registro.data.split('T')[0])}</td>
                                <td>${formatarAlz(registro.valor)}</td>
                                <td class="${variacaoClass}">${variacaoTexto}</td>
                            </tr>
                        `;
                    }).join('')}
                    <tr>
                        <td><strong>Atual</strong></td>
                        <td><strong>${formatarAlz(item.valor)}</strong></td>
                        <td>-</td>
                    </tr>
                </table>
                
                <div style="margin-top: 15px; text-align: center; font-size: 12px; color: #777;">
                    O histórico mostra as últimas 10 alterações de preço.
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    };
    
    // Adicionar botão de histórico na lista de itens
    const carregarListaItensOriginal = window.carregarListaItens;
    window.carregarListaItens = function() {
        carregarListaItensOriginal();
        
        // Adicionar botão de histórico em cada item
        const listaItens = document.getElementById('listaItens');
        const divItens = listaItens.querySelectorAll('div[style*="border: 1px solid #ddd"]');
        
        divItens.forEach(div => {
            const botoesDiv = div.querySelector('div:last-child');
            const idMatch = botoesDiv.querySelector('button').onclick.toString().match(/editarItem\((\d+)\)/);
            
            if (idMatch && idMatch[1]) {
                const itemId = parseInt(idMatch[1]);
                
                // Adicionar botão de histórico antes do botão de editar
                const btnHistorico = document.createElement('button');
                btnHistorico.innerHTML = '📈';
                btnHistorico.title = 'Ver histórico de preços';
                btnHistorico.onclick = function() {
                    verHistoricoPrecos(itemId);
                };
                
                botoesDiv.insertBefore(btnHistorico, botoesDiv.firstChild);
            }
        });
    };
}
// Adicionar função para exportar dados para CSV
function exportarParaCSV() {
    // Verificar se há farms para exportar
    if (farms.length === 0) {
        mostrarNotificacao('Nenhum farm para exportar!', 'warning');
        return;
    }
    
    // Perguntar qual tipo de exportação o usuário deseja
    const tipoExportacao = prompt(
        "Escolha o tipo de exportação:\n" +
        "1 - Resumo de todos os farms\n" +
        "2 - Detalhes completos (inclui entradas e drops)\n" +
        "3 - Apenas farms do último mês\n" +
        "Digite o número da opção:"
    );
    
    if (!tipoExportacao || !['1', '2', '3'].includes(tipoExportacao)) {
        return;
    }
    
       let farmsParaExportar = [...farms];
    
    // Filtrar farms se necessário
    if (tipoExportacao === '3') {
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        farmsParaExportar = farmsParaExportar.filter(farm => new Date(farm.data) >= umMesAtras);
        
        if (farmsParaExportar.length === 0) {
            mostrarNotificacao('Nenhum farm no último mês para exportar!', 'warning');
            return;
        }
    }
    
    // Ordenar por data
    farmsParaExportar.sort((a, b) => new Date(a.data) - new Date(b.data));
    
    // Gerar CSV baseado no tipo de exportação
    let csv = '';
    
    if (tipoExportacao === '1') {
        // Resumo de todos os farms
        csv = 'Data,Nome,Custos,Drops,Lucro,Observações\n';
        
        farmsParaExportar.forEach(farm => {
            // Escapar aspas nas strings
            const nome = farm.nome.replace(/"/g, '""');
            const observacoes = (farm.observacoes || '').replace(/"/g, '""');
            
            csv += `${farm.data},"${nome}",${farm.totalEntradas},${farm.totalDrops},${farm.lucro},"${observacoes}"\n`;
        });
    } else if (tipoExportacao === '2') {
        // Detalhes completos
        csv = 'Data,Nome,Custos,Drops,Lucro,Observações,Detalhes Entradas,Detalhes Drops\n';
        
        farmsParaExportar.forEach(farm => {
            // Escapar aspas nas strings
            const nome = farm.nome.replace(/"/g, '""');
            const observacoes = (farm.observacoes || '').replace(/"/g, '""');
            
            // Formatar detalhes de entradas
            const detalhesEntradas = farm.entradas.map(e => 
                `${e.nome} x${e.quantidade} (${e.valorUnitario} Alz)`
            ).join('; ');
            
            // Formatar detalhes de drops
            const detalhesDrops = farm.drops.map(d => 
                `${d.nome} x${d.quantidade} (${d.valorUnitario} Alz)`
            ).join('; ');
            
            csv += `${farm.data},"${nome}",${farm.totalEntradas},${farm.totalDrops},${farm.lucro},"${observacoes}","${detalhesEntradas}","${detalhesDrops}"\n`;
        });
    }
    
    // Criar blob e link para download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `farm-calculator-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarNotificacao('Dados exportados com sucesso!', 'success');
}

// Adicionar botão para exportar CSV na seção de ferramentas
function adicionarBotaoExportarCSV() {
    const btnExportarCSV = document.createElement('button');
    btnExportarCSV.innerHTML = '📊 Exportar para CSV';
    btnExportarCSV.classList.add('tool-btn');
    btnExportarCSV.onclick = exportarParaCSV;
    
    const ferramentas = document.querySelector('.sidebar .box:last-child');
    const btnExportarBackup = ferramentas.querySelector('button[onclick="exportarDados()"]');
    
    ferramentas.insertBefore(btnExportarCSV, btnExportarBackup);
}

// Adicionar calculadora de eficiência de farm
function adicionarCalculadoraEficiencia() {
    // Criar nova seção na sidebar ou como modal
    const calculadoraBox = document.createElement('div');
    calculadoraBox.className = 'box';
    calculadoraBox.innerHTML = `
        <h3>⏱️ Calculadora de Eficiência</h3>
        
        <label>Farm:</label>
        <select id="farmEficienciaSelect">
            <option value="">Selecione um farm...</option>
            ${farms.map(farm => `<option value="${farm.id}">${farm.nome} (${formatarData(farm.data)})</option>`).join('')}
        </select>
        
        <label>Tempo gasto (minutos):</label>
        <input type="number" id="tempoFarmInput" placeholder="Ex: 60">
        
        <button onclick="calcularEficiencia()" class="tool-btn">🧮 Calcular Eficiência</button>
        
        <div id="resultadoEficiencia" style="margin-top: 15px;"></div>
    `;
    
    // Inserir na sidebar
    const sidebar = document.querySelector('.sidebar');
    sidebar.insertBefore(calculadoraBox, sidebar.lastElementChild);
}

function calcularEficiencia() {
    const farmId = document.getElementById('farmEficienciaSelect').value;
    const tempoMinutos = parseInt(document.getElementById('tempoFarmInput').value) || 0;
    
    if (!farmId || tempoMinutos <= 0) {
        mostrarNotificacao('Selecione um farm e informe o tempo gasto!', 'warning');
        return;
    }
    
    const farm = farms.find(f => f.id == farmId);
    if (!farm) return;
    
    // Calcular métricas de eficiência
    const lucroHora = (farm.lucro / tempoMinutos) * 60;
    const custoHora = (farm.totalEntradas / tempoMinutos) * 60;
    const dropHora = (farm.totalDrops / tempoMinutos) * 60;
    
    // Calcular ROI (Return on Investment)
    const roi = farm.totalEntradas > 0 ? ((farm.lucro / farm.totalEntradas) * 100) : 0;
    
    // Exibir resultados
    const resultadoDiv = document.getElementById('resultadoEficiencia');
    resultadoDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
            <h4 style="margin-top: 0; color: #2c3e50;">Eficiência do Farm: ${farm.nome}</h4>
            
            <table style="width: 100%;">
                <tr>
                    <td><strong>Lucro por hora:</strong></td>
                    <td class="${lucroHora >= 0 ? 'valor-positivo' : 'valor-negativo'}">${formatarAlz(lucroHora)}</td>
                </tr>
                <tr>
                    <td><strong>Custo por hora:</strong></td>
                    <td>${formatarAlz(custoHora)}</td>
                </tr>
                <tr>
                    <td><strong>Drops por hora:</strong></td>
                    <td>${formatarAlz(dropHora)}</td>
                </tr>
                <tr>
                    <td><strong>ROI (Retorno sobre investimento):</strong></td>
                    <td class="${roi >= 0 ? 'valor-positivo' : 'valor-negativo'}">${roi.toFixed(1)}%</td>
                </tr>
                <tr>
                    <td><strong>Tempo para recuperar investimento:</strong></td>
                    <td>${farm.lucro <= 0 ? 'N/A' : formatarTempo(tempoMinutos * (farm.totalEntradas / farm.lucro))}</td>
                </tr>
            </table>
        </div>
    `;
}

// Função auxiliar para formatar tempo
function formatarTempo(minutos) {
    if (isNaN(minutos) || minutos <= 0) return 'N/A';
    
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    
    if (horas === 0) {
        return `${mins} minutos`;
    } else if (mins === 0) {
        return `${horas} horas`;
    } else {
        return `${horas}h ${mins}min`;
    }
}
// Adicionar inicialização das novas funcionalidades
function inicializarNovasFuncionalidades() {
    // Adicionar campo de tags para itens
    adicionarCampoTags();
    
    // Adicionar pesquisa para itens e atividades
    adicionarPesquisa();
    
    // Adicionar alternador de tema claro/escuro
    adicionarAlternadorTema();
    
    // Adicionar botão para gráficos
    adicionarBotaoGraficos();
    
    // Adicionar sistema de metas
    adicionarSistemaMetas();
    
    // Adicionar histórico de preços
    adicionarHistoricoPrecos();
    
    // Adicionar exportação para CSV
    adicionarBotaoExportarCSV();
    
    // Adicionar calculadora de eficiência
    adicionarCalculadoraEficiencia();
}

// Modificar a função inicializarUX para incluir as novas funcionalidades
const inicializarUXOriginal = inicializarUX;
inicializarUX = function() {
    inicializarUXOriginal();
    
    // Inicializar novas funcionalidades após um pequeno delay
    setTimeout(inicializarNovasFuncionalidades, 500);
};

// Adicionar função para compactar a lista de farms salvos
function compactarListaFarms() {
    // Substituir a função original de carregarFarmsSalvos
    const carregarFarmsSalvosOriginal = carregarFarmsSalvos;
    
    window.carregarFarmsSalvos = function() {
        const lista = document.getElementById('listaFarms');
        lista.innerHTML = '';
        
        if (farms.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Nenhum farm salvo ainda.</p>';
            return;
        }
        
        // Ordenar farms por data (mais recentes primeiro)
        const farmsSorted = [...farms].sort(function(a, b) { 
            return new Date(b.data) - new Date(a.data); 
        });
        
        // Mostrar apenas os 5 farms mais recentes na sidebar
        const farmsRecentes = farmsSorted.slice(0, 5);
        
        // Adicionar os farms recentes
        farmsRecentes.forEach(function(farm) {
            const div = document.createElement('div');
            
            // Gerar HTML das observações se existir
            let observacoesHtml = '';
            if (farm.observacoes && farm.observacoes.trim() !== '') {
                observacoesHtml = '<div style="margin-bottom: 10px;"><strong>📝 Observações:</strong><br>' +
                    '<div style="background: white; padding: 6px; border-radius: 4px; border-left: 3px solid #3498db; margin-top: 3px; font-style: italic;">' +
                    farm.observacoes + '</div></div>';
            }
            
            div.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
                '<strong style="color: #2c3e50;">' + farm.nome + '</strong>' +
                '<span class="badge ' + (farm.lucro >= 0 ? 'badge-success' : 'badge-danger') + '">' +
                (farm.lucro >= 0 ? 'Lucro' : 'Prejuízo') + '</span></div>' +
                '<div style="font-size: 12px; color:rgb(3, 3, 3); margin-bottom: 8px;">📅 ' + formatarData(farm.data) + '</div>' +
                '<div style="font-weight: bold; margin-bottom: 10px;">💰 ' + formatarAlz(farm.lucro) + '</div>' +
                '<div id="detalhes_' + farm.id + '" style="display: none; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 11px;">' +
                observacoesHtml +
                '<div><strong>📋 Entradas/Custos:</strong></div>' +
                farm.entradas.map(function(entrada) {
                    return '<div style="margin: 2px 0; display: flex; align-items: center;">' +
                        (entrada.imagem ? '<img src="' + entrada.imagem + '" style="width: 16px; height: 16px; margin-right: 5px;">' : '📦 ') +
                        entrada.nome + ' x' + entrada.quantidade + ' = ' + formatarAlz(entrada.total) + '</div>';
                }).join('') +
                '<div style="margin-top: 8px;"><strong>💎 Drops:</strong></div>' +
                farm.drops.map(function(drop) {
                    return '<div style="margin: 2px 0; display: flex; align-items: center;">' +
                        (drop.imagem ? '<img src="' + drop.imagem + '" style="width: 16px; height: 16px; margin-right: 5px;">' : '💎 ') +
                        drop.nome + ' x' + drop.quantidade + ' = ' + formatarAlz(drop.total) + '</div>';
                }).join('') +
                '</div>' +
                '<div style="display: flex; gap: 5px;">' +
                '<button onclick="toggleDetalhesFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Ver detalhes">👁️ Detalhes</button>' +
                '<button onclick="carregarFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Carregar farm">📂 Carregar</button>' +
                '<button onclick="duplicarFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Duplicar farm">📋 Duplicar</button>' +
                '<button onclick="excluirFarm(' + farm.id + ')" style="flex: 1; font-size: 11px; background: #e74c3c;" title="Excluir farm">🗑️ Excluir</button>' +
                '</div>';
            lista.appendChild(div);
        });
        
        // Adicionar contador e botão "Ver todos"
        if (farms.length > 5) {
            const verTodosDiv = document.createElement('div');
            verTodosDiv.style.textAlign = 'center';
            verTodosDiv.style.marginTop = '15px';
            verTodosDiv.innerHTML = `
                <button onclick="abrirModalFarms()" class="tool-btn" style="width: 100%;">
                    🔍 Ver todos os farms (${farms.length})
                </button>
            `;
            lista.appendChild(verTodosDiv);
        }
    };
    
    // Chamar a função para atualizar a lista imediatamente
    carregarFarmsSalvos();
}

// Função para abrir modal com todos os farms
function abrirModalFarms() {
    // Criar o modal
    const modal = document.createElement('div');
    modal.className = 'modal-farms';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Ordenar farms por data (mais recentes primeiro)
    const farmsSorted = [...farms].sort(function(a, b) { 
        return new Date(b.data) - new Date(a.data); 
    });
    
    // Criar conteúdo do modal
    modal.innerHTML = `
        <div class="modal-content" style="width: 90%; max-width: 1000px; max-height: 90vh; overflow-y: auto; background: white; border-radius: 8px; padding: 20px; position: relative;">
            <span class="close-button" onclick="this.parentNode.parentNode.remove()" style="position: absolute; top: 10px; right: 15px; font-size: 24px; cursor: pointer; color: #e74c3c;">&times;</span>
            
            <h2 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">📋 Todos os Farms Salvos (${farms.length})</h2>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <input type="text" id="pesquisaFarm" placeholder="🔍 Pesquisar por nome..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                
                <select id="filtroLucro" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="todos">Todos</option>
                    <option value="lucro">Apenas lucrativos</option>
                    <option value="prejuizo">Apenas prejuízo</option>
                </select>
                
                <select id="filtroPeriodo" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="todos">Qualquer data</option>
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 3 meses</option>
                </select>
            </div>
            
            <div id="listaFarmsModal" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                ${farmsSorted.map(farm => {
                    return `
                        <div class="farm-card" data-id="${farm.id}" data-nome="${farm.nome}" data-data="${farm.data}" data-lucro="${farm.lucro}" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="color: #2c3e50; font-size: 16px;">${farm.nome}</strong>
                                <span class="badge ${farm.lucro >= 0 ? 'badge-success' : 'badge-danger'}" style="padding: 3px 8px; border-radius: 4px; color: white; background: ${farm.lucro >= 0 ? '#27ae60' : '#e74c3c'};">
                                    ${farm.lucro >= 0 ? 'Lucro' : 'Prejuízo'}
                                </span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <div style="font-size: 13px; color: #7f8c8d;">📅 ${formatarData(farm.data)}</div>
                                <div style="font-weight: bold; font-size: 15px;">💰 ${formatarAlz(farm.lucro)}</div>
                            </div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                                <button onclick="toggleDetalhesFarmModal(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ Detalhes</button>
                                <button onclick="carregarFarmEFechar(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;">📂 Carregar</button>
                                <button onclick="duplicarFarmEFechar(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 Duplicar</button>
                                <button onclick="excluirFarmModal(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Excluir</button>
                            </div>
                            
                            <div id="detalhes_modal_${farm.id}" style="display: none; margin-top: 15px; padding: 10px; background: white; border-radius: 5px; font-size: 12px; border: 1px solid #ddd;">
                                ${farm.observacoes ? `
                                    <div style="margin-bottom: 10px;">
                                        <strong>📝 Observações:</strong>
                                        <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; border-left: 3px solid #3498db; margin-top: 3px; font-style: italic;">${farm.observacoes}</div>
                                    </div>
                                ` : ''}
                                
                                <div><strong>📋 Entradas/Custos:</strong> ${formatarAlz(farm.totalEntradas)}</div>
                                <div style="margin: 5px 0; max-height: 100px; overflow-y: auto; padding-left: 10px;">
                                    ${farm.entradas.map(entrada => {
                                        return `<div style="margin: 2px 0; display: flex; align-items: center;">
                                            ${entrada.imagem ? `<img src="${entrada.imagem}" style="width: 16px; height: 16px; margin-right: 5px;">` : '📦 '}
                                            ${entrada.nome} x${entrada.quantidade} = ${formatarAlz(entrada.total)}
                                        </div>`;
                                    }).join('')}
                                </div>
                                
                                <div><strong>💎 Drops:</strong> ${formatarAlz(farm.totalDrops)}</div>
                                <div style="margin: 5px 0; max-height: 100px; overflow-y: auto; padding-left: 10px;">
                                    ${farm.drops.map(drop => {
                                        return `<div style="margin: 2px 0; display: flex; align-items: center;">
                                            ${drop.imagem ? `<img src="${drop.imagem}" style="width: 16px; height: 16px; margin-right: 5px;">` : '💎 '}
                                            ${drop.nome} x${drop.quantidade} = ${formatarAlz(drop.total)}
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adicionar eventos de filtro e pesquisa
    setTimeout(() => {
                const pesquisaInput = document.getElementById('pesquisaFarm');
        const filtroLucro = document.getElementById('filtroLucro');
        const filtroPeriodo = document.getElementById('filtroPeriodo');
        
        // Função para filtrar os farms
        function filtrarFarms() {
            const termo = pesquisaInput.value.toLowerCase();
            const filtroLucroValor = filtroLucro.value;
            const filtroPeriodoValor = parseInt(filtroPeriodo.value);
            
            const cards = document.querySelectorAll('.farm-card');
            
            cards.forEach(card => {
                const nome = card.dataset.nome.toLowerCase();
                const lucro = parseFloat(card.dataset.lucro);
                const data = new Date(card.dataset.data);
                
                // Filtrar por nome
                const passaNome = nome.includes(termo);
                
                // Filtrar por lucro/prejuízo
                let passaLucro = true;
                if (filtroLucroValor === 'lucro') {
                    passaLucro = lucro >= 0;
                } else if (filtroLucroValor === 'prejuizo') {
                    passaLucro = lucro < 0;
                }
                
                // Filtrar por período
                let passaPeriodo = true;
                if (filtroPeriodoValor > 0) {
                    const dataLimite = new Date();
                    dataLimite.setDate(dataLimite.getDate() - filtroPeriodoValor);
                    passaPeriodo = data >= dataLimite;
                }
                
                // Exibir ou ocultar o card
                if (passaNome && passaLucro && passaPeriodo) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Atualizar contador
            const visíveis = document.querySelectorAll('.farm-card[style="display: block;"]').length;
            const total = document.querySelectorAll('.farm-card').length;
            
            const titulo = document.querySelector('.modal-content h2');
            titulo.textContent = `📋 Farms Salvos (${visíveis} de ${total})`;
        }
        
        // Adicionar eventos de filtro
        pesquisaInput.addEventListener('input', filtrarFarms);
        filtroLucro.addEventListener('change', filtrarFarms);
        filtroPeriodo.addEventListener('change', filtrarFarms);
    }, 100);
}

// Função para alternar detalhes do farm no modal
function toggleDetalhesFarmModal(id) {
    const detalhes = document.getElementById(`detalhes_modal_${id}`);
    if (detalhes) {
        detalhes.style.display = detalhes.style.display === 'none' ? 'block' : 'none';
    }
}

// Função para carregar farm e fechar modal
function carregarFarmEFechar(id) {
    carregarFarm(id);
    document.querySelector('.modal-farms').remove();
}

// Função para duplicar farm e fechar modal
function duplicarFarmEFechar(id) {
    duplicarFarm(id);
    document.querySelector('.modal-farms').remove();
}

// Função para excluir farm no modal
function excluirFarmModal(id) {
    if (confirm(`Tem certeza que deseja excluir este farm?`)) {
        const farm = farms.find(f => f.id === id);
        if (!farm) return;
        
        farms = farms.filter(f => f.id !== id);
        localStorage.setItem('farms', JSON.stringify(farms));
        
        // Remover o card do modal
        const card = document.querySelector(`.farm-card[data-id="${id}"]`);
        if (card) card.remove();
        
        // Atualizar contador
        const total = document.querySelectorAll('.farm-card').length;
        const titulo = document.querySelector('.modal-content h2');
        titulo.textContent = `📋 Farms Salvos (${total})`;
        
        // Atualizar a lista na sidebar
        carregarFarmsSalvos();
        
        mostrarNotificacao('Farm excluído!', 'info');
    }
}

// Adicionar estilos CSS para o modal
function adicionarEstilosModal() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-farms {
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
            animation: slideIn 0.3s ease-out;
        }
        
        .farm-card {
            transition: all 0.2s ease;
        }
        
        .farm-card:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .btn-farm-action {
            transition: all 0.2s ease;
        }
        
        .btn-farm-action:hover {
            filter: brightness(1.1);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Inicializar a compactação da lista de farms
function inicializarCompactacaoFarms() {
    adicionarEstilosModal();
    compactarListaFarms();
}

// Adicionar a inicialização à função inicializarUX
const inicializarUXOriginal2 = inicializarUX;
inicializarUX = function() {
    inicializarUXOriginal2();
    inicializarCompactacaoFarms();
};


// Redesenhar completamente a seção de farms salvos
function redesenharSecaoFarmsSalvos() {
    // Encontrar a box de farms salvos na sidebar
    const farmsSidebar = document.querySelector('.sidebar .box:first-child');
    
    // Substituir o conteúdo da box
    farmsSidebar.innerHTML = `
        <h3>📋 Farms Salvos</h3>
        <div style="text-align: center; padding: 10px 0;">
            <button onclick="abrirModalFarms()" class="tool-btn" style="width: 100%;">
                🔍 Ver Todos os Farms (${farms.length})
            </button>
            <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
                ${farms.length > 0 
                    ? `Último farm: <strong>${farms.sort((a, b) => new Date(b.data) - new Date(a.data))[0].nome}</strong> (${formatarData(farms.sort((a, b) => new Date(b.data) - new Date(a.data))[0].data)})`
                    : 'Nenhum farm salvo ainda.'}
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <div style="text-align: center; flex: 1; padding: 8px; background: rgba(52, 152, 219, 0.1); border-radius: 6px; margin-right: 5px;">
                <div style="font-size: 18px; font-weight: bold; color: #3498db;">${farms.length}</div>
                <div style="font-size: 11px; color: #7f8c8d;">Total</div>
            </div>
            <div style="text-align: center; flex: 1; padding: 8px; background: rgba(39, 174, 96, 0.1); border-radius: 6px; margin-left: 5px;">
                <div style="font-size: 18px; font-weight: bold; color: #27ae60;">${farms.filter(f => f.lucro > 0).length}</div>
                <div style="font-size: 11px; color: #7f8c8d;">Lucrativos</div>
            </div>
        </div>
    `;
    
    // Remover a função original de carregarFarmsSalvos
    window.carregarFarmsSalvos = function() {
        // Atualizar apenas o contador e as estatísticas
        const botaoVerTodos = document.querySelector('.sidebar .box:first-child button');
        if (botaoVerTodos) {
            botaoVerTodos.textContent = `🔍 Ver Todos os Farms (${farms.length})`;
        }
        
        const ultimoFarmInfo = document.querySelector('.sidebar .box:first-child div div');
        if (ultimoFarmInfo) {
            if (farms.length > 0) {
                const farmsMaisRecentes = [...farms].sort((a, b) => new Date(b.data) - new Date(a.data));
                ultimoFarmInfo.innerHTML = `Último farm: <strong>${farmsMaisRecentes[0].nome}</strong> (${formatarData(farmsMaisRecentes[0].data)})`;
            } else {
                ultimoFarmInfo.textContent = 'Nenhum farm salvo ainda.';
            }
        }
        
        const totalFarmsEl = document.querySelector('.sidebar .box:first-child div:last-child div:first-child div:first-child');
        if (totalFarmsEl) {
            totalFarmsEl.textContent = farms.length;
        }
        
        const farmsLucrativosEl = document.querySelector('.sidebar .box:first-child div:last-child div:last-child div:first-child');
        if (farmsLucrativosEl) {
            farmsLucrativosEl.textContent = farms.filter(f => f.lucro > 0).length;
        }
    };
}

// Melhorar a função do modal de farms
function abrirModalFarms() {
    // Criar o modal
    const modal = document.createElement('div');
    modal.className = 'modal-farms';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Ordenar farms por data (mais recentes primeiro)
    const farmsSorted = [...farms].sort(function(a, b) { 
        return new Date(b.data) - new Date(a.data); 
    });
    
    // Calcular estatísticas
    const totalFarms = farms.length;
    const farmsLucrativos = farms.filter(f => f.lucro > 0).length;
    const farmsPrejuizo = farms.filter(f => f.lucro < 0).length;
    const lucroTotal = farms.reduce((sum, f) => sum + f.lucro, 0);
    
    // Criar conteúdo do modal
    modal.innerHTML = `
        <div class="modal-content" style="width: 90%; max-width: 1200px; max-height: 90vh; overflow-y: auto; background: white; border-radius: 8px; padding: 20px; position: relative;">
            <span class="close-button" onclick="this.parentNode.parentNode.remove()" style="position: absolute; top: 10px; right: 15px; font-size: 24px; cursor: pointer; color: #e74c3c;">&times;</span>
            
            <h2 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                📋 Gerenciador de Farms Salvos
            </h2>
            
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1; min-width: 200px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${totalFarms}</div>
                    <div style="color: #7f8c8d;">Total de Farms</div>
                </div>
                
                <div style="flex: 1; min-width: 200px; background: rgba(39, 174, 96, 0.1); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${farmsLucrativos}</div>
                    <div style="color: #7f8c8d;">Farms Lucrativos</div>
                </div>
                
                <div style="flex: 1; min-width: 200px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${farmsPrejuizo}</div>
                    <div style="color: #7f8c8d;">Farms com Prejuízo</div>
                </div>
                
                <div style="flex: 1; min-width: 200px; background: rgba(241, 196, 15, 0.1); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: ${lucroTotal >= 0 ? '#27ae60' : '#e74c3c'};">${formatarAlz(lucroTotal)}</div>
                    <div style="color: #7f8c8d;">Lucro Total</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <input type="text" id="pesquisaFarm" placeholder="🔍 Pesquisar por nome..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                
                <select id="filtroLucro" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="todos">Todos os resultados</option>
                    <option value="lucro">Apenas lucrativos</option>
                    <option value="prejuizo">Apenas prejuízo</option>
                </select>
                
                <select id="filtroPeriodo" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="todos">Qualquer data</option>
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 3 meses</option>
                </select>
                
                <select id="ordenacao" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="data-desc">Data (mais recente)</option>
                    <option value="data-asc">Data (mais antiga)</option>
                    <option value="lucro-desc">Lucro (maior)</option>
                    <option value="lucro-asc">Lucro (menor)</option>
                    <option value="nome">Nome (A-Z)</option>
                </select>
            </div>
            
            <div id="listaFarmsModal" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                ${farmsSorted.map(farm => {
                    return `
                        <div class="farm-card" data-id="${farm.id}" data-nome="${farm.nome}" data-data="${farm.data}" data-lucro="${farm.lucro}" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="color: #2c3e50; font-size: 16px;">${farm.nome}</strong>
                                <span class="badge ${farm.lucro >= 0 ? 'badge-success' : 'badge-danger'}" style="padding: 3px 8px; border-radius: 4px; color: white; background: ${farm.lucro >= 0 ? '#27ae60' : '#e74c3c'};">
                                    ${farm.lucro >= 0 ? 'Lucro' : 'Prejuízo'}
                                </span>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <div style="font-size: 13px; color: #7f8c8d;">📅 ${formatarData(farm.data)}</div>
                                <div style="font-weight: bold; font-size: 15px;">💰 ${formatarAlz(farm.lucro)}</div>
                            </div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                                <button onclick="toggleDetalhesFarmModal(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">👁️ Detalhes</button>
                                <button onclick="carregarFarmEFechar(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer;">📂 Carregar</button>
                                <button onclick="duplicarFarmEFechar(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 Duplicar</button>
                                <button onclick="excluirFarmModal(${farm.id})" class="btn-farm-action" style="flex: 1; padding: 5px; font-size: 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Excluir</button>
                            </div>
                            
                            <div id="detalhes_modal_${farm.id}" style="display: none; margin-top: 15px; padding: 10px; background: white; border-radius: 5px; font-size: 12px; border: 1px solid #ddd;">
                                ${farm.observacoes ? `
                                    <div style="margin-bottom: 10px;">
                                        <strong>📝 Observações:</strong>
                                        <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; border-left: 3px solid #3498db; margin-top: 3px; font-style: italic;">${farm.observacoes}</div>
                                    </div>
                                ` : ''}
                                
                                <div><strong>📋 Entradas/Custos:</strong> ${formatarAlz(farm.totalEntradas)}</div>
                                <div style="margin: 5px 0; max-height: 100px; overflow-y: auto; padding-left: 10px;">
                                    ${farm.entradas.map(entrada => {
                                        return `<div style="margin: 2px 0; display: flex; align-items: center;">
                                            ${entrada.imagem ? `<img src="${entrada.imagem}" style="width: 16px; height: 16px; margin-right: 5px;">` : '📦 '}
                                            ${entrada.nome} x${entrada.quantidade} = ${formatarAlz(entrada.total)}
                                        </div>`;
                                    }).join('')}
                                </div>
                                
                                <div><strong>💎 Drops:</strong> ${formatarAlz(farm.totalDrops)}</div>
                                <div style="margin: 5px 0; max-
                                <div><strong>💎 Drops:</strong> ${formatarAlz(farm.totalDrops)}</div>
                                <div style="margin: 5px 0; max-height: 100px; overflow-y: auto; padding-left: 10px;">
                                    ${farm.drops.map(drop => {
                                        return `<div style="margin: 2px 0; display: flex; align-items: center;">
                                            ${drop.imagem ? `<img src="${drop.imagem}" style="width: 16px; height: 16px; margin-right: 5px;">` : '💎 '}
                                            ${drop.nome} x${drop.quantidade} = ${formatarAlz(drop.total)}
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
                <p>Dica: Use os filtros acima para encontrar farms específicos.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adicionar eventos de filtro e pesquisa
    setTimeout(() => {
        const pesquisaInput = document.getElementById('pesquisaFarm');
        const filtroLucro = document.getElementById('filtroLucro');
        const filtroPeriodo = document.getElementById('filtroPeriodo');
        const ordenacao = document.getElementById('ordenacao');
        
        // Função para filtrar os farms
        function filtrarFarms() {
            const termo = pesquisaInput.value.toLowerCase();
            const filtroLucroValor = filtroLucro.value;
            const filtroPeriodoValor = parseInt(filtroPeriodo.value);
            
            const cards = document.querySelectorAll('.farm-card');
            let farmsVisiveis = [];
            
            cards.forEach(card => {
                const id = parseInt(card.dataset.id);
                const nome = card.dataset.nome.toLowerCase();
                const lucro = parseFloat(card.dataset.lucro);
                const data = new Date(card.dataset.data);
                
                // Filtrar por nome
                const passaNome = nome.includes(termo);
                
                // Filtrar por lucro/prejuízo
                let passaLucro = true;
                if (filtroLucroValor === 'lucro') {
                    passaLucro = lucro >= 0;
                } else if (filtroLucroValor === 'prejuizo') {
                    passaLucro = lucro < 0;
                }
                
                // Filtrar por período
                let passaPeriodo = true;
                if (filtroPeriodoValor > 0) {
                    const dataLimite = new Date();
                    dataLimite.setDate(dataLimite.getDate() - filtroPeriodoValor);
                    passaPeriodo = data >= dataLimite;
                }
                
                // Exibir ou ocultar o card
                if (passaNome && passaLucro && passaPeriodo) {
                    card.style.display = 'block';
                    farmsVisiveis.push({
                        element: card,
                        id: id,
                        nome: card.dataset.nome,
                        lucro: lucro,
                        data: data
                    });
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Ordenar os farms visíveis
            ordenarFarms(farmsVisiveis);
            
            // Atualizar estatísticas
            const visíveis = farmsVisiveis.length;
            const total = cards.length;
            
            const titulo = document.querySelector('.modal-content h2');
            titulo.textContent = `📋 Gerenciador de Farms Salvos (${visíveis} de ${total})`;
        }
        
        // Função para ordenar os farms
        function ordenarFarms(farmsVisiveis) {
            const ordenacaoValor = ordenacao.value;
            const container = document.getElementById('listaFarmsModal');
            
            // Ordenar array de farms visíveis
            farmsVisiveis.sort((a, b) => {
                switch (ordenacaoValor) {
                    case 'data-desc':
                        return b.data - a.data;
                    case 'data-asc':
                        return a.data - b.data;
                    case 'lucro-desc':
                        return b.lucro - a.lucro;
                    case 'lucro-asc':
                        return a.lucro - b.lucro;
                    case 'nome':
                        return a.nome.localeCompare(b.nome);
                    default:
                        return 0;
                }
            });
            
            // Reordenar elementos no DOM
            farmsVisiveis.forEach(farm => {
                container.appendChild(farm.element);
            });
        }
        
        // Adicionar eventos de filtro e ordenação
        pesquisaInput.addEventListener('input', filtrarFarms);
        filtroLucro.addEventListener('change', filtrarFarms);
        filtroPeriodo.addEventListener('change', filtrarFarms);
        ordenacao.addEventListener('change', filtrarFarms);
        
        // Aplicar filtros iniciais
        filtrarFarms();
    }, 100);
}

// Função para alternar detalhes do farm no modal
function toggleDetalhesFarmModal(id) {
    const detalhes = document.getElementById(`detalhes_modal_${id}`);
    if (detalhes) {
        if (detalhes.style.display === 'none') {
            // Fechar todos os outros detalhes primeiro
            document.querySelectorAll('[id^="detalhes_modal_"]').forEach(el => {
                if (el.id !== `detalhes_modal_${id}`) {
                    el.style.display = 'none';
                }
            });
            
            // Abrir este detalhe
            detalhes.style.display = 'block';
        } else {
            detalhes.style.display = 'none';
        }
    }
}

// Função para carregar farm e fechar modal
function carregarFarmEFechar(id) {
    carregarFarm(id);
    document.querySelector('.modal-farms').remove();
}

// Função para duplicar farm e fechar modal
function duplicarFarmEFechar(id) {
    duplicarFarm(id);
    document.querySelector('.modal-farms').remove();
}

// Função para excluir farm no modal
function excluirFarmModal(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    if (confirm(`Tem certeza que deseja excluir o farm "${farm.nome}"?`)) {
        farms = farms.filter(f => f.id !== id);
        localStorage.setItem('farms', JSON.stringify(farms));
        
        // Remover o card do modal
        const card = document.querySelector(`.farm-card[data-id="${id}"]`);
        if (card) card.remove();
        
        // Atualizar estatísticas no modal
        const totalFarms = farms.length;
        const farmsLucrativos = farms.filter(f => f.lucro > 0).length;
        const farmsPrejuizo = farms.filter(f => f.lucro < 0).length;
        const lucroTotal = farms.reduce((sum, f) => sum + f.lucro, 0);
        
        const estatisticas = document.querySelectorAll('.modal-content > div:first-of-type > div');
        if (estatisticas.length >= 4) {
            estatisticas[0].querySelector('div:first-child').textContent = totalFarms;
            estatisticas[1].querySelector('div:first-child').textContent = farmsLucrativos;
            estatisticas[2].querySelector('div:first-child').textContent = farmsPrejuizo;
            estatisticas[3].querySelector('div:first-child').innerHTML = formatarAlz(lucroTotal);
            estatisticas[3].querySelector('div:first-child').style.color = lucroTotal >= 0 ? '#27ae60' : '#e74c3c';
        }
        
        // Atualizar contador no título
        const visíveis = document.querySelectorAll('.farm-card[style="display: block;"]').length;
        const total = farms.length;
        const titulo = document.querySelector('.modal-content h2');
        if (titulo) {
            titulo.textContent = `📋 Gerenciador de Farms Salvos (${visíveis} de ${total})`;
        }
        
        // Atualizar a lista na sidebar
        carregarFarmsSalvos();
        
        mostrarNotificacao('Farm excluído!', 'info');
    }
}

// Adicionar estilos CSS para o modal e cards
function adicionarEstilosAvancados() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-farms {
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
            animation: slideIn 0.3s ease-out;
        }
        
        .farm-card {
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        
        .farm-card:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .farm-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: #3498db;
        }
        
        .farm-card[data-lucro^="-"]::before {
            background: #e74c3c;
        }
        
        .btn-farm-action {
            transition: all 0.2s ease;
        }
        
        .btn-farm-action:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
        
        #pesquisaFarm {
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>');
            background-repeat: no-repeat;
            background-position: 8px center;
            padding-left: 32px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* Estilo para o botão na sidebar */
        .sidebar .box:first-child button {
            background: linear-gradient(to right, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .sidebar .box:first-child button:hover {
            background: linear-gradient(to right, #2980b9, #3498db);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
}

// Inicializar o redesign da seção de farms salvos
function inicializarRedesignFarmsSalvos() {
    adicionarEstilosAvancados();
    redesenharSecaoFarmsSalvos();
    
    // Sobrescrever a função excluirFarm para atualizar a sidebar
    const excluirFarmOriginal = excluirFarm;
    window.excluirFarm = function(id) {
        excluirFarmOriginal(id);
        carregarFarmsSalvos(); // Atualizar a sidebar após excluir
    };
    
    // Sobrescrever a função salvarFarm para atualizar a sidebar
    const salvarFarmOriginal = salvarFarm;
    window.salvarFarm = function() {
        salvarFarmOriginal();
        carregarFarmsSalvos(); // Atualizar a sidebar após salvar
    };
}

// Adicionar a inicialização à função inicializarUX
const inicializarUXOriginal3 = inicializarUX;
inicializarUX = function() {
    inicializarUXOriginal3();
    inicializarRedesignFarmsSalvos();
};
