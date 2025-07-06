class BarChart extends Chart {
    constructor(containerId, data, config = {}) {
        super(containerId, data, config);
        this.orientation = config.orientation || 'vertical';
    }

    render() {
        try {
            const filteredData = this.validateData();
            const xValues = this.getColumnData(this.config.xColumn, filteredData);
            const yValues = this.getColumnData(this.config.yColumn, filteredData);

            this.plotData = [{
                x: this.orientation === 'vertical' ? xValues : yValues,
                y: this.orientation === 'vertical' ? yValues : xValues,
                type: 'bar',
                orientation: this.orientation === 'vertical' ? 'v' : 'h',
                marker: {
                    color: this.config.colors[0],
                    line: {
                        color: this.config.colors[0],
                        width: 1
                    }
                }
            }];

            this.layout = {
                title: this.config.title || `棒グラフ: ${this.getColumnHeader(this.config.xColumn)} vs ${this.getColumnHeader(this.config.yColumn)}`,
                xaxis: { title: this.config.xLabel || this.getColumnHeader(this.config.xColumn) },
                yaxis: { title: this.config.yLabel || this.getColumnHeader(this.config.yColumn) },
                margin: { t: 50, r: 50, b: 100, l: 100 }
            };

            Plotly.newPlot(this.containerId, this.plotData, this.layout, this.getPlotConfig());
        } catch (error) {
            this.onError(error);
        }
    }
}

class PieChart extends Chart {
    constructor(containerId, data, config = {}) {
        super(containerId, data, config);
        this.showHole = config.showHole || false;
    }

    render() {
        try {
            const filteredData = this.validateData();
            const labels = this.getColumnData(this.config.xColumn, filteredData);
            const values = this.getColumnData(this.config.yColumn, filteredData);

            this.plotData = [{
                values: values,
                labels: labels,
                type: 'pie',
                hole: this.showHole ? 0.3 : 0,
                marker: {
                    colors: this.config.colors
                }
            }];

            this.layout = {
                title: this.config.title || `円グラフ: ${this.getColumnHeader(this.config.yColumn)}の分布`,
                margin: { t: 50, r: 50, b: 50, l: 50 }
            };

            Plotly.newPlot(this.containerId, this.plotData, this.layout, this.getPlotConfig());
        } catch (error) {
            this.onError(error);
        }
    }
}

class ScatterChart extends Chart {
    constructor(containerId, data, config = {}) {
        super(containerId, data, config);
        this.showTrendline = config.showTrendline || false;
    }

    render() {
        try {
            const filteredData = this.validateData();
            const xValues = this.getColumnData(this.config.xColumn, filteredData);
            const yValues = this.getColumnData(this.config.yColumn, filteredData);

            this.plotData = [{
                x: xValues,
                y: yValues,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: this.config.colors[0],
                    size: 8,
                    line: {
                        color: 'white',
                        width: 1
                    }
                }
            }];

            this.layout = {
                title: this.config.title || `散布図: ${this.getColumnHeader(this.config.xColumn)} vs ${this.getColumnHeader(this.config.yColumn)}`,
                xaxis: { title: this.config.xLabel || this.getColumnHeader(this.config.xColumn) },
                yaxis: { title: this.config.yLabel || this.getColumnHeader(this.config.yColumn) },
                margin: { t: 50, r: 50, b: 100, l: 100 }
            };

            Plotly.newPlot(this.containerId, this.plotData, this.layout, this.getPlotConfig());
        } catch (error) {
            this.onError(error);
        }
    }
}

class LineChart extends Chart {
    constructor(containerId, data, config = {}) {
        super(containerId, data, config);
        this.showMarkers = config.showMarkers !== false;
    }

    render() {
        try {
            const filteredData = this.validateData();
            const xValues = this.getColumnData(this.config.xColumn, filteredData);
            const yValues = this.getColumnData(this.config.yColumn, filteredData);

            this.plotData = [{
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: this.showMarkers ? 'lines+markers' : 'lines',
                line: {
                    color: this.config.colors[0],
                    width: 3
                },
                marker: {
                    color: this.config.colors[0],
                    size: 6
                }
            }];

            this.layout = {
                title: this.config.title || `線グラフ: ${this.getColumnHeader(this.config.xColumn)} vs ${this.getColumnHeader(this.config.yColumn)}`,
                xaxis: { title: this.config.xLabel || this.getColumnHeader(this.config.xColumn) },
                yaxis: { title: this.config.yLabel || this.getColumnHeader(this.config.yColumn) },
                margin: { t: 50, r: 50, b: 100, l: 100 }
            };

            Plotly.newPlot(this.containerId, this.plotData, this.layout, this.getPlotConfig());
        } catch (error) {
            this.onError(error);
        }
    }
}

class StackedBarChart extends Chart {
    constructor(containerId, data, config = {}) {
        super(containerId, data, config);
        this.groupByColumn = config.groupByColumn || 0;
    }

    render() {
        try {
            const filteredData = this.validateData();
            const groups = [...new Set(this.getColumnData(this.groupByColumn, filteredData))];
            const xValues = this.getColumnData(this.config.xColumn, filteredData);
            const yValues = this.getColumnData(this.config.yColumn, filteredData);
            const groupValues = this.getColumnData(this.groupByColumn, filteredData);

            this.plotData = groups.map((group, index) => {
                const groupIndices = groupValues.map((val, idx) => val === group ? idx : -1)
                    .filter(idx => idx !== -1);
                
                return {
                    x: groupIndices.map(idx => xValues[idx]),
                    y: groupIndices.map(idx => yValues[idx]),
                    name: group,
                    type: 'bar',
                    marker: {
                        color: this.config.colors[index % this.config.colors.length]
                    }
                };
            });

            this.layout = {
                title: this.config.title || `積み上げ棒グラフ: ${this.getColumnHeader(this.config.xColumn)} vs ${this.getColumnHeader(this.config.yColumn)}`,
                xaxis: { title: this.config.xLabel || this.getColumnHeader(this.config.xColumn) },
                yaxis: { title: this.config.yLabel || this.getColumnHeader(this.config.yColumn) },
                barmode: 'stack',
                margin: { t: 50, r: 50, b: 100, l: 100 }
            };

            Plotly.newPlot(this.containerId, this.plotData, this.layout, this.getPlotConfig());
        } catch (error) {
            this.onError(error);
        }
    }
}

class DonutChart extends PieChart {
    constructor(containerId, data, config = {}) {
        super(containerId, data, { ...config, showHole: true });
    }

    render() {
        super.render();
        if (this.layout) {
            this.layout.title = this.config.title || `ドーナツグラフ: ${this.getColumnHeader(this.config.yColumn)}の分布`;
        }
    }
}