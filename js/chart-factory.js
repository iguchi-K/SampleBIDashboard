class ChartFactory {
    static chartTypes = {
        'bar': BarChart,
        'pie': PieChart,
        'scatter': ScatterChart,
        'line': LineChart,
        'stacked-bar': StackedBarChart,
        'donut': DonutChart
    };

    static getAvailableChartTypes() {
        return Object.keys(this.chartTypes);
    }

    static getChartTypeDisplayName(type) {
        const displayNames = {
            'bar': '棒グラフ',
            'pie': '円グラフ',
            'scatter': '散布図',
            'line': '線グラフ',
            'stacked-bar': '積み上げ棒グラフ',
            'donut': 'ドーナツグラフ'
        };
        return displayNames[type] || type;
    }

    static createChart(type, containerId, data, config = {}) {
        const ChartClass = this.chartTypes[type];
        
        if (!ChartClass) {
            throw new Error(`Unsupported chart type: ${type}`);
        }

        if (!containerId) {
            throw new Error('Container ID is required');
        }

        if (!data || !Array.isArray(data)) {
            throw new Error('Data must be an array');
        }

        try {
            return new ChartClass(containerId, data, config);
        } catch (error) {
            console.error(`Error creating ${type} chart:`, error);
            throw error;
        }
    }

    static isValidChartType(type) {
        return type in this.chartTypes;
    }

    static registerChartType(type, ChartClass) {
        if (typeof ChartClass !== 'function') {
            throw new Error('ChartClass must be a constructor function');
        }
        
        if (!ChartClass.prototype.render) {
            throw new Error('ChartClass must implement render method');
        }

        this.chartTypes[type] = ChartClass;
    }

    static getChartConfig(type, data) {
        if (!this.isValidChartType(type)) {
            throw new Error(`Invalid chart type: ${type}`);
        }

        const baseConfig = {
            xColumn: 0,
            yColumn: 2,
            title: '',
            xLabel: '',
            yLabel: '',
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
        };

        const typeSpecificConfig = {
            'bar': {
                orientation: 'vertical'
            },
            'pie': {
                showHole: false
            },
            'scatter': {
                showTrendline: false
            },
            'line': {
                showMarkers: true
            },
            'stacked-bar': {
                groupByColumn: 1
            },
            'donut': {
                showHole: true
            }
        };

        return {
            ...baseConfig,
            ...(typeSpecificConfig[type] || {})
        };
    }
}

class ChartManager {
    constructor() {
        this.charts = new Map();
    }

    createChart(id, type, containerId, data, config = {}) {
        try {
            const chart = ChartFactory.createChart(type, containerId, data, config);
            this.charts.set(id, chart);
            return chart;
        } catch (error) {
            console.error(`Failed to create chart ${id}:`, error);
            throw error;
        }
    }

    getChart(id) {
        return this.charts.get(id);
    }

    updateChart(id, newData) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.updateData(newData);
        } else {
            console.warn(`Chart ${id} not found`);
        }
    }

    removeChart(id) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.clear();
            this.charts.delete(id);
        }
    }

    clearAll() {
        this.charts.forEach(chart => chart.clear());
        this.charts.clear();
    }

    listCharts() {
        return Array.from(this.charts.keys());
    }

    resizeChart(id) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.resize();
        }
    }

    resizeAll() {
        this.charts.forEach(chart => chart.resize());
    }
}