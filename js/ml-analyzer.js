class MLAnalyzer {
    constructor() {
        this.data = [];
        this.columns = [];
        this.analysisResults = {};
    }

    setData(data) {
        this.data = data;
        this.updateColumns();
    }

    updateColumns() {
        if (this.data.length > 0) {
            this.columns = this.data[0].map((header, index) => ({
                index: index,
                name: header,
                type: this.detectColumnType(index)
            }));
        }
    }

    detectColumnType(columnIndex) {
        if (this.data.length < 2) return 'text';
        
        const sampleValues = this.data.slice(1, 6).map(row => row[columnIndex]);
        const numericCount = sampleValues.filter(val => !isNaN(val) && val !== null && val !== '').length;
        
        return numericCount >= sampleValues.length * 0.7 ? 'number' : 'text';
    }

    getNumericColumns() {
        return this.columns.filter(col => col.type === 'number');
    }

    getColumnData(columnIndex, excludeHeader = true) {
        const startIndex = excludeHeader ? 1 : 0;
        return this.data.slice(startIndex).map(row => {
            const value = row[columnIndex];
            return this.columns[columnIndex].type === 'number' ? parseFloat(value) : value;
        }).filter(val => !isNaN(val) && val !== null && val !== '');
    }

    calculateStatistics(columnIndex) {
        const data = this.getColumnData(columnIndex);
        
        if (data.length === 0) {
            return { error: 'データが不足しています' };
        }

        const sorted = [...data].sort((a, b) => a - b);
        const n = data.length;
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        
        const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
        const standardDeviation = Math.sqrt(variance);
        
        const median = n % 2 === 0 
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
            : sorted[Math.floor(n/2)];
        
        const q1Index = Math.floor(n * 0.25);
        const q3Index = Math.floor(n * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;

        return {
            count: n,
            mean: mean,
            median: median,
            standardDeviation: standardDeviation,
            variance: variance,
            min: sorted[0],
            max: sorted[n-1],
            q1: q1,
            q3: q3,
            iqr: iqr,
            range: sorted[n-1] - sorted[0]
        };
    }

    calculateCorrelation(xColumnIndex, yColumnIndex) {
        const xData = this.getColumnData(xColumnIndex);
        const yData = this.getColumnData(yColumnIndex);
        
        const minLength = Math.min(xData.length, yData.length);
        const x = xData.slice(0, minLength);
        const y = yData.slice(0, minLength);
        
        if (x.length < 2) {
            return { error: 'データが不足しています' };
        }

        const xMean = x.reduce((a, b) => a + b, 0) / x.length;
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;
        
        let numerator = 0;
        let xVariance = 0;
        let yVariance = 0;
        
        for (let i = 0; i < x.length; i++) {
            const xDiff = x[i] - xMean;
            const yDiff = y[i] - yMean;
            numerator += xDiff * yDiff;
            xVariance += xDiff * xDiff;
            yVariance += yDiff * yDiff;
        }
        
        const denominator = Math.sqrt(xVariance * yVariance);
        const correlation = denominator === 0 ? 0 : numerator / denominator;
        
        return {
            correlation: correlation,
            strength: this.getCorrelationStrength(correlation),
            interpretation: this.getCorrelationInterpretation(correlation)
        };
    }

    getCorrelationStrength(r) {
        const abs = Math.abs(r);
        if (abs >= 0.7) return '強い';
        if (abs >= 0.3) return '中程度';
        return '弱い';
    }

    getCorrelationInterpretation(r) {
        if (r > 0.7) return '強い正の相関';
        if (r > 0.3) return '中程度の正の相関';
        if (r > 0) return '弱い正の相関';
        if (r > -0.3) return '弱い負の相関';
        if (r > -0.7) return '中程度の負の相関';
        return '強い負の相関';
    }

    performLinearRegression(xColumnIndex, yColumnIndex) {
        try {
            const xData = this.getColumnData(xColumnIndex);
            const yData = this.getColumnData(yColumnIndex);
            
            const minLength = Math.min(xData.length, yData.length);
            const x = xData.slice(0, minLength);
            const y = yData.slice(0, minLength);
            
            if (x.length < 2) {
                return { error: 'データが不足しています' };
            }

            // 単純線形回帰の計算
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            // R²値の計算
            const yMean = sumY / n;
            const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
            const residualSumSquares = x.reduce((sum, xi, i) => {
                const predicted = slope * xi + intercept;
                return sum + Math.pow(y[i] - predicted, 2);
            }, 0);
            
            const rSquared = 1 - (residualSumSquares / totalSumSquares);
            
            // 予測値の生成
            const predictions = x.map(xi => slope * xi + intercept);
            
            return {
                slope: slope,
                intercept: intercept,
                rSquared: rSquared,
                equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
                predictions: predictions,
                originalX: x,
                originalY: y
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    performKMeansClusteringSimple(xColumnIndex, yColumnIndex, k = 3) {
        try {
            const xData = this.getColumnData(xColumnIndex);
            const yData = this.getColumnData(yColumnIndex);
            
            const minLength = Math.min(xData.length, yData.length);
            const points = [];
            
            for (let i = 0; i < minLength; i++) {
                points.push([xData[i], yData[i]]);
            }
            
            if (points.length < k) {
                return { error: `データ点数(${points.length})がクラスター数(${k})より少ないです` };
            }

            // Simple K-means implementation
            const clusters = this.simpleKMeans(points, k);
            
            return {
                clusters: clusters,
                k: k,
                points: points,
                centroids: clusters.map(cluster => cluster.centroid)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    simpleKMeans(points, k, maxIterations = 100) {
        // 初期重心をランダムに選択
        const centroids = [];
        for (let i = 0; i < k; i++) {
            const randomIndex = Math.floor(Math.random() * points.length);
            centroids.push([...points[randomIndex]]);
        }

        let clusters = [];
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // クラスターを初期化
            clusters = Array(k).fill().map(() => ({ points: [], centroid: [] }));
            
            // 各点を最も近い重心に割り当て
            points.forEach(point => {
                let minDistance = Infinity;
                let closestCluster = 0;
                
                centroids.forEach((centroid, index) => {
                    const distance = Math.sqrt(
                        Math.pow(point[0] - centroid[0], 2) + 
                        Math.pow(point[1] - centroid[1], 2)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCluster = index;
                    }
                });
                
                clusters[closestCluster].points.push(point);
            });
            
            // 新しい重心を計算
            let converged = true;
            clusters.forEach((cluster, index) => {
                if (cluster.points.length > 0) {
                    const newCentroid = [
                        cluster.points.reduce((sum, p) => sum + p[0], 0) / cluster.points.length,
                        cluster.points.reduce((sum, p) => sum + p[1], 0) / cluster.points.length
                    ];
                    
                    if (Math.abs(newCentroid[0] - centroids[index][0]) > 0.001 ||
                        Math.abs(newCentroid[1] - centroids[index][1]) > 0.001) {
                        converged = false;
                    }
                    
                    centroids[index] = newCentroid;
                    cluster.centroid = newCentroid;
                }
            });
            
            if (converged) break;
        }
        
        return clusters;
    }

    detectOutliers(columnIndex, method = 'iqr') {
        const data = this.getColumnData(columnIndex);
        const stats = this.calculateStatistics(columnIndex);
        
        if (stats.error) return stats;
        
        let outliers = [];
        
        if (method === 'iqr') {
            const lowerBound = stats.q1 - 1.5 * stats.iqr;
            const upperBound = stats.q3 + 1.5 * stats.iqr;
            
            data.forEach((value, index) => {
                if (value < lowerBound || value > upperBound) {
                    outliers.push({ index: index + 1, value: value, type: value < lowerBound ? 'low' : 'high' });
                }
            });
        } else if (method === 'zscore') {
            const threshold = 2;
            data.forEach((value, index) => {
                const zscore = Math.abs((value - stats.mean) / stats.standardDeviation);
                if (zscore > threshold) {
                    outliers.push({ index: index + 1, value: value, zscore: zscore });
                }
            });
        }
        
        return {
            outliers: outliers,
            method: method,
            totalCount: data.length,
            outlierCount: outliers.length,
            outlierPercentage: (outliers.length / data.length * 100).toFixed(2)
        };
    }

    generateInsights(analysisType, result) {
        const insights = [];
        
        switch (analysisType) {
            case 'statistics':
                if (result.standardDeviation / result.mean > 0.5) {
                    insights.push('データのばらつきが大きいです');
                }
                if (Math.abs(result.mean - result.median) > result.standardDeviation * 0.5) {
                    insights.push('データに歪みがある可能性があります');
                }
                break;
                
            case 'correlation':
                if (Math.abs(result.correlation) > 0.7) {
                    insights.push('変数間に強い関係があります');
                }
                break;
                
            case 'regression':
                if (result.rSquared > 0.8) {
                    insights.push('予測モデルの精度が高いです');
                } else if (result.rSquared < 0.3) {
                    insights.push('線形関係が弱い可能性があります');
                }
                break;
        }
        
        return insights;
    }
}