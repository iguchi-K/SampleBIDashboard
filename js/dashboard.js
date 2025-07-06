class Dashboard {
    constructor() {
        this.handsonTable = null;
        this.chartManager = new ChartManager();
        this.currentChartId = 'main-chart';
        this.dataFilter = new DataFilter();
        this.mlAnalyzer = new MLAnalyzer();
        this.sampleData = [
            ['商品名', 'カテゴリ', '売上', '数量'],
            ['商品A', '家電', 150000, 25],
            ['商品B', '家電', 220000, 40],
            ['商品C', '衣料', 80000, 60],
            ['商品D', '食品', 120000, 100],
            ['商品E', '家電', 180000, 30],
            ['商品F', '衣料', 95000, 75],
            ['商品G', '食品', 140000, 90],
            ['商品H', '家電', 260000, 35],
            ['商品I', '衣料', 70000, 50],
            ['商品J', '食品', 110000, 80],
            ['商品K', '家電', 190000, 28],
            ['商品L', '書籍', 45000, 150],
            ['商品M', '衣料', 85000, 65],
            ['商品N', '食品', 98000, 85],
            ['商品O', '家電', 310000, 45],
            ['商品P', '書籍', 52000, 120],
            ['商品Q', '衣料', 125000, 95],
            ['商品R', '食品', 76000, 70],
            ['商品S', '家電', 240000, 38],
            ['商品T', '書籍', 38000, 180],
            ['商品U', '衣料', 92000, 55],
            ['商品V', '食品', 145000, 110],
            ['商品W', '家電', 205000, 42],
            ['商品X', '書籍', 61000, 95],
            ['商品Y', '衣料', 105000, 88],
            ['商品Z', '食品', 133000, 105]
        ];
    }

    init() {
        this.initializeTable();
        this.initializeControls();
        this.initializeFilter();
        this.drawChart();
        this.setupEventListeners();
    }

    initializeTable() {
        this.handsonTable = new Handsontable(document.getElementById('handsontable'), {
            data: this.sampleData,
            rowHeaders: true,
            colHeaders: true,
            width: '100%',
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            contextMenu: true,
            copyPaste: true,
            manualColumnResize: true,
            manualRowResize: true,
            cells: (row, col) => {
                if (row === 0) {
                    return {
                        renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            td.style.fontWeight = 'bold';
                            td.style.backgroundColor = '#f0f0f0';
                            td.innerHTML = value;
                            return td;
                        }
                    };
                }
                if (col >= 2 && row > 0) {
                    return {
                        type: 'numeric',
                        numericFormat: {
                            pattern: '0,0'
                        }
                    };
                }
            }
        });
    }

    initializeControls() {
        const chartTypeSelect = document.getElementById('chartType');
        chartTypeSelect.innerHTML = '';
        
        ChartFactory.getAvailableChartTypes().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = ChartFactory.getChartTypeDisplayName(type);
            chartTypeSelect.appendChild(option);
        });

        this.updateColumnSelects();
    }

    updateColumnSelects() {
        const data = this.handsonTable.getData();
        const headers = data[0] || [];
        
        const selects = [
            'xColumn', 'yColumn', 'sortColumn', 'analysisX', 'analysisY'
        ];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '';
                headers.forEach((header, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = header;
                    select.appendChild(option);
                });
            }
        });
        
        document.getElementById('xColumn').value = '0';
        document.getElementById('yColumn').value = '2';
        document.getElementById('sortColumn').value = '2';
        document.getElementById('analysisX').value = '2'; // 売上
        document.getElementById('analysisY').value = '3'; // 数量
    }

    initializeFilter() {
        const data = this.handsonTable.getData();
        this.dataFilter.setData(data);
        this.mlAnalyzer.setData(data);
    }

    setupEventListeners() {
        document.getElementById('drawButton').addEventListener('click', () => {
            this.drawChart();
        });

        document.getElementById('chartType').addEventListener('change', () => {
            this.drawChart();
        });

        window.addEventListener('resize', () => {
            this.chartManager.resizeAll();
        });

        this.handsonTable.addHook('afterChange', (changes, source) => {
            if (source === 'edit') {
                this.updateColumnSelects();
                this.initializeFilter();
            }
        });

        document.getElementById('runAnalysis').addEventListener('click', () => {
            this.runMLAnalysis();
        });

        document.getElementById('analysisType').addEventListener('change', (e) => {
            const clusteringOptions = document.getElementById('clusteringOptions');
            clusteringOptions.style.display = e.target.value === 'clustering' ? 'block' : 'none';
        });
    }

    drawChart() {
        try {
            // フィルタリングされたデータを使用
            const filteredData = this.dataFilter.getFilteredData();
            const chartType = document.getElementById('chartType').value;
            const xColumnIndex = parseInt(document.getElementById('xColumn').value);
            const yColumnIndex = parseInt(document.getElementById('yColumn').value);
            
            if (!filteredData || filteredData.length < 2) {
                throw new Error('データが不足しています');
            }

            const config = ChartFactory.getChartConfig(chartType, filteredData);
            config.xColumn = xColumnIndex;
            config.yColumn = yColumnIndex;

            if (chartType === 'stacked-bar') {
                const groupBySelect = document.getElementById('groupByColumn');
                if (groupBySelect) {
                    config.groupByColumn = parseInt(groupBySelect.value);
                } else {
                    config.groupByColumn = 1;
                }
            }

            this.chartManager.removeChart(this.currentChartId);
            
            const chart = this.chartManager.createChart(
                this.currentChartId,
                chartType,
                'chart',
                filteredData,
                config
            );
            
            chart.render();
            
        } catch (error) {
            console.error('Chart drawing error:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        const container = document.getElementById('chart');
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                <div style="text-align: center;">
                    <h3>エラーが発生しました</h3>
                    <p>${message}</p>
                    <button onclick="dashboard.drawChart()" style="padding: 8px 16px; margin-top: 10px;">
                        再試行
                    </button>
                </div>
            </div>
        `;
    }

    exportData() {
        const data = this.handsonTable.getData();
        const csv = data.map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'chart-data.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const rows = csv.split('\n').map(row => row.split(','));
                
                if (rows.length > 0) {
                    this.handsonTable.loadData(rows);
                    this.updateColumnSelects();
                    this.drawChart();
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showError('ファイルの読み込みに失敗しました');
            }
        };
        reader.readAsText(file);
    }

    resetData() {
        this.handsonTable.loadData(this.sampleData);
        this.updateColumnSelects();
        this.initializeFilter();
        this.drawChart();
    }

    runMLAnalysis() {
        try {
            const analysisType = document.getElementById('analysisType').value;
            const xColumn = parseInt(document.getElementById('analysisX').value);
            const yColumn = parseInt(document.getElementById('analysisY').value);
            
            // フィルタリングされたデータを使用
            const filteredData = this.dataFilter.getFilteredData();
            this.mlAnalyzer.setData(filteredData);
            
            let result;
            
            switch (analysisType) {
                case 'statistics':
                    result = this.mlAnalyzer.calculateStatistics(xColumn);
                    this.displayStatisticsResult(result, xColumn);
                    break;
                    
                case 'correlation':
                    result = this.mlAnalyzer.calculateCorrelation(xColumn, yColumn);
                    this.displayCorrelationResult(result, xColumn, yColumn);
                    break;
                    
                case 'regression':
                    result = this.mlAnalyzer.performLinearRegression(xColumn, yColumn);
                    this.displayRegressionResult(result, xColumn, yColumn);
                    break;
                    
                case 'clustering':
                    const k = parseInt(document.getElementById('clusterCount').value);
                    result = this.mlAnalyzer.performKMeansClusteringSimple(xColumn, yColumn, k);
                    this.displayClusteringResult(result, xColumn, yColumn);
                    break;
                    
                case 'outliers':
                    result = this.mlAnalyzer.detectOutliers(xColumn);
                    this.displayOutliersResult(result, xColumn);
                    break;
            }
            
        } catch (error) {
            console.error('ML Analysis error:', error);
            this.showAnalysisError(error.message);
        }
    }

    displayStatisticsResult(result, columnIndex) {
        const columnName = this.mlAnalyzer.columns[columnIndex]?.name || `Column ${columnIndex}`;
        const resultsDiv = document.getElementById('analysisResults');
        
        if (result.error) {
            resultsDiv.innerHTML = `<strong>エラー:</strong> ${result.error}`;
            resultsDiv.style.display = 'block';
            return;
        }
        
        resultsDiv.innerHTML = `
            <strong>${columnName}の統計サマリー</strong>
            <table style="width: 100%; margin-top: 10px; font-size: 12px;">
                <tr><td>データ数:</td><td>${result.count}</td></tr>
                <tr><td>平均:</td><td>${result.mean.toFixed(2)}</td></tr>
                <tr><td>中央値:</td><td>${result.median.toFixed(2)}</td></tr>
                <tr><td>標準偏差:</td><td>${result.standardDeviation.toFixed(2)}</td></tr>
                <tr><td>最小値:</td><td>${result.min}</td></tr>
                <tr><td>最大値:</td><td>${result.max}</td></tr>
                <tr><td>第1四分位:</td><td>${result.q1}</td></tr>
                <tr><td>第3四分位:</td><td>${result.q3}</td></tr>
                <tr><td>範囲:</td><td>${result.range}</td></tr>
            </table>
        `;
        resultsDiv.style.display = 'block';
    }

    displayCorrelationResult(result, xColumn, yColumn) {
        const xName = this.mlAnalyzer.columns[xColumn]?.name || `Column ${xColumn}`;
        const yName = this.mlAnalyzer.columns[yColumn]?.name || `Column ${yColumn}`;
        const resultsDiv = document.getElementById('analysisResults');
        
        if (result.error) {
            resultsDiv.innerHTML = `<strong>エラー:</strong> ${result.error}`;
            resultsDiv.style.display = 'block';
            return;
        }
        
        resultsDiv.innerHTML = `
            <strong>${xName} と ${yName} の相関分析</strong>
            <div style="margin-top: 10px;">
                <p>相関係数: <strong>${result.correlation.toFixed(4)}</strong></p>
                <p>強さ: <strong>${result.strength}</strong></p>
                <p>解釈: ${result.interpretation}</p>
            </div>
        `;
        resultsDiv.style.display = 'block';
    }

    displayRegressionResult(result, xColumn, yColumn) {
        const xName = this.mlAnalyzer.columns[xColumn]?.name || `Column ${xColumn}`;
        const yName = this.mlAnalyzer.columns[yColumn]?.name || `Column ${yColumn}`;
        const resultsDiv = document.getElementById('analysisResults');
        
        if (result.error) {
            resultsDiv.innerHTML = `<strong>エラー:</strong> ${result.error}`;
            resultsDiv.style.display = 'block';
            return;
        }
        
        resultsDiv.innerHTML = `
            <strong>${xName} → ${yName} の線形回帰分析</strong>
            <div style="margin-top: 10px;">
                <p>回帰式: <strong>${result.equation}</strong></p>
                <p>決定係数(R²): <strong>${result.rSquared.toFixed(4)}</strong></p>
                <p>傾き: ${result.slope.toFixed(4)}</p>
                <p>切片: ${result.intercept.toFixed(4)}</p>
                ${result.rSquared > 0.8 ? '<p style="color: green;">高い予測精度</p>' : ''}
                ${result.rSquared < 0.3 ? '<p style="color: orange;">線形関係が弱い</p>' : ''}
            </div>
        `;
        resultsDiv.style.display = 'block';
        
        // 回帰線をグラフに描画
        this.drawRegressionChart(result, xColumn, yColumn);
    }

    displayClusteringResult(result, xColumn, yColumn) {
        const xName = this.mlAnalyzer.columns[xColumn]?.name || `Column ${xColumn}`;
        const yName = this.mlAnalyzer.columns[yColumn]?.name || `Column ${yColumn}`;
        const resultsDiv = document.getElementById('analysisResults');
        
        if (result.error) {
            resultsDiv.innerHTML = `<strong>エラー:</strong> ${result.error}`;
            resultsDiv.style.display = 'block';
            return;
        }
        
        const clusterSizes = result.clusters.map(cluster => cluster.points.length);
        
        resultsDiv.innerHTML = `
            <strong>${xName} と ${yName} のクラスタリング分析</strong>
            <div style="margin-top: 10px;">
                <p>クラスター数: <strong>${result.k}</strong></p>
                <p>各クラスターのサイズ: ${clusterSizes.join(', ')}</p>
                <p>総データ点数: ${result.points.length}</p>
            </div>
        `;
        resultsDiv.style.display = 'block';
        
        // クラスタリング結果をグラフに描画
        this.drawClusteringChart(result, xColumn, yColumn);
    }

    displayOutliersResult(result, columnIndex) {
        const columnName = this.mlAnalyzer.columns[columnIndex]?.name || `Column ${columnIndex}`;
        const resultsDiv = document.getElementById('analysisResults');
        
        if (result.error) {
            resultsDiv.innerHTML = `<strong>エラー:</strong> ${result.error}`;
            resultsDiv.style.display = 'block';
            return;
        }
        
        const outliersList = result.outliers.length > 0 
            ? result.outliers.slice(0, 5).map(o => `行${o.index}: ${o.value}`).join('<br>')
            : 'なし';
        
        resultsDiv.innerHTML = `
            <strong>${columnName} の異常値検知</strong>
            <div style="margin-top: 10px;">
                <p>検知手法: ${result.method === 'iqr' ? 'IQR法' : 'Z-score法'}</p>
                <p>異常値数: <strong>${result.outlierCount}</strong> / ${result.totalCount}</p>
                <p>異常値率: <strong>${result.outlierPercentage}%</strong></p>
                <p>異常値 (最初の5件):<br>${outliersList}</p>
            </div>
        `;
        resultsDiv.style.display = 'block';
    }

    drawRegressionChart(result, xColumn, yColumn) {
        const xName = this.mlAnalyzer.columns[xColumn]?.name || `Column ${xColumn}`;
        const yName = this.mlAnalyzer.columns[yColumn]?.name || `Column ${yColumn}`;
        
        const actualTrace = {
            x: result.originalX,
            y: result.originalY,
            mode: 'markers',
            type: 'scatter',
            name: '実測値',
            marker: { color: 'blue', size: 8 }
        };
        
        const regressionTrace = {
            x: result.originalX,
            y: result.predictions,
            mode: 'lines',
            type: 'scatter',
            name: '回帰線',
            line: { color: 'red', width: 2 }
        };
        
        const layout = {
            title: `回帰分析: ${xName} vs ${yName}`,
            xaxis: { title: xName },
            yaxis: { title: yName },
            margin: { t: 50, r: 50, b: 100, l: 100 }
        };
        
        Plotly.newPlot('chart', [actualTrace, regressionTrace], layout, { responsive: true });
    }

    drawClusteringChart(result, xColumn, yColumn) {
        const xName = this.mlAnalyzer.columns[xColumn]?.name || `Column ${xColumn}`;
        const yName = this.mlAnalyzer.columns[yColumn]?.name || `Column ${yColumn}`;
        
        const colors = ['red', 'blue', 'green', 'purple', 'orange', 'brown', 'pink', 'gray', 'olive', 'cyan'];
        const traces = [];
        
        // クラスターごとの点を描画
        result.clusters.forEach((cluster, index) => {
            if (cluster.points.length > 0) {
                traces.push({
                    x: cluster.points.map(p => p[0]),
                    y: cluster.points.map(p => p[1]),
                    mode: 'markers',
                    type: 'scatter',
                    name: `クラスター ${index + 1}`,
                    marker: { 
                        color: colors[index % colors.length], 
                        size: 8 
                    }
                });
                
                // 重心を描画
                traces.push({
                    x: [cluster.centroid[0]],
                    y: [cluster.centroid[1]],
                    mode: 'markers',
                    type: 'scatter',
                    name: `重心 ${index + 1}`,
                    marker: { 
                        color: colors[index % colors.length], 
                        size: 15,
                        symbol: 'x'
                    }
                });
            }
        });
        
        const layout = {
            title: `クラスタリング: ${xName} vs ${yName}`,
            xaxis: { title: xName },
            yaxis: { title: yName },
            margin: { t: 50, r: 50, b: 100, l: 100 }
        };
        
        Plotly.newPlot('chart', traces, layout, { responsive: true });
    }

    showAnalysisError(message) {
        const resultsDiv = document.getElementById('analysisResults');
        resultsDiv.innerHTML = `<strong>エラー:</strong> ${message}`;
        resultsDiv.style.display = 'block';
    }
}

let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.init();
});