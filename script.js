
        let transactions = [];
        let editingIndex = -1;
        let categoryChart = null;
        let typeChart = null;
        let expenseChart = null;

        // Load data on page load
        window.onload = function() {
            carregarDados();
            document.getElementById('data').valueAsDate = new Date();
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
                atualizarInterface();
            }
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
                document.getElementById('valor').value = trans.valor;
                document.getElementById('data').value = trans.data;
            } else {
                modalTitle.textContent = 'Nova Transação';
                limparFormulario();
                document.getElementById('data').valueAsDate = new Date();
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
            document.getElementById('categoria').value = 'Salário';
            document.getElementById('valor').value = '';
            document.getElementById('data').value = '';
        }

        function salvarTransacao() {
            const tipo = document.getElementById('tipo').value;
            const descricao = document.getElementById('descricao').value.trim();
            const categoria = document.getElementById('categoria').value;
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
            atualizarInterface();
            closeModal();
        }

        function deletarTransacao(index) {
            if (confirm('Deseja realmente excluir esta transação?')) {
                transactions.splice(index, 1);
                salvarDados();
                atualizarInterface();
            }
        }

        function atualizarInterface() {
            atualizarEstatisticas();
            atualizarTabela();
            atualizarGraficos();
        }

        function atualizarGraficos() {
            atualizarGraficoCategoria();
            atualizarGraficoTipo();
            atualizarGraficoGastos();
        }

        function atualizarGraficoCategoria() {
            const ctx = document.getElementById('categoryChart');
            if (!ctx) return;

            // Calcular total por categoria
            const categorias = {};
            transactions.forEach(trans => {
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

            transactions.forEach(trans => {
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
            transactions.forEach(trans => {
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

        function atualizarEstatisticas() {
            let totalEntradas = 0;
            let totalSaidas = 0;

            transactions.forEach(trans => {
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
            
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="has-text-centered">Nenhuma transação registrada</td></tr>';
                return;
            }

            // Sort by date (most recent first)
            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.data) - new Date(a.data));

            tbody.innerHTML = sortedTransactions.map((trans, index) => {
                const originalIndex = transactions.findIndex(t => t.id === trans.id);
                const classType = trans.tipo === 'entrada' ? 'transaction-entrada' : 'transaction-saida';
                const typeIcon = trans.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down';
                const typeColor = trans.tipo === 'entrada' ? 'has-text-success' : 'has-text-danger';
                
                return `
                    <tr class="${classType}">
                        <td>${formatarData(trans.data)}</td>
                        <td>${trans.descricao}</td>
                        <td><span class="tag">${trans.categoria}</span></td>
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

            const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor'];
            const csvContent = [
                headers.join(','),
                ...transactions.map(trans => 
                    [trans.data, trans.tipo, `"${trans.descricao}"`, trans.categoria, trans.valor].join(',')
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

                const matches = line.match(/([^,]+),([^,]+),"([^"]+)",([^,]+),([^,]+)/);
                if (matches) {
                    const [, data, tipo, descricao, categoria, valor] = matches;
                    newTransactions.push({
                        data: data.trim(),
                        tipo: tipo.trim(),
                        descricao: descricao.trim(),
                        categoria: categoria.trim(),
                        valor: parseFloat(valor.trim()),
                        id: Date.now() + i
                    });
                }
            }

            if (newTransactions.length > 0) {
                transactions.push(...newTransactions);
                salvarDados();
                atualizarInterface();
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
                    valor: parseFloat(row.Valor) || 0,
                    id: Date.now() + index
                };
            }).filter(trans => trans.descricao && trans.valor > 0);

            if (newTransactions.length > 0) {
                transactions.push(...newTransactions);
                salvarDados();
                atualizarInterface();
                alert(`${newTransactions.length} transação(ões) importada(s) com sucesso!`);
            } else {
                alert('Nenhuma transação válida encontrada no arquivo!');
            }
        }

        function limparDados() {
            if (confirm('Deseja realmente excluir TODAS as transações? Esta ação não pode ser desfeita!')) {
                transactions = [];
                salvarDados();
                atualizarInterface();
                alert('Todos os dados foram excluídos!');
            }
        }
    