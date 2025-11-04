
        let transactions = [];
        let editingIndex = -1;
        let categoryChart = null;
        let typeChart = null;
        let expenseChart = null;
        let paymentChart = null;
        let trendChart = null;
        let paymentComparisonChart = null;
        let filteredTransactions = [];
        let filtroAtivo = 'todos';
        let metas = [];
        let orcamentos = {};
        let searchTerm = '';
        let calendarioMesAtual = new Date();
        let periodoNavegacao = {
            tipo: 'todos',
            data: new Date()
        };

        // Load data on page load
        window.onload = function() {
            carregarDados();
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            document.getElementById('data').value = dataHoje;
            carregarDarkMode();
            renderizarCalendario();
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

        function navegarPeriodo(direcao) {
            const tipo = periodoNavegacao.tipo;
            const data = new Date(periodoNavegacao.data);
            
            switch(tipo) {
                case 'hoje':
                case 'ontem':
                    data.setDate(data.getDate() + direcao);
                    periodoNavegacao.data = data;
                    filtrarPorDataEspecifica(data);
                    break;
                case 'semana':
                case 'semana-passada':
                    data.setDate(data.getDate() + (7 * direcao));
                    periodoNavegacao.data = data;
                    filtrarPorSemana(data);
                    break;
                case 'mes':
                case 'mes-passado':
                    data.setMonth(data.getMonth() + direcao);
                    periodoNavegacao.data = data;
                    filtrarPorMes(data);
                    break;
                case 'ano':
                case 'ano-passado':
                    data.setFullYear(data.getFullYear() + direcao);
                    periodoNavegacao.data = data;
                    filtrarPorAno(data);
                    break;
                default:
                    return;
            }
        }

        function filtrarPorPeriodo(periodo) {
            filtroAtivo = periodo;
            periodoNavegacao.tipo = periodo;
            periodoNavegacao.data = new Date();
            
            // Remover classe active de todos os botões
            document.querySelectorAll('.filtro-periodo-btn').forEach(btn => btn.classList.remove('is-active'));
            const btn = document.getElementById(`btn-${periodo}`);
            if (btn) btn.classList.add('is-active');
            
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            switch(periodo) {
                case 'todos':
                    filteredTransactions = [...transactions];
                    document.getElementById('periodoAtivo').innerHTML = '<i class="fas fa-info-circle"></i> &nbsp; Exibindo todas as transações';
                    document.getElementById('periodoAtualDisplay').textContent = 'Todos os Períodos';
                    break;
                case 'hoje':
                    filtrarPorDataEspecifica(hoje);
                    break;
                case 'ontem':
                    const ontem = new Date(hoje);
                    ontem.setDate(hoje.getDate() - 1);
                    filtrarPorDataEspecifica(ontem);
                    break;
                case 'semana':
                    filtrarPorSemana(hoje);
                    break;
                case 'semana-passada':
                    const semanaPassada = new Date(hoje);
                    semanaPassada.setDate(hoje.getDate() - 7);
                    filtrarPorSemana(semanaPassada);
                    break;
                case 'mes':
                    filtrarPorMes(hoje);
                    break;
                case 'mes-passado':
                    const mesPassado = new Date(hoje);
                    mesPassado.setMonth(hoje.getMonth() - 1);
                    filtrarPorMes(mesPassado);
                    break;
                case 'ano':
                    filtrarPorAno(hoje);
                    break;
                case 'ano-passado':
                    const anoPassado = new Date(hoje);
                    anoPassado.setFullYear(hoje.getFullYear() - 1);
                    filtrarPorAno(anoPassado);
                    break;
                case 'ultimos-7-dias':
                    filtrarUltimosDias(7);
                    break;
                case 'ultimos-30-dias':
                    filtrarUltimosDias(30);
                    break;
                case 'ultimos-90-dias':
                    filtrarUltimosDias(90);
                    break;
            }
            
            // Limpar inputs de data customizada
            document.getElementById('dataInicial').value = '';
            document.getElementById('dataFinal').value = '';
            
            atualizarInterface();
            atualizarResumoCalculadoPeriodo();
            renderizarCalendario();
        }

        function filtrarPorDataEspecifica(data) {
            const dataStr = data.toISOString().split('T')[0];
            filteredTransactions = transactions.filter(t => t.data === dataStr);
            
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-day"></i> &nbsp; ${formatarData(dataStr)}`;
            document.getElementById('periodoAtualDisplay').textContent = formatarData(dataStr);
        }

        function filtrarPorSemana(data) {
            const inicio = new Date(data);
            inicio.setDate(data.getDate() - data.getDay());
            const fim = new Date(inicio);
            fim.setDate(inicio.getDate() + 6);
            
            const dataInicio = inicio.toISOString().split('T')[0];
            const dataFim = fim.toISOString().split('T')[0];
            
            filteredTransactions = transactions.filter(t => t.data >= dataInicio && t.data <= dataFim);
            
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-week"></i> &nbsp; Semana: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
            document.getElementById('periodoAtualDisplay').textContent = `Semana: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
        }

        function filtrarPorMes(data) {
            const inicio = new Date(data.getFullYear(), data.getMonth(), 1);
            const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0);
            
            const dataInicio = inicio.toISOString().split('T')[0];
            const dataFim = fim.toISOString().split('T')[0];
            
            filteredTransactions = transactions.filter(t => t.data >= dataInicio && t.data <= dataFim);
            
            const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-alt"></i> &nbsp; ${meses[data.getMonth()]} de ${data.getFullYear()}`;
            document.getElementById('periodoAtualDisplay').textContent = `${meses[data.getMonth()]} ${data.getFullYear()}`;
        }

        function filtrarPorAno(data) {
            const inicio = new Date(data.getFullYear(), 0, 1);
            const fim = new Date(data.getFullYear(), 11, 31);
            
            const dataInicio = inicio.toISOString().split('T')[0];
            const dataFim = fim.toISOString().split('T')[0];
            
            filteredTransactions = transactions.filter(t => t.data >= dataInicio && t.data <= dataFim);
            
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar"></i> &nbsp; Ano de ${data.getFullYear()}`;
            document.getElementById('periodoAtualDisplay').textContent = `Ano ${data.getFullYear()}`;
        }

        function filtrarUltimosDias(dias) {
            const hoje = new Date();
            const dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - dias);
            
            const dataInicioStr = dataInicio.toISOString().split('T')[0];
            const dataFimStr = hoje.toISOString().split('T')[0];
            
            filteredTransactions = transactions.filter(t => t.data >= dataInicioStr && t.data <= dataFimStr);
            
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-history"></i> &nbsp; Últimos ${dias} dias`;
            document.getElementById('periodoAtualDisplay').textContent = `Últimos ${dias} dias`;
        }

        function filtrarPorPeriodoCustomizado() {
            const dataInicial = document.getElementById('dataInicial').value;
            const dataFinal = document.getElementById('dataFinal').value;
            
            if (!dataInicial || !dataFinal) return;
            
            filtroAtivo = 'customizado';
            periodoNavegacao.tipo = 'customizado';
            
            // Remover classe active de todos os botões
            document.querySelectorAll('.filtro-periodo-btn').forEach(btn => btn.classList.remove('is-active'));
            
            filteredTransactions = transactions.filter(t => t.data >= dataInicial && t.data <= dataFinal);
            
            document.getElementById('periodoAtivo').innerHTML = `<i class="fas fa-calendar-alt"></i> &nbsp; Período: ${formatarData(dataInicial)} a ${formatarData(dataFinal)}`;
            document.getElementById('periodoAtualDisplay').textContent = `${formatarData(dataInicial)} a ${formatarData(dataFinal)}`;
            
            atualizarInterface();
            atualizarResumoCalculadoPeriodo();
            renderizarCalendario();
        }

        // ===== CALENDÁRIO =====
        function renderizarCalendario() {
            const container = document.getElementById('calendarioContainer');
            const mes = calendarioMesAtual.getMonth();
            const ano = calendarioMesAtual.getFullYear();
            
            const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            document.getElementById('calendarioMes').textContent = `${meses[mes]} ${ano}`;
            
            const primeiroDia = new Date(ano, mes, 1).getDay();
            const ultimoDia = new Date(ano, mes + 1, 0).getDate();
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            
            // Criar mapa de transações por data
            const transacoesPorData = {};
            transactions.forEach(trans => {
                if (!transacoesPorData[trans.data]) {
                    transacoesPorData[trans.data] = [];
                }
                transacoesPorData[trans.data].push(trans);
            });
            
            let html = '<div class="calendario-grid">';
            
            // Dias da semana
            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            diasSemana.forEach(dia => {
                html += `<div class="calendario-dia-semana">${dia}</div>`;
            });
            
            // Dias vazios antes do primeiro dia
            for (let i = 0; i < primeiroDia; i++) {
                html += '<div class="calendario-dia vazio"></div>';
            }
            
            // Dias do mês
            for (let dia = 1; dia <= ultimoDia; dia++) {
                const dataAtual = new Date(ano, mes, dia);
                const dataStr = dataAtual.toISOString().split('T')[0];
                const ehHoje = dataStr === dataHoje;
                const temTransacao = transacoesPorData[dataStr] && transacoesPorData[dataStr].length > 0;
                
                let classes = 'calendario-dia';
                if (ehHoje) classes += ' hoje';
                if (temTransacao) classes += ' tem-transacao';
                
                html += `<div class="${classes}" onclick="selecionarDiaCalendario('${dataStr}')" title="${temTransacao ? transacoesPorData[dataStr].length + ' transação(ões)' : 'Sem transações'}">${dia}</div>`;
            }
            
            html += '</div>';
            container.innerHTML = html;
        }

        function navegarCalendario(direcao) {
            calendarioMesAtual.setMonth(calendarioMesAtual.getMonth() + direcao);
            renderizarCalendario();
        }

        function selecionarDiaCalendario(data) {
            const dataObj = new Date(data + 'T12:00:00');
            periodoNavegacao.tipo = 'dia';
            periodoNavegacao.data = dataObj;
            filtroAtivo = 'dia';
            
            // Remover classe active de todos os botões
            document.querySelectorAll('.filtro-periodo-btn').forEach(btn => btn.classList.remove('is-active'));
            
            filtrarPorDataEspecifica(dataObj);
            atualizarInterface();
            atualizarResumoCalculadoPeriodo();
            renderizarCalendario();
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
            renderizarCalendario();
            closeModal();
        }

        function deletarTransacao(index) {
            if (confirm('Deseja realmente excluir esta transação?')) {
                transactions.splice(index, 1);
                salvarDados();
                filteredTransactions = [...transactions];
                filtrarPorPeriodo(filtroAtivo);
                renderizarCalendario();
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
            atualizarAnaliseFormasPagamento();
        }

        function atualizarGraficoCategoria() {
            const ctx = document.getElementById('categoryChart');
            if (!ctx) return;

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

            const hoje = new Date();
            const trintaDiasAtras = new Date(hoje);
            trintaDiasAtras.setDate(hoje.getDate() - 30);

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
            
            if (filteredTransactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="has-text-centered">Nenhuma transação encontrada neste período</td></tr>';
                return;
            }

            const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.data) - new Date(a.data));

            tbody.innerHTML = sortedTransactions.map((trans, index) => {
                const originalIndex = transactions.findIndex(t => t.id === trans.id);
                const classType = trans.tipo === 'entrada' ? 'transaction-entrada' : 'transaction-saida';
                const typeIcon = trans.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down';
                const typeColor = trans.tipo === 'entrada' ? 'has-text-success' : 'has-text-danger';
                const formaPagamento = trans.formaPagamento || 'Dinheiro';
                
                const paymentIcons = {
                    'Dinheiro': '💵',
                    'PIX': '📱',
                    'Débito': '💳',
                    'Crédito': '💳',
                    'Crediário': '📋'
                };
                
                return `
                    <tr class="${classType}">
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
                            <span class="icon delete-btn" onclick="deletarTransacao(${originalIndex})" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
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
                renderizarCalendario();
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
                renderizarCalendario();
                alert(`${newTransactions.length} transação(ões) importada(s) com sucesso!`);
            } else {
                alert('Nenhuma transação válida encontrada no arquivo!');
            }
        }

        function limparDados() {
            if (confirm('Deseja realmente excluir TODAS as transações? Esta ação não pode ser desfeita!')) {
                transactions = [];
                filteredTransactions = [];
                salvarDados();
                filtrarPorPeriodo('todos');
                renderizarCalendario();
                alert('Todos os dados foram excluídos!');
            }
        }

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

        function buscarTransacoes() {
            searchTerm = document.getElementById('searchInput').value.toLowerCase();
            aplicarFiltros();
        }

        function aplicarFiltros() {
            let transacoesFiltradas = [...transactions];
            
            if (filtroAtivo !== 'todos') {
                transacoesFiltradas = filteredTransactions;
            }
            
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
            
            if (filtroAtivo === 'todos') {
                resumoDiv.style.display = 'none';
                return;
            }
            
            resumoDiv.style.display = 'block';
            
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
            
            document.getElementById('periodoEntradas').textContent = formatarMoeda(totalEntradas);
            document.getElementById('periodoSaidas').textContent = formatarMoeda(totalSaidas);
            document.getElementById('periodoSaldo').textContent = formatarMoeda(saldo);
            document.getElementById('periodoTransacoes').textContent = totalTransacoes;
            
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

        // ===== ANÁLISE DE FORMAS DE PAGAMENTO =====
        function atualizarAnaliseFormasPagamento() {
            calcularEstatisticasPagamento();
            renderizarCardsPagamento();
            renderizarTabelaPagamento();
            renderizarGraficoComparacao();
        }

        function calcularEstatisticasPagamento() {
            const formasPagamento = {
                'Dinheiro': { total: 0, count: 0, icon: '💵', class: 'dinheiro' },
                'PIX': { total: 0, count: 0, icon: '📱', class: 'pix' },
                'Débito': { total: 0, count: 0, icon: '💳', class: 'debito' },
                'Crédito': { total: 0, count: 0, icon: '💳', class: 'credito' },
                'Crediário': { total: 0, count: 0, icon: '📋', class: 'crediario' }
            };

            let totalGeral = 0;

            filteredTransactions.forEach(trans => {
                const forma = trans.formaPagamento || 'Dinheiro';
                if (formasPagamento[forma]) {
                    formasPagamento[forma].total += trans.valor;
                    formasPagamento[forma].count++;
                    totalGeral += trans.valor;
                }
            });

            // Calcular porcentagens
            Object.keys(formasPagamento).forEach(forma => {
                const dados = formasPagamento[forma];
                dados.percentage = totalGeral > 0 ? (dados.total / totalGeral * 100) : 0;
                dados.avgTicket = dados.count > 0 ? dados.total / dados.count : 0;
            });

            return { formasPagamento, totalGeral };
        }

        function renderizarCardsPagamento() {
            const { formasPagamento, totalGeral } = calcularEstatisticasPagamento();
            const container = document.getElementById('paymentCardsGrid');

            if (totalGeral === 0) {
                container.innerHTML = '<div class="column is-12"><p class="has-text-centered has-text-grey">Nenhuma transação para analisar</p></div>';
                return;
            }

            const ordenado = Object.entries(formasPagamento)
                .sort((a, b) => b[1].total - a[1].total);

            container.innerHTML = ordenado.map(([nome, dados]) => {
                if (dados.count === 0) return '';
                
                return `
                    <div class="payment-method-card ${dados.class}">
                        <div class="payment-icon">${dados.icon}</div>
                        <div class="payment-name">${nome}</div>
                        <div class="payment-amount">${formatarMoeda(dados.total)}</div>
                        <div class="payment-percentage">
                            <i class="fas fa-chart-pie"></i> ${dados.percentage.toFixed(1)}% do total
                        </div>
                        <div class="payment-count">
                            <i class="fas fa-list"></i> ${dados.count} transação${dados.count !== 1 ? 'ões' : ''}
                        </div>
                        <div class="payment-count mt-1">
                            <i class="fas fa-ticket-alt"></i> Ticket médio: ${formatarMoeda(dados.avgTicket)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderizarTabelaPagamento() {
            const { formasPagamento } = calcularEstatisticasPagamento();
            const container = document.getElementById('paymentStatsTable');

            const ordenado = Object.entries(formasPagamento)
                .filter(([nome, dados]) => dados.count > 0)
                .sort((a, b) => b[1].total - a[1].total);

            if (ordenado.length === 0) {
                container.innerHTML = '<p class="has-text-centered has-text-grey">Nenhuma transação para analisar</p>';
                return;
            }

            container.innerHTML = ordenado.map(([nome, dados], index) => {
                const rankingClass = index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : '';
                const rankingText = index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`;
                
                return `
                    <div class="payment-stats-row">
                        <div class="payment-stats-icon">${dados.icon}</div>
                        <div class="payment-stats-info">
                            <div class="payment-stats-name">
                                ${nome}
                                <span class="payment-ranking ${rankingClass}">${rankingText}</span>
                            </div>
                            <div class="payment-stats-details">
                                ${dados.count} transação${dados.count !== 1 ? 'ões' : ''} • 
                                Ticket médio: ${formatarMoeda(dados.avgTicket)}
                            </div>
                        </div>
                        <div class="payment-stats-bar">
                            <progress class="progress is-primary" value="${dados.percentage}" max="100">
                                ${dados.percentage.toFixed(1)}%
                            </progress>
                        </div>
                        <div class="payment-stats-value">
                            ${formatarMoeda(dados.total)}
                            <br>
                            <small style="opacity: 0.8;">${dados.percentage.toFixed(1)}%</small>
                        </div>
                    </div>
                `;
            }).join('');

            // Atualizar estatísticas resumidas
            if (ordenado.length > 0) {
                const maisUsado = ordenado.reduce((a, b) => a[1].count > b[1].count ? a : b);
                const maiorValor = ordenado[0];
                const ticketMedio = ordenado.reduce((sum, [, dados]) => sum + dados.total, 0) / 
                                   ordenado.reduce((sum, [, dados]) => sum + dados.count, 0);

                document.getElementById('mostUsedPayment').innerHTML = `
                    ${maisUsado[1].icon} ${maisUsado[0]}
                    <br><small style="font-size: 0.6em; opacity: 0.8;">${maisUsado[1].count} transações</small>
                `;
                
                document.getElementById('highestValuePayment').innerHTML = `
                    ${maiorValor[1].icon} ${maiorValor[0]}
                    <br><small style="font-size: 0.6em; opacity: 0.8;">${formatarMoeda(maiorValor[1].total)}</small>
                `;
                
                document.getElementById('averageTicket').innerHTML = `
                    ${formatarMoeda(ticketMedio)}
                    <br><small style="font-size: 0.6em; opacity: 0.8;">por transação</small>
                `;
            }
        }

        function renderizarGraficoComparacao() {
            const ctx = document.getElementById('paymentComparisonChart');
            if (!ctx) return;

            const { formasPagamento } = calcularEstatisticasPagamento();

            const dados = Object.entries(formasPagamento)
                .filter(([nome, dados]) => dados.count > 0)
                .sort((a, b) => b[1].total - a[1].total);

            if (paymentComparisonChart) {
                paymentComparisonChart.destroy();
            }

            if (dados.length === 0) {
                return;
            }

            const labels = dados.map(([nome]) => nome);
            const valores = dados.map(([, dados]) => dados.total);
            const contagens = dados.map(([, dados]) => dados.count);

            const cores = {
                'Dinheiro': '#4CAF50',
                'PIX': '#2196F3',
                'Débito': '#FF9800',
                'Crédito': '#F44336',
                'Crediário': '#9C27B0'
            };

            const backgroundColors = labels.map(label => cores[label] || '#757575');

            paymentComparisonChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Valor Total (R$)',
                            data: valores,
                            backgroundColor: backgroundColors,
                            borderColor: backgroundColors,
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Quantidade de Transações',
                            data: contagens,
                            backgroundColor: 'rgba(102, 126, 234, 0.5)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 2,
                            type: 'line',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.datasetIndex === 0) {
                                        label += formatarMoeda(context.parsed.y);
                                    } else {
                                        label += context.parsed.y + ' transações';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toFixed(0);
                                }
                            },
                            title: {
                                display: true,
                                text: 'Valor Total (R$)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: {
                                stepSize: 1
                            },
                            title: {
                                display: true,
                                text: 'Quantidade'
                            }
                        }
                    }
                }
            });
        }

        function exportarPDF() {
            if (transactions.length === 0) {
                alert('Não há transações para exportar!');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text('Relatório Financeiro', 105, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 22, { align: 'center' });

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

            doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
        }
    