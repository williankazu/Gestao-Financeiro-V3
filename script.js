
        let transactions = [];
        let editingIndex = -1;
        let categoryChart = null;
        let typeChart = null;
        let expenseChart = null;
        let paymentChart = null;
        let trendChart = null;
        let filteredTransactions = [];
        let filtroAtivo = 'todos';
        let metas = [];
        let orcamentos = {};
        let searchTerm = '';
        let selectedTransactions = new Set();

        // Load data on page load
        window.onload = function() {
            carregarDados();
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            document.getElementById('data').value = dataHoje;
            carregarDarkMode();
        };

        // Update charts on window resize
        window.addEventListener('resize', function() {
            if (transactions.length > 0) {
                atualizarGraficos();
            }
        });

        function carregarDados() {
            const savedData = localStorage.getItem('financialTransactions');
            if (savedData) {
                transactions = JSON.parse(savedData);
                filteredTransactions = [...transactions];
                atualizarInterface();
            }
            
            const savedGoals = localStorage.getItem('financialGoals');
            if (savedGoals) {
                metas = JSON.parse(savedGoals);
                atualizarMetas();
            }
            
            const savedBudgets = localStorage.getItem('financialBudgets');
            if (savedBudgets) {
                orcamentos = JSON.parse(savedBudgets);
                atualizarOrcamentos();
            }
        }

        function filtrarPorPeriodo(periodo) {
            filtroAtivo = periodo;
            
            // Remover classe active de todos os botões
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('is-active'));
            document.getElementById(`btn-${periodo}`).classList.add('is-active');
            
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            
            switch(periodo) {
                case 'todos':
                    document.getElementById('periodoAtivo').innerHTML = '<i class="fas fa-info-circle"></i> &nbsp; Exibindo todas as transações';
                    break;
                case 'hoje':
                    document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-day"></i> &nbsp; Exibindo: ${formatarData(dataHoje)}`;
                    break;
                case 'semana':
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                    const fimSemana = new Date(inicioSemana);
                    fimSemana.setDate(inicioSemana.getDate() + 6);
                    document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-week"></i> &nbsp; Semana: ${formatarData(inicioSemana.toISOString().split('T')[0])} a ${formatarData(fimSemana.toISOString().split('T')[0])}`;
                    break;
                case 'mes':
                    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-alt"></i> &nbsp; ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
                    break;
                case 'ano':
                    document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar"></i> &nbsp; Ano de ${hoje.getFullYear()}`;
                    break;
            }
            
            // Limpar inputs de data customizada
            document.getElementById('dataInicial').value = '';
            document.getElementById('dataFinal').value = '';
            
            aplicarFiltros();
        }

        function filtrarPorPeriodoCustomizado() {
            const dataInicial = document.getElementById('dataInicial').value;
            const dataFinal = document.getElementById('dataFinal').value;
            
            if (!dataInicial || !dataFinal) return;
            
            filtroAtivo = 'customizado';
            
            // Remover classe active de todos os botões
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('is-active'));
            
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-alt"></i> &nbsp; Período: ${formatarData(dataInicial)} a ${formatarData(dataFinal)}`;
            
            aplicarFiltros();
        }

        function salvarDados() {
            localStorage.setItem('financialTransactions', JSON.stringify(transactions));
        }

        function openModal(mode, index = -1) {
            editingIndex = index;
            const modal = document.getElementById('transactionModal');
            const modalTitle = document.getElementById('modalTitle');
            
            if (mode === 'edit') {
                modalTitle.textContent = 'Editar Transação';
                const trans = transactions[index];
                document.getElementById('tipo').value = trans.tipo;
                document.getElementById('descricao').value = trans.descricao;
                document.getElementById('categoria').value = trans.categoria;
                document.getElementById('formaPagamento').value = trans.formaPagamento || 'Dinheiro';
                document.getElementById('valor').value = trans.valor;
                document.getElementById('data').value = trans.data;
            } else {
                modalTitle.textContent = 'Nova Transação';
                limparFormulario();
                const hoje = new Date();
                const dataHoje = hoje.toISOString().split('T')[0];
                document.getElementById('data').value = dataHoje;
            }
            
            modal.classList.add('is-active');
        }

        function closeModal() {
            const modal = document.getElementById('transactionModal');
            modal.classList.remove('is-active');
            limparFormulario();
            editingIndex = -1;
        }

        function limparFormulario() {
            document.getElementById('tipo').value = 'entrada';
            document.getElementById('descricao').value = '';
            document.getElementById('categoria').value = 'Caixa';
            document.getElementById('formaPagamento').value = 'Dinheiro';
            document.getElementById('valor').value = '';
            document.getElementById('data').value = '';
        }

        function salvarTransacao() {
            const tipo = document.getElementById('tipo').value;
            const descricao = document.getElementById('descricao').value.trim();
            const categoria = document.getElementById('categoria').value;
            const formaPagamento = document.getElementById('formaPagamento').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const data = document.getElementById('data').value;

            if (!descricao || !valor || valor <= 0 || !data) {
                alert('Por favor, preencha todos os campos corretamente!');
                return;
            }

            const transaction = {
                tipo,
                descricao,
                categoria,
                formaPagamento,
                valor,
                data,
                id: editingIndex >= 0 ? transactions[editingIndex].id : Date.now()
            };

            if (editingIndex >= 0) {
                transactions[editingIndex] = transaction;
            } else {
                transactions.push(transaction);
            }

            salvarDados();
            filteredTransactions = [...transactions];
            filtrarPorPeriodo(filtroAtivo);
            closeModal();
        }

        // ===== FUNÇÕES DE SELEÇÃO =====
        function toggleSelection(id) {
            if (selectedTransactions.has(id)) {
                selectedTransactions.delete(id);
            } else {
                selectedTransactions.add(id);
            }
            atualizarBarraSelecao();
            atualizarCheckboxSelectAll();
        }

        function selecionarTodos() {
            const checkbox = document.getElementById('selectAllCheckbox');
            selectedTransactions.clear();
            
            if (checkbox.checked) {
                filteredTransactions.forEach(trans => {
                    selectedTransactions.add(trans.id);
                });
            }
            
            atualizarTabela();
            atualizarBarraSelecao();
        }

        function desmarcarTodos() {
            selectedTransactions.clear();
            document.getElementById('selectAllCheckbox').checked = false;
            atualizarTabela();
            atualizarBarraSelecao();
        }

        function atualizarBarraSelecao() {
            const selectionActions = document.getElementById('selectionActions');
            const selectedCount = document.getElementById('selectedCount');
            
            if (selectedTransactions.size > 0) {
                selectionActions.classList.add('active');
                selectedCount.textContent = selectedTransactions.size;
            } else {
                selectionActions.classList.remove('active');
            }
        }

        function atualizarCheckboxSelectAll() {
            const checkbox = document.getElementById('selectAllCheckbox');
            if (filteredTransactions.length === 0) return;
            
            const todosVisivelSelecionados = filteredTransactions.every(trans => 
                selectedTransactions.has(trans.id)
            );
            
            checkbox.checked = todosVisivelSelecionados && filteredTransactions.length > 0;
        }

        function excluirSelecionados() {
            if (selectedTransactions.size === 0) {
                alert('Nenhuma transação selecionada!');
                return;
            }

            const count = selectedTransactions.size;
            if (confirm(`Deseja realmente excluir ${count} transação(ões) selecionada(s)?`)) {
                // Filtrar transações mantendo apenas as não selecionadas
                transactions = transactions.filter(trans => !selectedTransactions.has(trans.id));
                
                salvarDados();
                selectedTransactions.clear();
                filteredTransactions = [...transactions];
                filtrarPorPeriodo(filtroAtivo);
                
                alert(`${count} transação(ões) excluída(s) com sucesso!`);
            }
        }

        function atualizarInterface() {
            atualizarEstatisticas();
            atualizarTabela();
            atualizarGraficos();
            atualizarMetas();
            atualizarOrcamentos();
        }

        function atualizarGraficos() {
            atualizarGraficoCategoria();
            atualizarGraficoTipo();
            atualizarGraficoGastos();
            atualizarGraficoFormasPagamento();
            atualizarGraficoTendencias();
            atualizarResumoPeriodo();
        }

        function atualizarGraficoCategoria() {
            const ctx = document.getElementById('categoryChart');
            if (!ctx) return;

            // Calcular total por categoria
            const categorias = {};
            filteredTransactions.forEach(trans => {
                if (!categorias[trans.categoria]) {
                    categorias[trans.categoria] = 0;
                }
                categorias[trans.categoria] += trans.valor;
            });

            const labels = Object.keys(categorias);
            const data = Object.values(categorias);
            
            const cores = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
                '#36A2EB', '#FFCE56', '#9966FF'
            ];

            if (categoryChart) {
                categoryChart.destroy();
            }

            if (labels.length === 0) {
                return;
            }

            categoryChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: cores.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ' + formatarMoeda(value) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarGraficoTipo() {
            const ctx = document.getElementById('typeChart');
            if (!ctx) return;

            let totalEntradas = 0;
            let totalSaidas = 0;

            filteredTransactions.forEach(trans => {
                if (trans.tipo === 'entrada') {
                    totalEntradas += trans.valor;
                } else {
                    totalSaidas += trans.valor;
                }
            });

            if (typeChart) {
                typeChart.destroy();
            }

            if (totalEntradas === 0 && totalSaidas === 0) {
                return;
            }

            typeChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Entradas', 'Saídas'],
                    datasets: [{
                        data: [totalEntradas, totalSaidas],
                        backgroundColor: ['#38ef7d', '#f45c43'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ' + formatarMoeda(value) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarGraficoGastos() {
            const ctx = document.getElementById('expenseChart');
            if (!ctx) return;

            // Calcular apenas saídas por categoria
            const categorias = {};
            filteredTransactions.forEach(trans => {
                if (trans.tipo === 'saida') {
                    if (!categorias[trans.categoria]) {
                        categorias[trans.categoria] = 0;
                    }
                    categorias[trans.categoria] += trans.valor;
                }
            });

            const labels = Object.keys(categorias);
            const data = Object.values(categorias);
            
            const cores = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
                '#36A2EB', '#FFCE56', '#9966FF'
            ];

            if (expenseChart) {
                expenseChart.destroy();
            }

            if (labels.length === 0) {
                return;
            }

            expenseChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: cores.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: window.innerWidth < 768 ? 'bottom' : 'right',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ' + formatarMoeda(value) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarGraficoFormasPagamento() {
            const ctx = document.getElementById('paymentChart');
            if (!ctx) return;

            // Calcular total por forma de pagamento
            const formasPagamento = {};
            filteredTransactions.forEach(trans => {
                const forma = trans.formaPagamento || 'Dinheiro';
                if (!formasPagamento[forma]) {
                    formasPagamento[forma] = 0;
                }
                formasPagamento[forma] += trans.valor;
            });

            const labels = Object.keys(formasPagamento);
            const data = Object.values(formasPagamento);
            
            const cores = {
                'Dinheiro': '#4CAF50',
                'PIX': '#2196F3',
                'Débito': '#FF9800',
                'Crédito': '#F44336',
                'Crediário': '#9C27B0'
            };

            const backgroundColors = labels.map(label => cores[label] || '#757575');

            if (paymentChart) {
                paymentChart.destroy();
            }

            if (labels.length === 0) {
                return;
            }

            paymentChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ' + formatarMoeda(value) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarGraficoTendencias() {
            const ctx = document.getElementById('trendChart');
            if (!ctx) return;

            // Pegar últimos 30 dias
            const hoje = new Date();
            const trintaDiasAtras = new Date(hoje);
            trintaDiasAtras.setDate(hoje.getDate() - 30);

            // Agrupar transações por data
            const transacoesPorDia = {};
            transactions.forEach(trans => {
                const dataTransacao = new Date(trans.data);
                if (dataTransacao >= trintaDiasAtras && dataTransacao <= hoje) {
                    const dataStr = trans.data;
                    if (!transacoesPorDia[dataStr]) {
                        transacoesPorDia[dataStr] = { entradas: 0, saidas: 0 };
                    }
                    if (trans.tipo === 'entrada') {
                        transacoesPorDia[dataStr].entradas += trans.valor;
                    } else {
                        transacoesPorDia[dataStr].saidas += trans.valor;
                    }
                }
            });

            // Criar array de datas e valores
            const datasOrdenadas = Object.keys(transacoesPorDia).sort();
            const labels = datasOrdenadas.map(data => formatarData(data));
            const dataEntradas = datasOrdenadas.map(data => transacoesPorDia[data].entradas);
            const dataSaidas = datasOrdenadas.map(data => transacoesPorDia[data].saidas);

            if (trendChart) {
                trendChart.destroy();
            }

            if (datasOrdenadas.length === 0) {
                return;
            }

            trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Entradas',
                            data: dataEntradas,
                            borderColor: '#38ef7d',
                            backgroundColor: 'rgba(56, 239, 125, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Saídas',
                            data: dataSaidas,
                            borderColor: '#f45c43',
                            backgroundColor: 'rgba(244, 92, 67, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatarMoeda(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
        }

        function atualizarResumoPeriodo() {
            const resumoDiv = document.getElementById('resumoPeriodo');
            
            let totalEntradas = 0;
            let totalSaidas = 0;
            let totalTransacoes = filteredTransactions.length;
            
            filteredTransactions.forEach(trans => {
                if (trans.tipo === 'entrada') {
                    totalEntradas += trans.valor;
                } else {
                    totalSaidas += trans.valor;
                }
            });
            
            const saldo = totalEntradas - totalSaidas;
            const mediaDiaria = totalSaidas / (totalTransacoes > 0 ? Math.max(1, totalTransacoes) : 1);
            
            if (totalTransacoes === 0) {
                resumoDiv.innerHTML = '<p class="has-text-centered">Nenhuma transação neste período</p>';
                return;
            }
            
            resumoDiv.innerHTML = `
                <div class="content">
                    <table class="table is-fullwidth is-narrow">
                        <tbody>
                            <tr>
                                <td><strong><i class="fas fa-list"></i> Total de Transações:</strong></td>
                                <td class="has-text-right">${totalTransacoes}</td>
                            </tr>
                            <tr>
                                <td><strong><i class="fas fa-arrow-up has-text-success"></i> Entradas:</strong></td>
                                <td class="has-text-right has-text-success">${formatarMoeda(totalEntradas)}</td>
                            </tr>
                            <tr>
                                <td><strong><i class="fas fa-arrow-down has-text-danger"></i> Saídas:</strong></td>
                                <td class="has-text-right has-text-danger">${formatarMoeda(totalSaidas)}</td>
                            </tr>
                            <tr>
                                <td><strong><i class="fas fa-balance-scale"></i> Saldo:</strong></td>
                                <td class="has-text-right ${saldo >= 0 ? 'has-text-success' : 'has-text-danger'}">${formatarMoeda(saldo)}</td>
                            </tr>
                            <tr>
                                <td><strong><i class="fas fa-chart-line"></i> Média de Gastos:</strong></td>
                                <td class="has-text-right">${formatarMoeda(mediaDiaria)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        function atualizarEstatisticas() {
            let totalEntradas = 0;
            let totalSaidas = 0;

            filteredTransactions.forEach(trans => {
                if (trans.tipo === 'entrada') {
                    totalEntradas += trans.valor;
                } else {
                    totalSaidas += trans.valor;
                }
            });

            const saldo = totalEntradas - totalSaidas;

            document.getElementById('totalEntradas').textContent = formatarMoeda(totalEntradas);
            document.getElementById('totalSaidas').textContent = formatarMoeda(totalSaidas);
            document.getElementById('saldoTotal').textContent = formatarMoeda(saldo);
        }

        function atualizarTabela() {
            const tbody = document.getElementById('transactionsTable');
            const selectAllContainer = document.getElementById('selectAllContainer');
            
            if (filteredTransactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="has-text-centered">Nenhuma transação encontrada neste período</td></tr>';
                selectAllContainer.style.display = 'none';
                return;
            }

            selectAllContainer.style.display = 'flex';

            // Sort by date (most recent first)
            const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.data) - new Date(a.data));

            tbody.innerHTML = sortedTransactions.map((trans, index) => {
                const originalIndex = transactions.findIndex(t => t.id === trans.id);
                const classType = trans.tipo === 'entrada' ? 'transaction-entrada' : 'transaction-saida';
                const typeIcon = trans.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down';
                const typeColor = trans.tipo === 'entrada' ? 'has-text-success' : 'has-text-danger';
                const formaPagamento = trans.formaPagamento || 'Dinheiro';
                const isSelected = selectedTransactions.has(trans.id);
                
                // Ícones para formas de pagamento
                const paymentIcons = {
                    'Dinheiro': '💵',
                    'PIX': '📱',
                    'Débito': '💳',
                    'Crédito': '💳',
                    'Crediário': '📋'
                };
                
                return `
                    <tr class="${classType}">
                        <td>
                            <input type="checkbox" 
                                   class="transaction-checkbox" 
                                   ${isSelected ? 'checked' : ''} 
                                   onchange="toggleSelection(${trans.id})">
                        </td>
                        <td>${formatarData(trans.data)}</td>
                        <td>${trans.descricao}</td>
                        <td><span class="tag">${trans.categoria}</span></td>
                        <td><span class="tag is-light">${paymentIcons[formaPagamento] || ''} ${formaPagamento}</span></td>
                        <td>
                            <span class="icon ${typeColor}">
                                <i class="fas ${typeIcon}"></i>
                            </span>
                            ${trans.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </td>
                        <td class="${typeColor}"><strong>${formatarMoeda(trans.valor)}</strong></td>
                        <td>
                            <span class="icon edit-btn" onclick="openModal('edit', ${originalIndex})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');

            atualizarCheckboxSelectAll();
        }

        function formatarMoeda(valor) {
            return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        function formatarData(data) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }

        function exportarCSV() {
            if (transactions.length === 0) {
                alert('Não há transações para exportar!');
                return;
            }

            const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Valor'];
            const csvContent = [
                headers.join(','),
                ...transactions.map(trans => 
                    [trans.data, trans.tipo, `"${trans.descricao}"`, trans.categoria, trans.formaPagamento || 'Dinheiro', trans.valor].join(',')
                )
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        }

        function exportarExcel() {
            if (transactions.length === 0) {
                alert('Não há transações para exportar!');
                return;
            }

            const data = transactions.map(trans => ({
                'Data': formatarData(trans.data),
                'Tipo': trans.tipo === 'entrada' ? 'Entrada' : 'Saída',
                'Descrição': trans.descricao,
                'Categoria': trans.categoria,
                'Forma de Pagamento': trans.formaPagamento || 'Dinheiro',
                'Valor': trans.valor
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Transações');

            XLSX.writeFile(wb, `financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
        }

        function importarArquivo(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.csv')) {
                reader.onload = function(e) {
                    importarCSV(e.target.result);
                };
                reader.readAsText(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                reader.onload = function(e) {
                    importarExcel(e.target.result);
                };
                reader.readAsArrayBuffer(file);
            } else {
                alert('Formato de arquivo não suportado! Use CSV ou Excel.');
            }

            event.target.value = '';
        }

        function importarCSV(content) {
            const lines = content.split('\n');
            const newTransactions = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const matches = line.match(/([^,]+),([^,]+),"([^"]+)",([^,]+),([^,]+),([^,]+)/);
                if (matches) {
                    const [, data, tipo, descricao, categoria, formaPagamento, valor] = matches;
                    newTransactions.push({
                        data: data.trim(),
                        tipo: tipo.trim(),
                        descricao: descricao.trim(),
                        categoria: categoria.trim(),
                        formaPagamento: formaPagamento.trim(),
                        valor: parseFloat(valor.trim()),
                        id: Date.now() + i
                    });
                }
            }

            if (newTransactions.length > 0) {
                transactions.push(...newTransactions);
                salvarDados();
                filteredTransactions = [...transactions];
                filtrarPorPeriodo(filtroAtivo);
                alert(`${newTransactions.length} transação(ões) importada(s) com sucesso!`);
            } else {
                alert('Nenhuma transação válida encontrada no arquivo!');
            }
        }

        function importarExcel(data) {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet);

            const newTransactions = rows.map((row, index) => {
                // Parse date from DD/MM/YYYY to YYYY-MM-DD
                let dataFormatada = row.Data || '';
                if (dataFormatada.includes('/')) {
                    const [dia, mes, ano] = dataFormatada.split('/');
                    dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                }

                return {
                    data: dataFormatada,
                    tipo: (row.Tipo || '').toLowerCase().includes('entrada') ? 'entrada' : 'saida',
                    descricao: row.Descrição || row['Descricao'] || '',
                    categoria: row.Categoria || 'Outros',
                    formaPagamento: row['Forma de Pagamento'] || 'Dinheiro',
                    valor: parseFloat(row.Valor) || 0,
                    id: Date.now() + index
                };
            }).filter(trans => trans.descricao && trans.valor > 0);

            if (newTransactions.length > 0) {
                transactions.push(...newTransactions);
                salvarDados();
                filteredTransactions = [...transactions];
                filtrarPorPeriodo(filtroAtivo);
                alert(`${newTransactions.length} transação(ões) importada(s) com sucesso!`);
            } else {
                alert('Nenhuma transação válida encontrada no arquivo!');
            }
        }

        function limparDados() {
            if (confirm('Deseja realmente excluir TODAS as transações? Esta ação não pode ser desfeita!')) {
                transactions = [];
                filteredTransactions = [];
                selectedTransactions.clear();
                salvarDados();
                filtrarPorPeriodo('todos');
                alert('Todos os dados foram excluídos!');
            }
        }

        // ===== DARK MODE =====
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            const icon = document.getElementById('darkModeIcon');
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }

        function carregarDarkMode() {
            const isDark = localStorage.getItem('darkMode') === 'true';
            if (isDark) {
                document.body.classList.add('dark-mode');
                const icon = document.getElementById('darkModeIcon');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }

        // ===== BUSCA =====
        function buscarTransacoes() {
            searchTerm = document.getElementById('searchInput').value.toLowerCase();
            aplicarFiltros();
        }

        function aplicarFiltros() {
            // Primeiro aplica o filtro de período
            let transacoesFiltradas = [...transactions];
            
            // Aplicar filtro de período
            if (filtroAtivo !== 'todos') {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                
                switch(filtroAtivo) {
                    case 'hoje':
                        const dataHoje = hoje.toISOString().split('T')[0];
                        transacoesFiltradas = transacoesFiltradas.filter(t => {
                            return t.data === dataHoje;
                        });
                        break;
                    case 'semana':
                        const inicioSemana = new Date(hoje);
                        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                        const fimSemana = new Date(inicioSemana);
                        fimSemana.setDate(inicioSemana.getDate() + 6);
                        
                        const dataInicioSemana = inicioSemana.toISOString().split('T')[0];
                        const dataFimSemana = fimSemana.toISOString().split('T')[0];
                        
                        transacoesFiltradas = transacoesFiltradas.filter(t => {
                            return t.data >= dataInicioSemana && t.data <= dataFimSemana;
                        });
                        break;
                    case 'mes':
                        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                        
                        const dataInicioMes = inicioMes.toISOString().split('T')[0];
                        const dataFimMes = fimMes.toISOString().split('T')[0];
                        
                        transacoesFiltradas = transacoesFiltradas.filter(t => {
                            return t.data >= dataInicioMes && t.data <= dataFimMes;
                        });
                        break;
                    case 'ano':
                        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
                        const fimAno = new Date(hoje.getFullYear(), 11, 31);
                        
                        const dataInicioAno = inicioAno.toISOString().split('T')[0];
                        const dataFimAno = fimAno.toISOString().split('T')[0];
                        
                        transacoesFiltradas = transacoesFiltradas.filter(t => {
                            return t.data >= dataInicioAno && t.data <= dataFimAno;
                        });
                        break;
                    case 'customizado':
                        const dataInicial = document.getElementById('dataInicial').value;
                        const dataFinal = document.getElementById('dataFinal').value;
                        if (dataInicial && dataFinal) {
                            transacoesFiltradas = transacoesFiltradas.filter(t => {
                                return t.data >= dataInicial && t.data <= dataFinal;
                            });
                        }
                        break;
                }
            }
            
            // Aplicar busca por texto
            if (searchTerm) {
                transacoesFiltradas = transacoesFiltradas.filter(t => 
                    t.descricao.toLowerCase().includes(searchTerm) ||
                    t.categoria.toLowerCase().includes(searchTerm) ||
                    (t.formaPagamento && t.formaPagamento.toLowerCase().includes(searchTerm))
                );
            }
            
            filteredTransactions = transacoesFiltradas;
            atualizarInterface();
            atualizarResumoCalculadoPeriodo();
        }

        function atualizarResumoCalculadoPeriodo() {
            const resumoDiv = document.getElementById('periodoResumo');
            
            // Mostrar apenas quando não for "todos"
            if (filtroAtivo === 'todos') {
                resumoDiv.style.display = 'none';
                return;
            }
            
            resumoDiv.style.display = 'block';
            
            // Calcular totais do período filtrado
            let totalEntradas = 0;
            let totalSaidas = 0;
            let totalTransacoes = filteredTransactions.length;
            
            filteredTransactions.forEach(trans => {
                if (trans.tipo === 'entrada') {
                    totalEntradas += trans.valor;
                } else {
                    totalSaidas += trans.valor;
                }
            });
            
            const saldo = totalEntradas - totalSaidas;
            
            // Atualizar valores na interface
            document.getElementById('periodoEntradas').textContent = formatarMoeda(totalEntradas);
            document.getElementById('periodoSaidas').textContent = formatarMoeda(totalSaidas);
            document.getElementById('periodoSaldo').textContent = formatarMoeda(saldo);
            document.getElementById('periodoTransacoes').textContent = totalTransacoes;
            
            // Adicionar classe de cor ao saldo
            const saldoCard = document.getElementById('periodoSaldoCard');
            saldoCard.classList.remove('positivo', 'negativo');
            if (saldo > 0) {
                saldoCard.classList.add('positivo');
            } else if (saldo < 0) {
                saldoCard.classList.add('negativo');
            }
        }

        // ===== METAS FINANCEIRAS =====
        function openModalMetas() {
            document.getElementById('metasModal').classList.add('is-active');
        }

        function closeModalMetas() {
            document.getElementById('metasModal').classList.remove('is-active');
            document.getElementById('metaNome').value = '';
            document.getElementById('metaValor').value = '';
            document.getElementById('metaData').value = '';
        }

        function salvarMeta() {
            const nome = document.getElementById('metaNome').value.trim();
            const valor = parseFloat(document.getElementById('metaValor').value);
            const data = document.getElementById('metaData').value;

            if (!nome || !valor || valor <= 0 || !data) {
                alert('Por favor, preencha todos os campos corretamente!');
                return;
            }

            metas.push({
                id: Date.now(),
                nome,
                valorMeta: valor,
                valorAtual: 0,
                data,
                dataLimite: data
            });

            localStorage.setItem('financialGoals', JSON.stringify(metas));
            atualizarMetas();
            closeModalMetas();
        }

        function atualizarMetas() {
            const container = document.getElementById('metasContainer');
            
            if (metas.length === 0) {
                container.innerHTML = '<p class="has-text-centered has-text-grey">Nenhuma meta definida. Clique em "Metas" para adicionar.</p>';
                return;
            }

            // Calcular valor atual baseado em entradas
            const totalEntradas = filteredTransactions
                .filter(t => t.tipo === 'entrada')
                .reduce((sum, t) => sum + t.valor, 0);

            container.innerHTML = metas.map((meta, index) => {
                const progresso = Math.min((totalEntradas / meta.valorMeta) * 100, 100);
                const corBarra = progresso >= 100 ? 'is-success' : progresso >= 70 ? 'is-warning' : 'is-danger';
                
                return `
                    <div class="goal-card box">
                        <div class="is-flex is-justify-content-space-between is-align-items-center">
                            <div>
                                <strong>${meta.nome}</strong>
                                <p class="is-size-7 has-text-grey">Meta: ${formatarMoeda(meta.valorMeta)} até ${formatarData(meta.dataLimite)}</p>
                            </div>
                            <button class="delete" onclick="deletarMeta(${index})"></button>
                        </div>
                        <div class="goal-progress-container">
                            <div class="progress-info">
                                <span>${formatarMoeda(totalEntradas)}</span>
                                <span>${progresso.toFixed(1)}%</span>
                            </div>
                            <progress class="progress ${corBarra}" value="${progresso}" max="100">${progresso}%</progress>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function deletarMeta(index) {
            if (confirm('Deseja realmente excluir esta meta?')) {
                metas.splice(index, 1);
                localStorage.setItem('financialGoals', JSON.stringify(metas));
                atualizarMetas();
            }
        }

        // ===== ORÇAMENTO =====
        function openModalOrcamento() {
            document.getElementById('orcamentoModal').classList.add('is-active');
        }

        function closeModalOrcamento() {
            document.getElementById('orcamentoModal').classList.remove('is-active');
        }

        function salvarOrcamento() {
            const categoria = document.getElementById('orcamentoCategoria').value;
            const valor = parseFloat(document.getElementById('orcamentoValor').value);

            if (!valor || valor <= 0) {
                alert('Por favor, insira um valor válido!');
                return;
            }

            orcamentos[categoria] = valor;
            localStorage.setItem('financialBudgets', JSON.stringify(orcamentos));
            atualizarOrcamentos();
            closeModalOrcamento();
        }

        function atualizarOrcamentos() {
            const container = document.getElementById('orcamentoContainer');
            
            if (Object.keys(orcamentos).length === 0) {
                container.innerHTML = '<p class="has-text-centered has-text-grey">Nenhum orçamento definido. Clique em "Orçamento" para configurar.</p>';
                return;
            }

            // Calcular gastos por categoria no mês atual
            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

            const gastosPorCategoria = {};
            transactions.forEach(trans => {
                const dataTransacao = new Date(trans.data);
                if (trans.tipo === 'saida' && dataTransacao >= inicioMes && dataTransacao <= fimMes) {
                    if (!gastosPorCategoria[trans.categoria]) {
                        gastosPorCategoria[trans.categoria] = 0;
                    }
                    gastosPorCategoria[trans.categoria] += trans.valor;
                }
            });

            container.innerHTML = Object.entries(orcamentos).map(([categoria, limite]) => {
                const gasto = gastosPorCategoria[categoria] || 0;
                const porcentagem = (gasto / limite) * 100;
                const corBarra = porcentagem >= 100 ? 'is-danger' : porcentagem >= 80 ? 'is-warning' : 'is-success';
                const corTexto = porcentagem >= 100 ? 'has-text-danger' : porcentagem >= 80 ? 'has-text-warning' : 'has-text-success';
                
                return `
                    <div class="box mb-2">
                        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                            <strong>${categoria}</strong>
                            <button class="delete is-small" onclick="deletarOrcamento('${categoria}')"></button>
                        </div>
                        <div class="progress-info">
                            <span class="${corTexto}">${formatarMoeda(gasto)} / ${formatarMoeda(limite)}</span>
                            <span class="${corTexto}">${porcentagem.toFixed(0)}%</span>
                        </div>
                        <progress class="progress ${corBarra}" value="${porcentagem}" max="100">${porcentagem}%</progress>
                        ${porcentagem >= 100 ? '<p class="has-text-danger is-size-7 mt-1"><i class="fas fa-exclamation-triangle"></i> Orçamento excedido!</p>' : ''}
                        ${porcentagem >= 80 && porcentagem < 100 ? '<p class="has-text-warning is-size-7 mt-1"><i class="fas fa-exclamation-circle"></i> Atenção ao limite!</p>' : ''}
                    </div>
                `;
            }).join('');
        }

        function deletarOrcamento(categoria) {
            if (confirm(`Deseja realmente excluir o orçamento de ${categoria}?`)) {
                delete orcamentos[categoria];
                localStorage.setItem('financialBudgets', JSON.stringify(orcamentos));
                atualizarOrcamentos();
            }
        }

        // ===== EXPORTAR PDF =====
        function exportarPDF() {
            if (transactions.length === 0) {
                alert('Não há transações para exportar!');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Título
            doc.setFontSize(20);
            doc.text('Relatório Financeiro', 105, 15, { align: 'center' });

            // Data do relatório
            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 22, { align: 'center' });

            // Resumo
            let totalEntradas = 0;
            let totalSaidas = 0;
            filteredTransactions.forEach(trans => {
                if (trans.tipo === 'entrada') {
                    totalEntradas += trans.valor;
                } else {
                    totalSaidas += trans.valor;
                }
            });
            const saldo = totalEntradas - totalSaidas;

            doc.setFontSize(12);
            doc.text('Resumo Financeiro:', 14, 32);
            doc.setFontSize(10);
            doc.text(`Total de Entradas: R$ ${totalEntradas.toFixed(2)}`, 14, 38);
            doc.text(`Total de Saídas: R$ ${totalSaidas.toFixed(2)}`, 14, 44);
            doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 14, 50);

            // Tabela de transações
            const tableData = filteredTransactions.map(trans => [
                formatarData(trans.data),
                trans.tipo === 'entrada' ? 'Entrada' : 'Saída',
                trans.descricao,
                trans.categoria,
                trans.formaPagamento || 'Dinheiro',
                `R$ ${trans.valor.toFixed(2)}`
            ]);

            doc.autoTable({
                startY: 58,
                head: [['Data', 'Tipo', 'Descrição', 'Categoria', 'Pagamento', 'Valor']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [102, 126, 234] },
                styles: { fontSize: 8 },
                columnStyles: {
                    5: { halign: 'right' }
                }
            });

            // Salvar PDF
            doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
        }
    