class Chart {
    constructor(containerId, data, config = {}) {
        this.containerId = containerId;
        this.data = data;
        this.config = {
            title: '',
            xLabel: '',
            yLabel: '',
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            ...config
        };
        this.plotData = null;
        this.layout = null;
    }

    validateData() {
        if (!this.data || !Array.isArray(this.data) || this.data.length < 2) {
            throw new Error('Invalid data: データが不正です');
        }
        
        const dataRows = this.data.slice(1);
        if (dataRows.length === 0) {
            throw new Error('No data rows: データ行がありません');
        }
        
        return dataRows.filter(row => row.some(cell => cell !== null && cell !== ''));
    }

    getColumnData(columnIndex, filteredData = null) {
        const dataToUse = filteredData || this.validateData();
        return dataToUse.map(row => row[columnIndex]);
    }

    getColumnHeader(columnIndex) {
        return this.data[0][columnIndex] || `Column ${columnIndex + 1}`;
    }

    setTitle(title) {
        this.config.title = title;
        return this;
    }

    setLabels(xLabel, yLabel) {
        this.config.xLabel = xLabel;
        this.config.yLabel = yLabel;
        return this;
    }

    setColors(colors) {
        this.config.colors = colors;
        return this;
    }

    getPlotConfig() {
        return {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'chart',
                height: 500,
                width: 800,
                scale: 1
            }
        };
    }

    render() {
        throw new Error('render method must be implemented by subclass');
    }

    updateData(newData) {
        this.data = newData;
        this.render();
    }

    clear() {
        Plotly.purge(this.containerId);
    }

    resize() {
        Plotly.Plots.resize(this.containerId);
    }

    onError(error) {
        console.error('Chart Error:', error);
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="text-align: center;">
                        <h3>グラフの表示でエラーが発生しました</h3>
                        <p>${error.message}</p>
                    </div>
                </div>
            `;
        }
    }
}